import { BackgroundActions } from "../constants.js";

window.onload = () => {
    const settingsBtn = document.getElementById("settings-btn");
    settingsBtn.addEventListener("click", (e) => {
        e.preventDefault();
        chrome.runtime.sendMessage({
            action: BackgroundActions.OPEN_SETTINGS_PAGE,
        });
    });
};
