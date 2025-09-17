// @ts-check
import eslint from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import perfectionist from "eslint-plugin-perfectionist";
import tseslint from "typescript-eslint";

export default [
  perfectionist.configs["recommended-natural"],

  { ignores: ["src/generated/prisma/**"] },

  ...tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.strict,
    tseslint.configs.stylistic,
    prettierConfig,
  ),
];
