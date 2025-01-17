import pluginJs from "@eslint/js";
import globals from "globals";

/** @type {import('eslint').Linter.Config[]} */
export default [
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
