/**
 * 返回真实 DOM
 * @param element
 * @returns {undefined}
 */
import {
  MY_REACT_TEXT_ELEMENT_TYPE,
  MY_REACT_EFFECT_INIT,
  MY_REACT_EFFECT_UPDATE,
} from "./const";

let nextUnitOfWork = null; // 下个工作任务
let workInProgressRootFiber = null; // 当前工作的根节点
let currentProgressRootFiber = null; // 上个工作根节点
let currentProgressFiber = null; // 当前正在执行的Fiber，用来在 useState 中获取

function updateNode(node, props) {
  Object.keys(props)
    .filter((propName) => propName !== "children")
    .forEach((propName) => {
      // 临时做个事件处理
      if (propName.startsWith("on")) {
        const eventName = propName.slice(2).toLowerCase();
        node.addEventListener(eventName, props[propName]);
      } else {
        node[propName] = props[propName];
      }
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

function reconcileChildren(workInProgressRootFiber, children) {
  let prevSibling = null;
  let oldFiber =
    workInProgressRootFiber.base && workInProgressRootFiber.base.child;
  children.forEach((child, index) => {
    let newFiber = null;
    // 复用的前提是 key 和 type 都相同，这里先不考虑 key
    const sameType = child && oldFiber && child.type === oldFiber.type;
    if (sameType) {
      newFiber = {
        type: child.type,
        props: child.props,
        node: oldFiber.node,
        base: oldFiber,
        return: workInProgressRootFiber,
        effectTag: MY_REACT_EFFECT_UPDATE,
      };
    }
    if (!sameType && child) {
      newFiber = {
        type: child.type,
        props: child.props,
        node: null,
        base: null,
        return: workInProgressRootFiber,
        effectTag: MY_REACT_EFFECT_INIT,
      };
    }
    if (!sameType && oldFiber) {
      // 删除节点
    }
    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }
    if (index === 0) {
      workInProgressRootFiber.child = newFiber;
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
  // 保存状态，用于 type(props) 中获取 hook state
  currentProgressFiber = fiber;
  currentProgressFiber.hooks = [];
  currentProgressFiber.hookIndex = 0;
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
  } else if (
    fiber.effectTag === MY_REACT_EFFECT_UPDATE &&
    fiber.node !== null
  ) {
    updateNode(fiber.node, fiber.props);
  }

  commitWorker(fiber.child);
  commitWorker(fiber.sibling);
}

function commitRoot() {
  commitWorker(workInProgressRootFiber.child);
  // 完成任务后，把当前任务清空
  currentProgressRootFiber = workInProgressRootFiber;
  workInProgressRootFiber = null;
}

/**
 * render 函数
 * @param element React.createElement 的返回结果
 * @param container DOM 元素
 */
function render(element, container) {
  const node = createNode(element);
  container.appendChild(node);
  workInProgressRootFiber = {
    node: container,
    props: {
      children: [element],
    },
  };
  nextUnitOfWork = workInProgressRootFiber;
}

function workLoop(deadLine) {
  // 有下个任务，且浏览器还剩余的空闲时间
  while (nextUnitOfWork && deadLine.timeRemaining() > 1) {
    // 执行当前任务，并获取下个任务
    nextUnitOfWork = performUnitOrWork(nextUnitOfWork);
  }
  // 说明当前任务都完成了，可以一次性提交了
  if (!nextUnitOfWork && workInProgressRootFiber) {
    // 提交
    commitRoot();
  }
  window.requestIdleCallback(workLoop);
}

window.requestIdleCallback(workLoop);

export function useState(init) {
  const oldHook =
    currentProgressFiber.base &&
    // 这里如果写死 0 也是正常工作的
    currentProgressFiber.base.hooks[currentProgressFiber.hookIndex];
  const hook = oldHook
    ? { state: oldHook.state, queue: oldHook.queue }
    : { state: init, queue: [] };
  // 模拟批量更新，比如 setState 多次，只会取到 queue 中最后一个值
  hook.queue.forEach((action) => {
    hook.state = action;
  });
  const setState = (action) => {
    // 只是为了模拟批量更新，防止多次调用 setState
    hook.queue.push(typeof action === "function" ? action(hook.state) : action);
    // 此时想要重新渲染之前的节点
    workInProgressRootFiber = {
      node: currentProgressRootFiber.node,
      props: currentProgressRootFiber.props,
      base: currentProgressRootFiber,
    };
    nextUnitOfWork = workInProgressRootFiber;
  };

  currentProgressFiber.hooks.push(hook);
  currentProgressFiber.hookIndex++;
  return [hook.state, setState];
}

export default { render };
