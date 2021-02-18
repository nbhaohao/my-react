/**
 * 返回真实 DOM
 * @param element
 * @returns {undefined}
 */
import { MY_REACT_TEXT_ELEMENT_TYPE , MY_REACT_EFFECT_INIT} from "./const";

let nextUnitOfWork = null; // 下个工作任务
let workInProgressFiber = null; // 当前工作的任务

function updateNode(node, props) {
  Object.keys(props)
    .filter((propName) => propName !== "children")
    .forEach((propName) => {
      node[propName] = props[propName];
    });
}

// 处理 children
// function reconcileChildren(children, node) {
//   children.forEach((child) => {
//     render(child, node);
//   });
// }

function createClassComponentNode(element) {
  const vNode = new element.type(element.props).render();
  return createNode(vNode);
}

function createFCNode(element) {
  const vNode = element.type(element.props);
  return createNode(vNode);
}

function createNode(element) {
  const { type, props } = element;
  let node;
  if (type === MY_REACT_TEXT_ELEMENT_TYPE) {
    node = document.createTextNode("");
  } else if (typeof type === "function") {
    node = type.prototype.isReactElement
      ? createClassComponentNode(element)
      : createFCNode(element);
  } else if (typeof type === "string") {
    node = document.createElement(type);
  }
  updateNode(node, props);

  // reconcileChildren(element.props.children, node);

  return node;
}

function reconcileChildren(workInProgressFiber, children) {
  let prevSibling = null;
  children.forEach((child, index) => {
    let newFiber = {
      type: child.type,
      props: child.props,
      node: null,
      base: null,
      return: workInProgressFiber,
      effectTag: MY_REACT_EFFECT_INIT,
    };
    if (index === 0) {
      workInProgressFiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
  });
}

function updateHostComponent(fiber) {
  if (!fiber.node) {
    fiber.node = createNode(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
}

function updateFunctionComponent_fiber(fiber) {
  const { type, props } = fiber;
  const children = [type(props)];
  reconcileChildren(fiber, children);
}

function updateClassComponent_fiber(fiber) {
  const { type, props } = fiber;
  const children = [new type(props).render()];
  reconcileChildren(fiber, children);
}

function performUnitOrWork(fiber) {
  const { type } = fiber;

  if (typeof type === "function") {
    type.prototype.isReactElement
      ? updateClassComponent_fiber(fiber)
      : updateFunctionComponent_fiber(fiber);
  } else {
    updateHostComponent(fiber);
  }

  // 获取下个 fiber 节点
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.return;
  }
}

function commitWorker(fiber) {
  if (!fiber) {
    return;
  }
  // 下面这个代码，是防止一些特殊节点，比如 Fragment 是没有真实节点 node的
  // 不过现在我们的代码没有实现 Fragment，所以这个判断可以忽略
  let parentNodeFiber = fiber.return;
  while (!parentNodeFiber.node) {
    parentNodeFiber = parentNodeFiber.return;
  }
  if (fiber.effectTag === MY_REACT_EFFECT_INIT && fiber.node !== null) {
    parentNodeFiber.node.appendChild(fiber.node);
  }

  commitWorker(fiber.child);
  commitWorker(fiber.sibling);
}

function commitRoot() {
  commitWorker(workInProgressFiber.child);
  // 完成任务后，把当前任务清空
  workInProgressFiber = null;
}

/**
 * render 函数
 * @param element React.createElement 的返回结果
 * @param container DOM 元素
 */
function render(element, container) {
  const node = createNode(element);
  container.appendChild(node);
  workInProgressFiber = {
    node: container,
    props: {
      children: [element],
    },
  };
  nextUnitOfWork = workInProgressFiber;
}

function workLoop(deadLine) {
  // 有下个任务，且浏览器还剩余的空闲时间
  while (nextUnitOfWork && deadLine.timeRemaining() > 1) {
    // 执行当前任务，并获取下个任务
    nextUnitOfWork = performUnitOrWork(nextUnitOfWork);
  }
  // 说明当前任务都完成了，可以一次性提交了
  if (!nextUnitOfWork && workInProgressFiber) {
    // 提交
    commitRoot();
  }
  window.requestIdleCallback(workLoop);
}

window.requestIdleCallback(workLoop);

export default { render };
