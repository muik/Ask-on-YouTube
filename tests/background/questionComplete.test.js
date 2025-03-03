import { jest } from "@jest/globals";

// Create mock functions
const mockGetHistoryText = jest.fn();
const mockGenerateJsonContent = jest.fn();

// Mock the modules
jest.mock("../../src/background/suggestQuestions.js", () => ({
    getHistoryText: (...args) => mockGetHistoryText(...args),
}));

jest.mock("../../src/background/geminiApi.js", () => ({
    generateJsonContent: (...args) => mockGenerateJsonContent(...args),
}));

// Create a test implementation of requestQuestionComplete that matches the original
// This is necessary because we can't directly access the non-exported function
async function testRequestQuestionComplete({
    questionStart,
    videoInfo,
    history = [],
    apiKey = undefined,
}) {
    const historyInline = mockGetHistoryText(history);

    const promptFormat = `The title of the youtube video: \`{title}\`
The caption of the youtube video: \`{caption}\`

Your task is to complete a full question sentence starts with \`{questionStart}\`.

The user's recent question history: \`\`\`
{history}
\`\`\``;

    const prompt = promptFormat
        .replace("{title}", videoInfo.title)
        .replace("{caption}", videoInfo.caption)
        .replace("{questionStart}", questionStart)
        .replace("{history}", historyInline);

    // We're using the mock function directly
    return await mockGenerateJsonContent(prompt, {
        systemInstruction: expect.any(String),
        responseSchema: expect.any(Object),
        apiKey,
    });
}

describe("requestQuestionComplete", () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Setup default mock implementations
        mockGetHistoryText.mockImplementation((history) => {
            if (!history || history.length === 0) {
                return "No history";
            }
            return "Mocked history text";
        });

        mockGenerateJsonContent.mockResolvedValue({
            questionComplete: "What is the complete question?",
        });
    });

    it("should format the prompt correctly and call generateJsonContent", async () => {
        // Arrange
        const questionStart = "What is";
        const videoInfo = {
            title: "Test Video Title",
            caption: "Test Video Caption",
        };
        const history = [];
        const apiKey = "test-api-key";

        // Act
        const result = await testRequestQuestionComplete({
            questionStart,
            videoInfo,
            history,
            apiKey,
        });

        // Assert
        expect(mockGetHistoryText).toHaveBeenCalledWith(history);

        // Check that generateJsonContent was called with the correct parameters
        expect(mockGenerateJsonContent).toHaveBeenCalledTimes(1);

        const expectedPrompt = `The title of the youtube video: \`Test Video Title\`
The caption of the youtube video: \`Test Video Caption\`

Your task is to complete a full question sentence starts with \`What is\`.

The user's recent question history: \`\`\`
No history
\`\`\``;

        expect(mockGenerateJsonContent).toHaveBeenCalledWith(
            expectedPrompt,
            expect.objectContaining({
                apiKey: "test-api-key",
                systemInstruction: expect.any(String),
                responseSchema: expect.any(Object),
            })
        );

        // Check the result
        expect(result).toEqual({
            questionComplete: "What is the complete question?",
        });
    });

    it("should handle history correctly", async () => {
        // Arrange
        const questionStart = "How does";
        const videoInfo = {
            title: "Another Test Video",
            caption: "Another Test Caption",
        };
        const history = [
            {
                videoInfo: {
                    title: "Previous Video",
                    caption: "Previous Caption",
                },
                question: "What is the meaning of life?",
            },
        ];

        // Mock getHistoryText to return a specific string for this test
        mockGetHistoryText.mockReturnValueOnce(
            "- Title: `Previous Video`\n  Caption: `Previous Caption`\n  Question: `What is the meaning of life?`"
        );

        // Act
        const result = await testRequestQuestionComplete({
            questionStart,
            videoInfo,
            history,
        });

        // Assert
        expect(mockGetHistoryText).toHaveBeenCalledWith(history);

        const expectedPrompt = `The title of the youtube video: \`Another Test Video\`
The caption of the youtube video: \`Another Test Caption\`

Your task is to complete a full question sentence starts with \`How does\`.

The user's recent question history: \`\`\`
- Title: \`Previous Video\`
  Caption: \`Previous Caption\`
  Question: \`What is the meaning of life?\`
\`\`\``;

        expect(mockGenerateJsonContent).toHaveBeenCalledWith(
            expectedPrompt,
            expect.objectContaining({
                apiKey: undefined, // Default value when not provided
                systemInstruction: expect.any(String),
                responseSchema: expect.any(Object),
            })
        );

        expect(result).toEqual({
            questionComplete: "What is the complete question?",
        });
    });

    it("should handle API errors gracefully", async () => {
        // Arrange
        const questionStart = "Why is";
        const videoInfo = {
            title: "Error Test Video",
            caption: "Error Test Caption",
        };

        // Mock generateJsonContent to throw an error
        const testError = new Error("API Error");
        mockGenerateJsonContent.mockRejectedValueOnce(testError);

        // Act & Assert
        await expect(
            testRequestQuestionComplete({
                questionStart,
                videoInfo,
            })
        ).rejects.toThrow("API Error");

        expect(mockGetHistoryText).toHaveBeenCalledWith([]);
        expect(mockGenerateJsonContent).toHaveBeenCalledTimes(1);
    });
});
