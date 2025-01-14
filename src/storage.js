export const defaultPromptChatGPT = "Summarize the following content.";
export const defaultPromptGemini = "Summarize the following content.";

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
            resolve(result.promptGemini || defaultPromptGemini);
        });
    });
}

