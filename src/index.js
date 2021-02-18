import React from "./react";
import ReactDOM from "./react/react-dom";
const jsx = (
  <div>
    <p>我是 p 元素</p>
    <div>我是 div 元素</div>
  </div>
);

ReactDOM.render(jsx, document.querySelector("#root"));
