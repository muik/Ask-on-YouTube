import Honeybadger from "@honeybadger-io/js";
import { BackgroundActions } from "../constants.js";
import config from "../honeybadger-config.js";

Honeybadger.configure(config);

window.onload = () => {
    const settingsBtn = document.getElementById("settings-btn");
    settingsBtn.addEventListener("click", (e) => {
        e.preventDefault();
        chrome.runtime.sendMessage({
            action: BackgroundActions.OPEN_SETTINGS_PAGE,
        });
    });
};
