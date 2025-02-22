import { StorageKeys } from "../constants.js";
import "../css/settings.css";

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
    chrome.storage.sync.get([StorageKeys.GEMINI_API_KEY], (result) => {
        geminiAPIKeyInput.value = result.geminiAPIKey || "";
    });

    // Function to save settings and display status
    const saveSetting = (key, value, statusMessageElement) => {
        console.debug(`Saving setting: ${key} =`, value);
        chrome.storage.sync.set({ [key]: value }, () => {
            console.debug(`Successfully saved: ${key}`);
            statusMessageElement.textContent = chrome.i18n.getMessage("saved");
            statusMessageElement.classList.add("visible");
            setTimeout(
                () => statusMessageElement.classList.remove("visible"),
                2000
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
            StorageKeys.GEMINI_API_KEY,
            geminiAPIKeyInput.value,
            statusMessageGeminiAPIKey
        );
    });

    // Function to update the theme based on system preference
    function updateTheme() {
        if (
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
        ) {
            document.body.classList.add("dark-mode");
        } else {
            document.body.classList.remove("dark-mode");
        }
    }

    // Set initial theme on page load
    updateTheme();

    // Listen for changes in system theme
    window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", updateTheme);
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
