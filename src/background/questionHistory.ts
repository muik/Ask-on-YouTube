import Config from "../config";
import { StorageKeys } from "../constants";
import { HistoryItem, VideoInfo } from "../types";
import { getDefaultFavoriteQuestions } from "./defaultQuestions";
import { handleError } from "./handlers";

const { MAX_HISTORY_SIZE, MAX_HISTORY_SIZE_IN_PROMPT } = Config;

const STORAGE_KEY = StorageKeys.QUESTION_HISTORY;

interface QuestionCounter {
    videoIds: Set<string>;
    timestamp: number;
    count: number;
}

interface QuestionsResponse {
    questions: string[];
}

interface StorageResult {
    [key: string]: HistoryItem[];
}

type SendResponse = (response: unknown) => void;

// Storage operations abstraction
class QuestionHistoryStorage {
    private static async getHistory(): Promise<HistoryItem[]> {
        const result = (await chrome.storage.local.get([STORAGE_KEY])) as StorageResult;
        return result[STORAGE_KEY] || [];
    }

    private static async setHistory(history: HistoryItem[]): Promise<void> {
        await chrome.storage.local.set({ [STORAGE_KEY]: history });
    }

    static async saveItem(item: HistoryItem): Promise<void> {
        const history = await this.getHistory();
        history.push(item);
        if (history.length > MAX_HISTORY_SIZE) {
            history.splice(0, history.length - MAX_HISTORY_SIZE);
        }
        await this.setHistory(history);
    }

    static async getItems(count: number = MAX_HISTORY_SIZE_IN_PROMPT): Promise<HistoryItem[]> {
        if (count <= 0) {
            throw new Error("Count must be greater than 0");
        }
        const history = await this.getHistory();
        return history.slice(-count);
    }

    static async updateLastItem(predicate: (item: HistoryItem) => boolean, update: Partial<HistoryItem>): Promise<void> {
        const history = await this.getHistory();
        if (history.length === 0) {
            throw new Error("History is empty");
        }

        const lastItem = history[history.length - 1];
        if (!predicate(lastItem)) {
            throw new Error("Last item does not match the predicate");
        }

        Object.assign(lastItem, update);
        await this.setHistory(history);
    }

    static async clearHistory(): Promise<void> {
        await this.setHistory([]);
    }
}

/**
 * Save the question history to the storage.
 * @param {VideoInfo} videoInfo - The video info object.
 * @param {string} question - The question to save.
 */
export async function saveQuestionHistory(videoInfo: VideoInfo, question: string): Promise<void> {
    console.debug("Saving question history:", videoInfo, question);

    const item: HistoryItem = {
        videoInfo: {
            id: videoInfo.id,
            title: videoInfo.title,
            caption: videoInfo.caption,
        },
        question: question,
        timestamp: new Date().toISOString(),
    };

    try {
        const startTime = performance.now();
        await QuestionHistoryStorage.saveItem(item);
        console.debug(
            "Question history saved in",
            (performance.now() - startTime).toFixed(1),
            "ms"
        );
    } catch (error) {
        console.error("Failed to save question history:", error);
        throw error;
    }
}

export async function getQuestionHistory(
    count: number = MAX_HISTORY_SIZE_IN_PROMPT
): Promise<HistoryItem[]> {
    return QuestionHistoryStorage.getItems(count);
}

/**
 * Get the recent questions from the history.
 * @returns {QuestionsResponse} - The recent questions.
 */
export async function getRecentQuestions(): Promise<QuestionsResponse> {
    const history = await QuestionHistoryStorage.getItems();
    const recentItems = history
        .reverse()
        .map((item: HistoryItem) => item.question)
        .filter((item: string, index: number, self: string[]) => self.indexOf(item) === index);

    return {
        questions: recentItems.slice(0, Config.MAX_QUESTIONS_COUNT),
    };
}

/**
 * Get the favorite questions from the history.
 * @param {string} lang - The language code
 * @returns {QuestionsResponse} - The favorite questions.
 */
export async function getFavoriteQuestions(lang: string = "en"): Promise<QuestionsResponse> {
    const history = await QuestionHistoryStorage.getItems();
    const counter: Record<string, QuestionCounter> = {};

    // group the questions by question and video id
    history.forEach((item: HistoryItem) => {
        const videoId = item.videoInfo.id;
        const question = item.question.trim();
        const timestamp = Date.parse(item.timestamp);

        if (counter[question]) {
            counter[question].videoIds.add(videoId);
            counter[question].timestamp = Math.max(counter[question].timestamp, timestamp);
            counter[question].count = counter[question].videoIds.size;
        } else {
            counter[question] = {
                videoIds: new Set([videoId]),
                timestamp,
                count: 1
            };
        }
    });

    const defaultQuestions = await getDefaultFavoriteQuestions(lang);
    defaultQuestions.forEach(question => {
        if (counter[question]) {
            counter[question].count = Math.max(counter[question].count, 2);
        } else {
            counter[question] = { videoIds: new Set(), count: 2, timestamp: 0 };
        }
    });

    // sort by count and timestamp, descending
    const favoriteItems = Object.keys(counter).sort((a, b) => {
        const countDiff = counter[b].count - counter[a].count;
        return countDiff !== 0 ? countDiff : counter[b].timestamp - counter[a].timestamp;
    });

    return { questions: favoriteItems.slice(0, Config.MAX_QUESTIONS_COUNT) };
}

/**
 * Set the answer for the last question in history if it matches.
 * @param {Object} request - The request object.
 * @param {string} request.videoId - The video id.
 * @param {string} request.question - The question to validate.
 * @param {string} request.answerUrl - The URL of the answer to set.
 * @param {SendResponse} sendResponse - The callback function to send the response.
 */
export async function setAnswer(
    request: { videoId: string; question: string; answerUrl: string },
    sendResponse: SendResponse
) {
    processSetAnswer(request).then(sendResponse).catch(handleError(sendResponse));
    return true;
}

/**
 * Update the answer for the last question in history if it matches.
 * @param {Object} request - The request object.
 * @param {string} request.videoId - The video id.
 * @param {string} request.question - The question to validate.
 * @param {string} request.answerUrl - The URL of the answer to set.
 */
async function processSetAnswer({
    videoId,
    question,
    answerUrl,
}: {
    videoId: string;
    question: string;
    answerUrl: string;
}): Promise<void> {
    console.debug("Setting answer for last question:", videoId, question, answerUrl);

    try {
        const startTime = performance.now();
        await QuestionHistoryStorage.updateLastItem(
            (item) => item.videoInfo.id === videoId && item.question === question,
            { answerUrl }
        );
        console.debug(
            "Answer updated for last question in",
            (performance.now() - startTime).toFixed(1),
            "ms"
        );
    } catch (error) {
        console.error("Failed to set answer:", error);
        throw error;
    }
}

export async function getDefaultQuestion(lang: string = "en"): Promise<string> {
    const questions = await getFavoriteQuestions(lang);
    return questions.questions[0];
}
