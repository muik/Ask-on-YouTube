export const defaultSettings = {
    promptChatGPT: "Summarize the following content.",
    promptGemini: "Summarize the following content.",
};

export async function getPromptChatGPT() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["promptChatGPT"], (result) => {
            const value =
                result.promptChatGPT || defaultSettings.promptChatGPT;
            resolve(value.trim());
        });
    });
}

export async function getPromptGemini() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["promptGemini"], (result) => {
            const value =
                result.promptGemini || defaultSettings.promptGemini;
            resolve(value.trim());
        });
    });
}

export async function getGoogleCloudAPIKey() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["googleCloudAPIKey"], (result) => {
            resolve(result.googleCloudAPIKey);
        });
    });
}