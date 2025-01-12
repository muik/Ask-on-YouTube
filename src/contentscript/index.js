"use strict";

import { config } from "./config";
import { runOnGeminiPage } from "./gemini";
import { insertSummaryBtn } from "./youtube";
import { detectVideoOptionClick, insertMoreOptions } from "./youtube/moreOptions";

let oldHref = "";

window.onload = async () => {
        
  if (window.location.hostname === "www.youtube.com") {
        
        if (window.location.search !== "" && window.location.search.includes("v=")) {
      insertSummaryBtn();
    }

    const bodyList = document.querySelector("body");
    let observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (oldHref !== document.location.href) {
          oldHref = document.location.href;
          insertSummaryBtn();
        }
      });
    });
    observer.observe(bodyList, { childList: true, subtree: true });

    insertMoreOptions();

    document.addEventListener("click", (event) => {
      detectVideoOptionClick(event.target);
    });
  }

  // If opened by the extension, insert the prompt
  if (
    window.location.hostname === "chatgpt.com" &&
    window.location.search === `?ref=${config['refCode']}`
  ) {
    if (document.getElementsByTagName("textarea")[0]) {
      // get prompt from background.js
      chrome.runtime.sendMessage({ message: "getPrompt" }, (response) => {
        setTimeout(() => {
          const promptTextarea = document.querySelector("main form .ProseMirror");
          promptTextarea.innerHTML = `<p>${response.prompt}</p>`;

          setTimeout(() => {
                            const sendButton = document.querySelector('[data-testid="send-button"]');
            sendButton.click();
          }, 100);
        }, 100);
      });
    }
  }

  runOnGeminiPage();
};
