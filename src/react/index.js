/**
 * 创建一个 React 元素
 * @param type 元素标签名，如 'div' | 'p' 或者是类组件、函数式组件
 * @param props 组件属性
 * @param children 子元素，可能接收到 createElement 方法的返回值，也可能是字符串，
 * 为了后面方便处理，这里把字符串转换成 createElement 返回值的格式
 */
import { MY_REACT_TEXT_ELEMENT_TYPE } from "./const";

function createElement(type, props, ...children) {
  const newProps = {
    ...props,
    children: children.map((child) =>
      typeof child === "object" ? child : createTextElement(child)
    ),
  };
  return {
    type,
    props: newProps,
  };
}

function createTextElement(text) {
  return {
    type: MY_REACT_TEXT_ELEMENT_TYPE,
    props: {
      children: [],
      nodeValue: text,
    },
  };
}

export default {
  createElement,
};
