import React from "react";
import { render } from "react-dom";

import App from "./App";

module.exports = async () => {
  const bar = render(React.createElement(App));

  return bar;
};
