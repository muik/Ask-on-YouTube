export const defaultSettings = {
    promptChatGPT: "Summarize the following content.",
    promptGemini: "Summarize the following content.",
    useExperimentalGemini: true,
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

export async function getUseExperimentalGemini() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["useExperimentalGemini"], (result) => {
            if (result.useExperimentalGemini == null) {
                resolve(defaultSettings.useExperimentalGemini);
                return;
            }
            resolve(result.useExperimentalGemini);
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