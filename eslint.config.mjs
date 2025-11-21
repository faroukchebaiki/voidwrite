import eslintConfigNext from "eslint-config-next";

const config = [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  ...eslintConfigNext,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "import/no-anonymous-default-export": "off",
    },
  },
];

export default config;
