"use strict";

import { config } from "./config.js";
import { waitForElm } from "./utils.js";

window.onload = async () => {
    // If opened by the extension, insert the prompt
    if (
        window.location.hostname === "chatgpt.com" &&
        window.location.search === `?ref=${config["refCode"]}`
    ) {
        if (document.getElementsByTagName("textarea")[0]) {
            // get prompt from background.js
            chrome.runtime.sendMessage(
                { message: "getPrompt", target: "chatgpt" },
                (response) => {
                    waitForElm("main form .ProseMirror").then(
                        (promptTextarea) => {
                            promptTextarea.innerText = response.prompt;

                            waitForElm(
                                "button[data-testid=send-button]:not([disabled])"
                            ).then((sendButton) => {
                                sendButton.click();
                            });
                        }
                    );
                }
            );
        }
    }
};
