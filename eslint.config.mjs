import nextPlugin from "eslint-config-next";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  nextPlugin,
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off"
    }
  }
];

export default config;

