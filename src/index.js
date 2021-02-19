import React from "./react";
import ReactDOM from "./react/react-dom";

const TestFC = ({ name }) => <h1>hello {name}</h1>;

const element = (
  <div id="foo">
    <a>bar</a>
    <b />
    <TestFC name="zzh" />
  </div>
);
const container = document.getElementById("root");
ReactDOM.render(element, container);
