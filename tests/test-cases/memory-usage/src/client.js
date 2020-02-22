import React from "react";
import { render } from "react-dom";

module.exports = async () => {
  const bar = render(React.createElement(App));

  return bar;
};
