import { defaultPromptChatGPT, defaultPromptGemini } from "../storage";

document.addEventListener("DOMContentLoaded", () => {
    const promptAreaChatGPT = document.getElementById("promptChatGPT");
    const promptAreaGemini = document.getElementById("promptGemini");
    const saveButton = document.getElementById("saveButton");
    const statusMessage = document.getElementById("statusMessage");

    // Load the saved prompt text when the page is loaded
    chrome.storage.sync.get(["promptChatGPT", "promptGemini"], (result) => {
        promptAreaChatGPT.value = result.promptChatGPT || defaultPromptChatGPT;
        promptAreaGemini.value = result.promptGemini || defaultPromptGemini;
    });

    // Save the prompt text when the button is clicked
    saveButton.addEventListener("click", () => {
        const promptChatGPT = promptAreaChatGPT.value;
        const promptGemini = promptAreaGemini.value;

        chrome.storage.sync.set({ promptChatGPT, promptGemini }, () => {
            statusMessage.textContent = "Prompt text saved!";
            setTimeout(() => (statusMessage.textContent = ""), 2000);
        });
    });
});
