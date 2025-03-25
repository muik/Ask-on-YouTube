import { jest } from "@jest/globals";

// Create mock functions
const mockGetHistoryText = jest.fn();
const mockGenerateJsonContent = jest.fn();
const mockHandleError = jest.fn();
const mockGetApiKeyRequired = jest.fn();
const mockGetQuestionHistory = jest.fn();

// Mock the modules using unstable_mockModule
jest.unstable_mockModule("../../src/background/suggestQuestions.js", () => ({
    getHistoryText: mockGetHistoryText
}));

jest.unstable_mockModule("../../src/background/geminiApi.js", () => ({
    generateJsonContent: mockGenerateJsonContent
}));

jest.unstable_mockModule("../../src/background/handlers", () => ({
    handleError: () => mockHandleError
}));

jest.unstable_mockModule("../../src/background/settingsLoader.js", () => ({
    getApiKeyRequired: mockGetApiKeyRequired
}));

jest.unstable_mockModule("../../src/background/questionHistory.ts", () => ({
    getQuestionHistory: mockGetQuestionHistory
}));

jest.unstable_mockModule("../../src/errors", () => ({
    Errors: {
        INVALID_REQUEST: "INVALID_REQUEST"
    }
}));

// Import the functions after setting up mocks
const { getQuestionComplete } = await import("../../src/background/questionComplete.js");

describe("questionComplete", () => {
    let mockSendResponse;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        mockSendResponse = jest.fn();

        // Setup default mock implementations
        mockGetHistoryText.mockReturnValue("No history");
        mockGenerateJsonContent.mockResolvedValue({
            questionComplete: "What is the complete question?"
        });
        mockGetApiKeyRequired.mockResolvedValue("test-api-key");
        mockGetQuestionHistory.mockResolvedValue([]);
    });

    describe("getQuestionComplete", () => {
        it("should handle invalid request", () => {
            // Test with missing questionStart
            getQuestionComplete({ videoInfo: {} }, mockSendResponse);
            expect(mockHandleError).toHaveBeenCalledWith("INVALID_REQUEST");

            // Test with missing videoInfo
            getQuestionComplete({ questionStart: "What is" }, mockSendResponse);
            expect(mockHandleError).toHaveBeenCalledWith("INVALID_REQUEST");
        });

        it("should process valid request successfully", async () => {
            const request = {
                questionStart: "What is",
                videoInfo: {
                    title: "Test Video",
                    caption: "Test Caption"
                }
            };

            const result = getQuestionComplete(request, mockSendResponse);
            expect(result).toBe(true);

            // Wait for all promises to resolve
            await new Promise(process.nextTick);

            expect(mockGetQuestionHistory).toHaveBeenCalled();
            expect(mockGetApiKeyRequired).toHaveBeenCalled();
            expect(mockGenerateJsonContent).toHaveBeenCalledWith(
                expect.stringContaining("Test Video"),
                expect.objectContaining({
                    apiKey: "test-api-key",
                    systemInstruction: expect.any(String),
                    responseSchema: expect.any(Object)
                })
            );
            expect(mockSendResponse).toHaveBeenCalledWith({
                questionComplete: "What is the complete question?"
            });
        });

        it("should handle errors during processing", async () => {
            const request = {
                questionStart: "What is",
                videoInfo: {
                    title: "Test Video",
                    caption: "Test Caption"
                }
            };

            // Mock an error in generateJsonContent
            const testError = new Error("API Error");
            mockGenerateJsonContent.mockRejectedValueOnce(testError);

            getQuestionComplete(request, mockSendResponse);

            // Wait for all promises to resolve
            await new Promise(process.nextTick);

            expect(mockHandleError).toHaveBeenCalledWith(testError);
        });
    });

    describe("requestQuestionComplete", () => {
        it("should format the prompt correctly and call generateJsonContent", async () => {
            const request = {
                questionStart: "What is",
                videoInfo: {
                    title: "Test Video Title",
                    caption: "Test Video Caption"
                }
            };

            const result = getQuestionComplete(request, mockSendResponse);
            expect(result).toBe(true);

            // Wait for all promises to resolve
            await new Promise(process.nextTick);

            expect(mockGetHistoryText).toHaveBeenCalledWith([]);
            expect(mockGenerateJsonContent).toHaveBeenCalledWith(
                expect.stringContaining("Test Video Title"),
                expect.objectContaining({
                    apiKey: "test-api-key",
                    systemInstruction: expect.any(String),
                    responseSchema: expect.any(Object)
                })
            );
        });

        it("should handle history correctly", async () => {
            const request = {
                questionStart: "How does",
                videoInfo: {
                    title: "Another Test Video",
                    caption: "Another Test Caption"
                }
            };

            const history = [{
                videoInfo: {
                    title: "Previous Video",
                    caption: "Previous Caption"
                },
                question: "What is the meaning of life?"
            }];

            mockGetQuestionHistory.mockResolvedValueOnce(history);
            mockGetHistoryText.mockReturnValueOnce(
                "- Title: `Previous Video`\n  Caption: `Previous Caption`\n  Question: `What is the meaning of life?`"
            );

            const result = getQuestionComplete(request, mockSendResponse);
            expect(result).toBe(true);

            // Wait for all promises to resolve
            await new Promise(process.nextTick);

            expect(mockGetHistoryText).toHaveBeenCalledWith(history);
            expect(mockGenerateJsonContent).toHaveBeenCalledWith(
                expect.stringContaining("Another Test Video"),
                expect.objectContaining({
                    apiKey: "test-api-key",
                    systemInstruction: expect.any(String),
                    responseSchema: expect.any(Object)
                })
            );
        });
    });
});
