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
                const messages = {
                    en: "The Chrome extension has been updated. Please refresh the page and try again.",
                    ko: "Chrome 확장 프로그램이 업데이트되었습니다. 이 페이지를 새로고침 후 다시 시도해주세요.",
                };
                const userLang = navigator.language.startsWith("ko")
                    ? "ko"
                    : "en";
                const message = messages[userLang];
                alert(message);
                return;
            }
            Honeybadger.notify(error);
        }
    });
};
