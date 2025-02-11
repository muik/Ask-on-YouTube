const MAX_HISTORY_SIZE = 10;

/**
 * Save the question history to the storage.
 * @param {Object} videoInfo - The video info object.
 * @param {string} question - The question to save.
 */
export async function saveQuestionHistory(videoInfo, question) {
    console.debug("Saving question history:", videoInfo, question);

    const key = "questionHistory";
    const item = {
        videoInfo: {
            id: videoInfo.id,
            title: videoInfo.title,
            caption: videoInfo.caption,
        },
        question: question,
        timestamp: new Date().toISOString(),
    };

    chrome.storage.sync.get([key], (result) => {
        const history = result[key] || [];
        history.push(item);
        if (history.length > MAX_HISTORY_SIZE) {
            history.splice(0, history.length - MAX_HISTORY_SIZE);
        }

        chrome.storage.sync.set({ [key]: history }, () => {
            console.debug("Question history saved:", history);
        });
    });
}

export async function getQuestionHistory() {
    const key = "questionHistory";
    const result = await chrome.storage.sync.get([key]);
    return result[key] || [];
}
