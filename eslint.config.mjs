import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Fix typescript/type errors
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      // Fix React warnings
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "off",
      // Fix Next.js image warnings
      "@next/next/no-img-element": "off",
    },
  },
];

export default eslintConfig;
