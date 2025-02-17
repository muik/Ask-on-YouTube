import "../css/settings.css";

export const Keys = {
    GOOGLE_CLOUD_API_KEY: "googleCloudAPIKey",
};

document.addEventListener("DOMContentLoaded", () => {
    setMessages();

    const googleCloudAPIKeyInput = document.getElementById("googleCloudAPIKey");

    const statusMessageGoogleCloudAPIKey = document.getElementById(
        "statusMessageGoogleCloudAPIKey"
    );

    console.debug("Extension settings page loaded");

    // Load the saved prompt text when the page is loaded
    chrome.storage.sync.get([Keys.GOOGLE_CLOUD_API_KEY], (result) => {
        googleCloudAPIKeyInput.value = result.googleCloudAPIKey || "";
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
    googleCloudAPIKeyInput.addEventListener("input", () => {
        debouncedSaveSetting(
            Keys.GOOGLE_CLOUD_API_KEY,
            googleCloudAPIKeyInput.value,
            statusMessageGoogleCloudAPIKey
        );
    });
});

function setMessages() {
    const messages = chrome.i18n.getMessage;
    const elements = document.querySelectorAll("[msg]");
    elements.forEach((element) => {
        console.debug("Setting message:", element.getAttribute("msg"));
        element.textContent = messages(element.getAttribute("msg"));
        console.debug("Message set:", element.textContent);
    });
}