import { config } from "./config.js";
import { waitForElm } from "./utils.js";

/**
 * Checks if the current page is the Gemini page opened by this extension.
 * @returns {boolean} Returns true if the current page is the Gemini page.
 */
function isOnGeminiPage() {
    if (
        window.location.hostname === "gemini.google.com" &&
        window.location.search === `?ref=${config['refCode']}`
    ) {
        return true;
    }
    return false;
}

/**
 * Runs the script on the Gemini page.
 */
export function runOnGeminiPage() {
    if (!isOnGeminiPage()) {
        return;
    }

    // Select new model
    waitForElm("bard-mode-switcher button").then((element) => {
        // Click the button to open the dropdown
        element.click();

        const modelButtons = document.querySelectorAll(
            ".mat-mdc-menu-content button.mat-mdc-menu-item"
        );
        if (modelButtons && modelButtons.length > 1) {
            modelButtons[1].click();
        }

        insertPrompt();
    });
}

/**
 * Inserts the prompt into the Gemini page.
 */
function insertPrompt() {
    waitForElm("rich-textarea div.ql-editor.textarea.new-input-ui").then(
        (element) => {
            chrome.runtime.sendMessage({ message: "getPrompt" }, (response) => {
                element.innerText = response.prompt;

                // submit the prompt
                setTimeout(() => {
                    document.querySelector("button.send-button").click();
                }, 100);
            });
        }
    );
}
