export const defaultSettings = {
    promptChatGPT: "Summarize the following content.",
    promptGemini: "Summarize the following content.",
    useExperimentalGemini: true,
};

export async function getPromptChatGPT() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["promptChatGPT"], (result) => {
            resolve(result.promptChatGPT || defaultSettings.defaultPromptChatGPT);
        });
    });
}

export async function getPromptGemini() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["promptGemini"], (result) => {
            resolve((result.promptGemini || defaultSettings.defaultPromptGemini).trim());
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