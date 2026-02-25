import React from "react";
import { createRoot, Root } from "react-dom/client";
import { SimpleAWSView } from "./views/SimpleAWSView";

const container = document.getElementById("root");
if (container) {
  const root: Root = createRoot(container);
  root.render(React.createElement(SimpleAWSView));
}
