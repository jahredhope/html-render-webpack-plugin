module.exports = {
  parser: "babel-eslint",
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module"
  },
  env: {
    es6: true,
    jest: true,
    node: true
  },
  rules: {
    "no-console": "off",
    "no-inner-declarations": "off"
  }
};
