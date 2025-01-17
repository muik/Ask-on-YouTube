import "../css/settings.css";
import { defaultSettings } from "../storage.js";

document.addEventListener("DOMContentLoaded", () => {
    const promptAreaChatGPT = document.getElementById("promptChatGPT");
    const promptAreaGemini = document.getElementById("promptGemini");
    const useExperimentalGeminiCheck = document.getElementById(
        "useExperimentalGemini"
    );
    const saveButton = document.getElementById("saveButton");
    const statusMessage = document.getElementById("statusMessage");

    // Load the saved prompt text when the page is loaded
    chrome.storage.sync.get(
        ["promptChatGPT", "promptGemini", "useExperimentalGemini"],
        (result) => {
            promptAreaChatGPT.value =
                result.promptChatGPT || defaultSettings.defaultPromptChatGPT;
            promptAreaGemini.value =
                result.promptGemini || defaultSettings.defaultPromptGemini;
            if (result.useExperimentalGemini == null) {
                useExperimentalGeminiCheck.checked =
                    defaultSettings.useExperimentalGemini;
            } else {
                useExperimentalGeminiCheck.checked =
                    result.useExperimentalGemini;
            }
        }
    );

    // Save the prompt text when the button is clicked
    saveButton.addEventListener("click", () => {
        const promptChatGPT = promptAreaChatGPT.value;
        const promptGemini = promptAreaGemini.value;
        const useExperimentalGemini =
            useExperimentalGeminiCheck.checked || false;

        chrome.storage.sync.set(
            { promptChatGPT, promptGemini, useExperimentalGemini },
            () => {
                statusMessage.textContent = "All settings saved!";
                setTimeout(() => (statusMessage.textContent = ""), 2000);
            }
        );
    });
});
