import pluginJs from "@eslint/js";
import globals from "globals";

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.webextensions,
                chrome: "readonly",
            },
        },
    },
    pluginJs.configs.recommended,
];
