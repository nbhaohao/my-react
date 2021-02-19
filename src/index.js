import React from "./react";
import ReactDOM, { useState } from "./react/react-dom";
import Component from "./react/Component";

class ClassComponent extends Component {
  render() {
    return <div>类组件 {this.props.name}</div>;
  }
}

const FunctionElement = (props) => {
  const [count, setCount] = useState(0);
  return (
    <div>
      函数式组件 {props.name}
      <p>{count}</p>
      <button
        onClick={() => {
          setCount((value) => value + 1);
        }}
      >
        add
      </button>
    </div>
  );
};

const jsx = (
  <div>
    <p>我是 p 元素</p>
    <div>我是 div 元素</div>
    <ClassComponent name="123" />
    <FunctionElement name="456" />
  </div>
);

ReactDOM.render(jsx, document.querySelector("#root"));
