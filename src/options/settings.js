import "../css/settings.css";
import { Keys } from "../storage.js";

document.addEventListener("DOMContentLoaded", () => {
    setMessages();

    const geminiAPIKeyInput = document.getElementById("geminiAPIKey");
    const statusMessageGeminiAPIKey = document.getElementById(
        "statusMessageGeminiAPIKey"
    );

    geminiAPIKeyInput.placeholder = chrome.i18n.getMessage(
        "geminiAPIKeyPlaceholder"
    );

    console.debug("Extension settings page loaded");

    // Load the saved prompt text when the page is loaded
    chrome.storage.sync.get([Keys.GEMINI_API_KEY], (result) => {
        geminiAPIKeyInput.value = result.geminiAPIKey || "";
    });

    // Function to save settings and display status
    const saveSetting = (key, value, statusMessageElement) => {
        console.debug(`Saving setting: ${key} =`, value);
        chrome.storage.sync.set({ [key]: value }, () => {
            console.debug(`Successfully saved: ${key}`);
            statusMessageElement.textContent = "Saved!";
            statusMessageElement.classList.add("visible");
            setTimeout(
                () => statusMessageElement.classList.remove("visible"),
                2000
            );

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
    geminiAPIKeyInput.addEventListener("input", () => {
        debouncedSaveSetting(
            Keys.GEMINI_API_KEY,
            geminiAPIKeyInput.value,
            statusMessageGeminiAPIKey
        );
    });
});

function setMessages() {
    const messages = chrome.i18n.getMessage;
    const elements = document.querySelectorAll("[msg]");
    elements.forEach((element) => {
        console.debug("Setting message:", element.getAttribute("msg"));
        element.innerHTML = messages(element.getAttribute("msg"));
        console.debug("Message set:", element.textContent);
    });

    document.title = `${messages("settings")} - ${messages(
        "shortExtensionName"
    )}`;
}
