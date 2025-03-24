import Config from "../config.js";
import { StorageKeys } from "../constants.js";
import { HistoryItem, VideoInfo } from "../types.js";
import { getDefaultFavoriteQuestions } from "./defaultQuestions.js";

const { MAX_HISTORY_SIZE, MAX_HISTORY_SIZE_IN_PROMPT } = Config;

const STORAGE_KEY = StorageKeys.QUESTION_HISTORY;

interface QuestionCounter {
    videoIds: Set<string>;
    timestamp: string | number;
    count?: number;
}

interface QuestionsResponse {
    questions: string[];
}

interface StorageResult {
    [key: string]: HistoryItem[];
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
        const result = await chrome.storage.local.get([STORAGE_KEY]) as StorageResult;
        const history: HistoryItem[] = result[STORAGE_KEY] || [];
        history.push(item);
        if (history.length > MAX_HISTORY_SIZE) {
            history.splice(0, history.length - MAX_HISTORY_SIZE);
        }

        await chrome.storage.local.set({ [STORAGE_KEY]: history });
        console.debug(
            "Question history saved:",
            history.length,
            "in",
            (performance.now() - startTime).toFixed(1),
            "ms"
        );
    } catch (error) {
        console.error("Failed to save question history:", error);
    }
}

export async function getQuestionHistory(count: number = MAX_HISTORY_SIZE_IN_PROMPT): Promise<HistoryItem[]> {
    const result = await chrome.storage.local.get([STORAGE_KEY]) as StorageResult;
    return (result[STORAGE_KEY] || []).slice(-count);
}

/**
 * Get the recent questions from the history.
 * @returns {QuestionsResponse} - The recent questions.
 */
export async function getRecentQuestions(): Promise<QuestionsResponse> {
    const result = await chrome.storage.local.get([STORAGE_KEY]) as StorageResult;
    const recentItems = (result[STORAGE_KEY] || [])
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
export async function getFavoriteQuestions(lang: string = 'en'): Promise<QuestionsResponse> {
    const result = await chrome.storage.local.get([STORAGE_KEY]) as StorageResult;
    const counter: Record<string, QuestionCounter> = {};

    // group the questions by question and video id
    (result[STORAGE_KEY] || []).forEach((item: HistoryItem) => {
        const videoId = item.videoInfo.id;
        const question = item.question.trim();
        if (counter[question]) {
            counter[question].videoIds.add(videoId);
            counter[question].timestamp = Math.max(
                counter[question].timestamp as number,
                Date.parse(item.timestamp)
            );
        } else {
            counter[question] = {
                videoIds: new Set([videoId]),
                timestamp: Date.parse(item.timestamp),
            };
        }
    });

    Object.values(counter).forEach((item: QuestionCounter) => {
        item.count = item.videoIds.size;
    });

    const defaultQuestions = await getDefaultFavoriteQuestions(lang);
    defaultQuestions.forEach((question) => {
        if (counter[question]) {
            counter[question].count = Math.max(counter[question].count || 0, 2);
        } else {
            counter[question] = { videoIds: new Set(), count: 2, timestamp: 0 };
        }
    });

    // sort by count and timestamp, descending
    const favoriteItems = Object.keys(counter).sort((a, b) => {
        return (
            (counter[b].count || 0) - (counter[a].count || 0) ||
            (counter[b].timestamp as number) - (counter[a].timestamp as number)
        );
    });

    return { questions: favoriteItems.slice(0, Config.MAX_QUESTIONS_COUNT) };
}

export async function getDefaultQuestion(lang: string = 'en'): Promise<string> {
    const questions = await getFavoriteQuestions(lang);
    return questions.questions[0];
} 