"use strict";

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

};
