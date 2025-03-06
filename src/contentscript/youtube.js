"use strict";

import Honeybadger from "@honeybadger-io/js";
import { honeybadgerConfig } from "../config.js";
import { BackgroundActions } from "../constants.js";
import { waitForElm } from "./utils.js";
import {
    detectVideoOptionClick,
    insertExtraOptions,
} from "./youtube/moreOptions.js";
import { injectElements } from "./youtube/videoDetail.js";

Honeybadger.configure(honeybadgerConfig);

function isVideoPage(location) {
    try {
        if (location.pathname === "/watch") {
            return new URLSearchParams(location.search).has("v");
        }
        return false;
    } catch (error) {
        console.error("Invalid URL:", location, error);
        return false;
    }
}

window.onload = async () => {
    if (window.location.hostname !== "www.youtube.com") {
        return;
    }

    if (isVideoPage(window.location)) {
        injectElements();
    }

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

    // watch for shorts item click on home page
    if (window.location.pathname === "/") {
        const selector =
            "div.shortsLockupViewModelHostOutsideMetadataMenu div.yt-spec-touch-feedback-shape__fill";

        waitForElm(selector).then(() => {
            const elements = document.querySelectorAll(selector);
            elements.forEach((element) => {
                element.addEventListener("click", (event) => {
                    console.debug("Shorts item clicked", event.target);
                    detectVideoOptionClick(event.target);
                });
            });
        });
    }
};
