import Honeybadger from "@honeybadger-io/js";
import { honeybadgerConfig } from "../config.js";
import { BackgroundActions } from "../constants.js";

Honeybadger.configure(honeybadgerConfig);

window.onload = () => {
    const settingsBtn = document.getElementById("settings-btn");
    settingsBtn.addEventListener("click", (e) => {
        e.preventDefault();

        try {
            chrome.runtime.sendMessage({
                action: BackgroundActions.OPEN_SETTINGS_PAGE,
            });
        } catch (error) {
            if (error.message === "Extension context invalidated.") {
                const message = chrome.i18n.getMessage(
                    "extensionContextInvalidatedError"
                );
                alert(message);
                return;
            }
            Honeybadger.notify(error);
        }
    });
};
