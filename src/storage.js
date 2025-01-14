// deprecated values, use defaultSettings instead
export const defaultPromptChatGPT = "Summarize the following content.";
export const defaultPromptGemini = "Summarize the following content.";

export const defaultSettings = {
    promptChatGPT: defaultPromptChatGPT,
    promptGemini: defaultPromptGemini,
    useExperimentalGemini: true,
};

export async function getPromptChatGPT() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["promptChatGPT"], (result) => {
            resolve(result.promptChatGPT || defaultPromptChatGPT);
        });
    });
}

export async function getPromptGemini() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["promptGemini"], (result) => {
            resolve((result.promptGemini || defaultPromptGemini).trim());
        });
    });
}

export async function getUseExperimentalGemini() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["useExperimentalGemini"], (result) => {
            if (result.useExperimentalGemini === undefined || result.useExperimentalGemini === null) {
                resolve(defaultSettings.useExperimentalGemini);
                return;
            }
            resolve(result.useExperimentalGemini);
        });
    });
}