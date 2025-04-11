// Mock config values
export const mockConfig = {
    REF_CODE: "test-ref-code",
};

// Mock config module
jest.mock("../../config", () => mockConfig);
