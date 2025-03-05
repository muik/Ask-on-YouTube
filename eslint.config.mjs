import pluginJs from "@eslint/js";
import globals from "globals";

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        ignores: ["**/vendor/**"], // Ignore vendor directory
    },
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.webextensions,
                ...globals.node,
                ...globals.jest,
                chrome: "readonly",
            },
        },
    },
    pluginJs.configs.recommended,
];
