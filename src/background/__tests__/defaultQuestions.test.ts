import { mockOnInstalledCallback } from "../mock";

import { getDefaultFavoriteQuestions } from "../defaultQuestions";
import { getMessages } from "../messages";

// Mock the messages module
jest.mock("../messages");
const mockedGetMessages = getMessages as jest.MockedFunction<
    typeof getMessages
>;

describe("defaultQuestions", () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Trigger cache clear through onInstalled event
        mockOnInstalledCallback();
    });

    it("should fetch and cache default questions for default language", async () => {
        const mockQuestions = ["Question 1", "Question 2", "Question 3", "Question 4"];
        mockedGetMessages.mockResolvedValueOnce(mockQuestions);

        // First call should fetch from the API
        const result1 = await getDefaultFavoriteQuestions();
        expect(result1).toEqual(mockQuestions);
        expect(mockedGetMessages).toHaveBeenCalledTimes(1);
        expect(mockedGetMessages).toHaveBeenCalledWith(
            [
                "defaultFavoriteQuestion1",
                "defaultFavoriteQuestion2",
                "defaultFavoriteQuestion3",
                "defaultFavoriteQuestion4",
            ],
            { lang: "en" }
        );

        // Second call should use cached value
        const result2 = await getDefaultFavoriteQuestions();
        expect(result2).toEqual(mockQuestions);
        expect(mockedGetMessages).toHaveBeenCalledTimes(1); // Should not call again
    });

    it("should fetch and cache questions for different languages separately", async () => {
        const mockEnQuestions = ["Question 1", "Question 2", "Question 3", "Question 4"];
        const mockKoQuestions = ["질문 1", "질문 2", "질문 3", "질문 4"];

        mockedGetMessages
            .mockResolvedValueOnce(mockEnQuestions)
            .mockResolvedValueOnce(mockKoQuestions);

        // Fetch English questions
        const enResult = await getDefaultFavoriteQuestions("en");
        expect(enResult).toEqual(mockEnQuestions);

        // Fetch Korean questions
        const koResult = await getDefaultFavoriteQuestions("ko");
        expect(koResult).toEqual(mockKoQuestions);

        // Both should be cached now
        await getDefaultFavoriteQuestions("en");
        await getDefaultFavoriteQuestions("ko");

        // Should have only made two API calls total
        expect(mockedGetMessages).toHaveBeenCalledTimes(2);
    });

    it("should clear cache when extension is updated", async () => {
        const mockQuestions = ["Question 1", "Question 2", "Question 3", "Question 4"];
        mockedGetMessages.mockResolvedValue(mockQuestions);

        // First call
        await getDefaultFavoriteQuestions();
        expect(mockedGetMessages).toHaveBeenCalledTimes(1);

        // Simulate extension update
        mockOnInstalledCallback();

        // After update, should fetch again
        await getDefaultFavoriteQuestions();
        expect(mockedGetMessages).toHaveBeenCalledTimes(2);
    });

    it("should handle API errors gracefully", async () => {
        const error = new Error("API Error");
        mockedGetMessages.mockRejectedValue(error);

        await expect(getDefaultFavoriteQuestions()).rejects.toThrow(
            "API Error"
        );
    });
});
