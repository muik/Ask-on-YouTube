import Honeybadger from "@honeybadger-io/js";
import { honeybadgerConfig } from "../config.js";
import { BackgroundActions } from "../constants.js";

Honeybadger.configure(honeybadgerConfig);

window.onload = () => {
    const settingsBtn = document.getElementById("settings-btn");
    settingsBtn.addEventListener("click", (e) => {
        e.preventDefault();
        chrome.runtime.sendMessage({
            action: BackgroundActions.OPEN_SETTINGS_PAGE,
        });
    });
};
