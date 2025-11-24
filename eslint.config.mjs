import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

export default tseslint.config(
  ...nextPlugin.recommended,
  {
    ignores: ["node_modules/", ".next/"]
  }
);

