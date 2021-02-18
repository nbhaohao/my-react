/**
 * 返回真实 DOM
 * @param element
 * @returns {undefined}
 */
import { MY_REACT_TEXT_ELEMENT_TYPE } from "./const";

function updateNode(node, props) {
  Object.keys(props)
    .filter((propName) => propName !== "children")
    .forEach((propName) => {
      node[propName] = props[propName];
    });
}

// 处理 children
function reconcileChildren(children, node) {
  children.forEach((child) => {
    render(child, node);
  });
}

function createNode(element) {
  const { type, props } = element;
  let node;
  if (type === MY_REACT_TEXT_ELEMENT_TYPE) {
    node = document.createTextNode("");
  } else if (typeof type === "string") {
    node = document.createElement(type);
  }
  updateNode(node, props);

  reconcileChildren(element.props.children, node);

  return node;
}

/**
 * render 函数
 * @param element React.createElement 的返回结果
 * @param container DOM 元素
 */
function render(element, container) {
  const node = createNode(element);
  container.appendChild(node);
}

export default { render };
