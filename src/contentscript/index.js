"use strict";

import { insertSummaryBtn } from "./youtube.js";
import { detectVideoOptionClick } from "./youtube/moreOptions.js";

let oldHref = "";

window.onload = async () => {
    if (window.location.hostname === "www.youtube.com") {
        if (
            window.location.search !== "" &&
            window.location.search.includes("v=")
        ) {
            insertSummaryBtn();
        }

        const bodyList = document.querySelector("body");
        let observer = new MutationObserver((mutations) => {
            mutations.forEach(() => {
                if (oldHref !== document.location.href) {
                    oldHref = document.location.href;
                    insertSummaryBtn();
                }
            });
        });
        observer.observe(bodyList, { childList: true, subtree: true });

        document.addEventListener("click", (event) => {
            detectVideoOptionClick(event.target);
        });
    }
};
