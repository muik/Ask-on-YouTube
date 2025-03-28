import { getMessages } from "./messages";

const DEFAULT_QUESTION_KEYS = [
    "defaultFavoriteQuestion1",
    "defaultFavoriteQuestion2",
    "defaultFavoriteQuestion3",
    "defaultFavoriteQuestion4",
];

// Cache for default favorite questions
const defaultQuestionsCache = new Map<string, string[]>();

export const getDefaultFavoriteQuestions = async (
    lang: string = "en"
): Promise<string[]> => {
    // Check cache first
    if (defaultQuestionsCache.has(lang)) {
        return defaultQuestionsCache.get(lang)!;
    }

    const questions = await getMessages([...DEFAULT_QUESTION_KEYS], { lang });
    defaultQuestionsCache.set(lang, questions);
    return questions;
};

// Clear cache when extension is updated
chrome.runtime.onInstalled.addListener(() => {
    defaultQuestionsCache.clear();
});
