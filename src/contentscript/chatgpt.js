"use strict";

import { BackgroundActions } from "../constants.js";
import { config } from "./config.js";
import { waitForElm } from "./utils.js";

window.onload = async () => {
    // If opened by the extension, insert the prompt
    if (
        window.location.hostname !== "chatgpt.com" ||
        window.location.search !== `?ref=${config["refCode"]}`
    ) {
        return;
    }

    // get prompt from background.js
    chrome.runtime.sendMessage(
        { action: BackgroundActions.GET_PROMPT, target: "chatgpt" },
        (response) => {
            waitForElm("#prompt-textarea").then((promptTextarea) => {
                const lines = response.prompt.split("\n");
                const prompt = `<p>${lines.join("</p><p>")}</p>`;
                promptTextarea.innerHTML = prompt;

                waitForElm(
                    "button[data-testid=send-button]:not([disabled])"
                ).then((sendButton) => {
                    sendButton.click();
                });
            });
        }
    );
};
