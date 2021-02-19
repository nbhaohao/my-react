import { REACT_TEXT_NODE } from "./const";

function createTextElement(child) {
  return {
    type: REACT_TEXT_NODE,
    props: {
      nodeValue: child,
      children: [],
    },
  };
}

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "string" ? createTextElement(child) : child
      ),
    },
  };
}

export default { createElement };
