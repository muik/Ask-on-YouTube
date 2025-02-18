"use strict";

import { BackgroundActions } from "../constants.js";
import {
    detectVideoOptionClick,
    insertExtraOptions,
} from "./youtube/moreOptions.js";
import { injectElements } from "./youtube/videoDetail.js";

let oldHref = "";

window.onload = async () => {
    if (window.location.hostname === "www.youtube.com") {
        if (
            window.location.search !== "" &&
            window.location.search.includes("v=")
        ) {
            injectElements();
        }

        const bodyList = document.querySelector("body");
        let observer = new MutationObserver((mutations) => {
            mutations.forEach(() => {
                if (oldHref !== document.location.href) {
                    oldHref = document.location.href;
                    injectElements();
                }
            });
        });
        observer.observe(bodyList, { childList: true, subtree: true });

        document.addEventListener("click", (event) => {
            detectVideoOptionClick(event.target);

            if (event.target.matches("a.settings")) {
                event.preventDefault();
                chrome.runtime.sendMessage({
                    action: BackgroundActions.OPEN_SETTINGS_PAGE,
                });
            }
        });

        insertExtraOptions();
    }
};
