export default {
    setupFiles: ["./jest.setup.js"], // Ensure Jest runs this setup before your tests
    transform: {}, // Disable Babel transform for ES Modules
    testTimeout: 30000, // Extend the timeout for Puppeteer tests
};
