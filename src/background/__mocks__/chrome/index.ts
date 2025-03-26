// Mock onInstalled callback
export const mockOnInstalledCallback = jest.fn();

// Mock chrome APIs
export const mockChrome = {
    storage: {
        sync: {
            get: jest.fn(),
            set: jest.fn(),
        },
    },
    i18n: {
        getMessage: jest.fn().mockImplementation((...args: unknown[]) => {
            // Return the first argument as the message for testing
            return args[0] as string;
        }),
    },
    runtime: {
        onInstalled: {
            addListener: jest.fn((callback: () => void) => {
                // Store the callback for later use
                mockOnInstalledCallback.mockImplementation(callback);
            }),
        },
        getURL: jest.fn().mockImplementation((path: string) => {
            // Return a mock URL for testing
            return `chrome-extension://mock-extension-id/${path}`;
        }),
        sendMessage: jest.fn(),
        onMessage: {
            addListener: jest.fn(),
            removeListener: jest.fn(),
        },
    },
} as any;

// Set up global chrome object
global.chrome = mockChrome; 