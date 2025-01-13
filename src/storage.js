export const defaultPromptChatGPT = "Summarize the following content.";
export const defaultPromptGemini = "Summarize the following content.";

export async function getPromptChatGPT() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["promptChatGPT"], (result) => {
            resolve(result.promptChatGPT || defaultPromptChatGPT);
        });
    });
}
