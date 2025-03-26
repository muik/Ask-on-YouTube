export default {
    setupFiles: ["./jest.setup.js"], // Ensure Jest runs this setup before your tests
    transform: {
        "^.+\\.(ts|tsx|js|jsx|mjs)$": [
            "babel-jest",
            {
                presets: [
                    ["@babel/preset-env", { targets: { node: "current" } }],
                    "@babel/preset-react",
                    "@babel/preset-typescript",
                ],
            },
        ],
    },
    testTimeout: 15000, // Extend the timeout for Puppeteer tests
    testEnvironment: "node",
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    extensionsToTreatAsEsm: [".jsx"],
};
