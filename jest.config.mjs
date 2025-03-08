export default {
    setupFiles: ["./jest.setup.js"], // Ensure Jest runs this setup before your tests
    transform: {
        "^.+\\.tsx?$": "ts-jest",
    },
    testTimeout: 30000, // Extend the timeout for Puppeteer tests
    testEnvironment: "node",
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};
