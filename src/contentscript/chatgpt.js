"use strict";

import { config } from "./config";

window.onload = async () => {
    // If opened by the extension, insert the prompt
    if (
        window.location.hostname === "chatgpt.com" &&
        window.location.search === `?ref=${config["refCode"]}`
    ) {
        if (document.getElementsByTagName("textarea")[0]) {
            // get prompt from background.js
            chrome.runtime.sendMessage({ message: "getPrompt" }, (response) => {
                setTimeout(() => {
                    const promptTextarea = document.querySelector(
                        "main form .ProseMirror"
                    );
                    promptTextarea.innerHTML = `<p>${response.prompt}</p>`;

                    setTimeout(() => {
                        const sendButton = document.querySelector(
                            '[data-testid="send-button"]'
                        );
                        sendButton.click();
                    }, 100);
                }, 100);
            });
        }
    }
};
