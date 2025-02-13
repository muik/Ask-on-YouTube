import { Config } from "./config.js";

const MAX_HISTORY_SIZE = 10;
const STORAGE_KEY = "questionHistory";

/**
 * Save the question history to the storage.
 * @param {Object} videoInfo - The video info object.
 * @param {string} question - The question to save.
 */
export async function saveQuestionHistory(videoInfo, question) {
    console.debug("Saving question history:", videoInfo, question);

    const item = {
        videoInfo: {
            id: videoInfo.id,
            title: videoInfo.title,
            caption: videoInfo.caption,
        },
        question: question,
        timestamp: new Date().toISOString(),
    };

    chrome.storage.sync.get([STORAGE_KEY], (result) => {
        const history = result[STORAGE_KEY] || [];
        history.push(item);
        if (history.length > MAX_HISTORY_SIZE) {
            history.splice(0, history.length - MAX_HISTORY_SIZE);
        }

        chrome.storage.sync.set({ [STORAGE_KEY]: history }, () => {
            console.debug("Question history saved:", history);
        });
    });
}

export async function getRecentQuestions() {
    const result = await chrome.storage.sync.get([STORAGE_KEY]);
    const recentItems = (result[STORAGE_KEY] || [])
        .reverse()
        .map((item) => item.question)
        .filter((item, index, self) => self.indexOf(item) === index);

    return {
        questions: recentItems.slice(0, Config.MAX_QUESTIONS_COUNT),
    };
}
