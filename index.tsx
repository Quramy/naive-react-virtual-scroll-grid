import React from "react";
import { render } from "react-dom";
import { App } from "./components/App";

function main() {
  const elm = document.getElementById("app");
  if (!elm) return;
  render(<App />, elm);
}

main();
