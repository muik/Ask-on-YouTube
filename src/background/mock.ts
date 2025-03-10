const mockGetURL = jest.fn();
const mockOnInstalledCallback = jest.fn();
global.chrome = {
    runtime: {
        getURL: mockGetURL,
        onInstalled: {
            addListener: (callback: () => void) => {
                mockOnInstalledCallback.mockImplementation(callback);
            },
        },
    },
} as unknown as typeof chrome;

// Mock fetch API
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Setup for background directory tests
beforeAll(() => {
    // Add any setup code specific to background tests here
});

// You can also add afterAll, beforeEach, or afterEach if needed
afterAll(() => {
    // Cleanup code here if needed
});

export { mockGetURL, mockOnInstalledCallback }; // This makes the file a module 
