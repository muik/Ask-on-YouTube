import "../css/settings.css";
import { defaultSettings } from "../storage.js";

document.addEventListener("DOMContentLoaded", () => {
    const promptAreaChatGPT = document.getElementById("promptChatGPT");
    const promptAreaGemini = document.getElementById("promptGemini");
    const useExperimentalGeminiCheck = document.getElementById(
        "useExperimentalGemini"
    );
    const statusMessageChatGPT = document.getElementById("statusMessageChatGPT");
    const statusMessageGemini = document.getElementById("statusMessageGemini");
    const statusMessageToggle = document.getElementById("statusMessageToggle");

    console.debug("Extension settings page loaded");

    // Load the saved prompt text when the page is loaded
    chrome.storage.sync.get(
        ["promptChatGPT", "promptGemini", "useExperimentalGemini"],
        (result) => {
            promptAreaChatGPT.value =
                result.promptChatGPT || defaultSettings.defaultPromptChatGPT;
            promptAreaGemini.value =
                result.promptGemini || defaultSettings.defaultPromptGemini;
            useExperimentalGeminiCheck.checked =
                result.useExperimentalGemini ??
                defaultSettings.useExperimentalGemini;
        }
    );

    // Function to save settings and display status
    const saveSetting = (key, value, statusMessageElement) => {
        console.debug(`Saving setting: ${key} =`, value);
        chrome.storage.sync.set({ [key]: value }, () => {
            console.debug(`Successfully saved: ${key}`);
            statusMessageElement.textContent = "Saved!";
            statusMessageElement.classList.add("visible");
            setTimeout(() => statusMessageElement.classList.remove("visible"), 2000);

            chrome.runtime.sendMessage(
                { message: "settingsUpdated", key: key, value: value },
                (response) => {
                    // TODO handle errors
                    console.debug("Settings updated:", response);
                }
            );
        });
    };

    // Debounced save function
    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    };

    const debouncedSaveSetting = debounce((key, value, statusElement) => {
        saveSetting(key, value, statusElement);
    }, 500);

    // Auto-save with debounced input
    promptAreaChatGPT.addEventListener("input", () => {
        debouncedSaveSetting("promptChatGPT", promptAreaChatGPT.value, statusMessageChatGPT);
    });

    promptAreaGemini.addEventListener("input", () => {
        debouncedSaveSetting("promptGemini", promptAreaGemini.value, statusMessageGemini);
    });

    useExperimentalGeminiCheck.addEventListener("change", () => {
        saveSetting(
            "useExperimentalGemini",
            useExperimentalGeminiCheck.checked,
            statusMessageToggle
        );
    });
});
