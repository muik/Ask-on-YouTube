import "../__mocks__/defaultMessages";
import "../__mocks__/setup";

import { jest } from "@jest/globals";
import Config from "../../config";
import { VideoInfo } from "../../types";
import MockIndexedDB from "../__mocks__/historyStorage";
import { mockOnInstalledCallback } from "../__mocks__/setup";
import {
    getDefaultQuestion,
    getFavoriteQuestions,
    getQuestionHistory,
    getRecentQuestions,
    saveQuestionHistory,
    setAnswer,
} from "../questionHistory";

jest.mock("../db/questionHistory/storage", () => {
    return {
        __esModule: true,
        default: MockIndexedDB,
    };
});

describe("Question History", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        MockIndexedDB.reset();
    });

    const mockVideoInfo: VideoInfo = {
        id: "test-video-id",
        title: "Test Video Title",
        caption: "Test video caption",
    };

    describe("saveQuestionHistory", () => {
        it("should save a question to history", async () => {
            const question = "Test question?";

            await saveQuestionHistory(mockVideoInfo, question);

            const items = await MockIndexedDB.getItems(1);
            expect(items).toHaveLength(1);
            expect(items[0]).toMatchObject({
                videoInfo: mockVideoInfo,
                question: question,
            });
            expect(items[0].timestamp).toBeDefined();
        });

        it("should maintain max history size", async () => {
            const questions = Array.from(
                { length: Config.MAX_HISTORY_SIZE + 2 },
                (_, i) => `Question ${i}`
            );

            for (const question of questions) {
                await saveQuestionHistory(mockVideoInfo, question);
            }

            const items = await MockIndexedDB.getItems(Config.MAX_HISTORY_SIZE);
            expect(items).toHaveLength(Config.MAX_HISTORY_SIZE);
            expect(items[items.length - 1].question).toBe(questions[questions.length - 1]);
        });

        it("should clean up old items when exceeding MAX_ITEMS", async () => {
            const maxItems = Config.MAX_HISTORY_SIZE * 2;
            const extraItems = 5;
            const questions = Array.from(
                { length: maxItems + extraItems },
                (_, i) => `Question ${i}`
            );

            for (const question of questions) {
                await saveQuestionHistory(mockVideoInfo, question);
            }

            const items = await MockIndexedDB.getItems(maxItems);
            expect(items).toHaveLength(maxItems);
            expect(items[items.length - 1].question).toBe(questions[questions.length - 1]);
        });
    });

    describe("getQuestionHistory", () => {
        it("should retrieve specified number of history items", async () => {
            const questions = ["Q1", "Q2", "Q3", "Q4", "Q5"];
            for (const question of questions) {
                await saveQuestionHistory(mockVideoInfo, question);
            }

            const history = await getQuestionHistory(3);
            expect(history).toHaveLength(3);
            expect(history[2].question).toBe("Q5");
        });

        it("should return empty array when no history exists", async () => {
            const history = await getQuestionHistory();
            expect(history).toEqual([]);
        });
    });

    describe("getRecentQuestions", () => {
        it("should return unique recent questions", async () => {
            await saveQuestionHistory(mockVideoInfo, "Q1");
            await saveQuestionHistory(mockVideoInfo, "Q2");
            await saveQuestionHistory(mockVideoInfo, "Q1"); // Duplicate

            const { questions } = await getRecentQuestions();
            expect(questions).toHaveLength(2);
            expect(questions).toEqual(["Q1", "Q2"]);
        });

        it("should limit number of questions to MAX_QUESTIONS_COUNT", async () => {
            const questions = Array.from(
                { length: Config.MAX_QUESTIONS_COUNT + 2 },
                (_, i) => `Q${i}`
            );

            for (const question of questions) {
                await saveQuestionHistory(mockVideoInfo, question);
            }

            const { questions: recentQuestions } = await getRecentQuestions();
            expect(recentQuestions).toHaveLength(Config.MAX_QUESTIONS_COUNT);
        });
    });

    describe("getFavoriteQuestions", () => {
        it("should rank questions by frequency across different videos", async () => {
            const video1 = { ...mockVideoInfo, id: "video1" };
            const video2 = { ...mockVideoInfo, id: "video2" };
            const video3 = { ...mockVideoInfo, id: "video3" };

            // Add "Common Q" to two videos
            await saveQuestionHistory(video1, "Common Q");
            await saveQuestionHistory(video2, "Common Q");
            
            // Add "Rare Q" to one video multiple times
            await saveQuestionHistory(video3, "Rare Q");
            await saveQuestionHistory(video3, "Rare Q");
            await saveQuestionHistory(video3, "Rare Q");

            const { questions } = await getFavoriteQuestions();
            // "Common Q" should be first because it appears in more videos
            expect(questions[0]).toBe("Common Q");
            // "Rare Q" should not be in the top results because it only appears in one video
            // and default questions have a count of 2
            expect(questions).not.toContain("Rare Q");
        });

        it("should include default questions in results", async () => {
            const { questions } = await getFavoriteQuestions();
            expect(questions.length).toBeGreaterThan(0);
        });

        it("should clear cache when extension is updated", async () => {
            const video1 = { ...mockVideoInfo, id: "video1" };
            const video2 = { ...mockVideoInfo, id: "video2" };

            await saveQuestionHistory(video1, "Common Q");
            await saveQuestionHistory(video2, "Common Q");

            // First call
            const { questions: questions1 } = await getFavoriteQuestions();
            expect(questions1[0]).toBe("Common Q");

            // Simulate extension update
            mockOnInstalledCallback();

            // After update, should still have the same favorites
            const { questions: questions2 } = await getFavoriteQuestions();
            expect(questions2[0]).toBe("Common Q");
        });
    });

    describe("getDefaultQuestion", () => {
        it("should return first favorite question", async () => {
            const defaultQuestion = await getDefaultQuestion();
            expect(typeof defaultQuestion).toBe("string");
            expect(defaultQuestion.length).toBeGreaterThan(0);
        });

        it("should handle different languages", async () => {
            const enQuestion = await getDefaultQuestion("en");
            const jaQuestion = await getDefaultQuestion("ja");
            expect(enQuestion).toBeDefined();
            expect(jaQuestion).toBeDefined();
        });
    });

    describe("setAnswer", () => {
        it("should update the answer for the last matching question", async () => {
            const question = "Test question?";
            const answerUrl = "https://example.com/answer";

            await saveQuestionHistory(mockVideoInfo, question);

            const sendResponse = jest.fn();
            await setAnswer(
                {
                    videoId: mockVideoInfo.id,
                    question: question,
                    answerUrl: answerUrl,
                },
                sendResponse
            );

            const items = await MockIndexedDB.getItems(1);
            expect(items[0].answerUrl).toBe(answerUrl);
        });
    });
});
