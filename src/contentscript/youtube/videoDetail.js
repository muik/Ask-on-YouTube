import { waitForElm } from "../utils.js";
import { createQuestionInputForm } from "./simpleQuestion.js";

export function injectElements() {
    const containerId = "ytq-detail-related-above";

    waitForElm("#related.style-scope.ytd-watch-flexy").then(
        (targetSectionElement) => {
            if (targetSectionElement.querySelector(`#${containerId}`)) {
                return;
            }

            const containerElement = document.createElement("div");
            containerElement.id = containerId;
            containerElement.className = "ytq";

            const inputForm = createQuestionInputForm();
            containerElement.appendChild(inputForm);

            targetSectionElement.insertAdjacentElement(
                "afterbegin",
                containerElement
            );
        }
    );
}
