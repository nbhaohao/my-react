import React from "./react";
import ReactDOM from "./react/react-dom";

const Counter = () => {
  const [state, setState] = ReactDOM.useState(1);
  return (
    <h1
      onClick={() => {
        setState((c) => c + 1);
      }}
    >
      Count:{state + ""}
    </h1>
  );
};
const TestFC = ({ name }) => <h1>hello {name}</h1>;

const element = (
  <div id="foo">
    <a>bar</a>
    <b />
    <TestFC name="zzh" />
    <Counter />
  </div>
);
const container = document.getElementById("root");
ReactDOM.render(element, container);
