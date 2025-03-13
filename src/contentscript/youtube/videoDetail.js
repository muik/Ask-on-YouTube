import { ObserverManager } from "../observer.js";
import { createQuestionInputForm } from "./simpleQuestion.js";

export function injectDetailRelatedElements() {
    const containerId = "ytq-detail-related-above";
    const relatedSelector = "#page-manager > ytd-watch-flexy #related.ytd-watch-flexy";

    function createContainer() {
        const containerElement = document.createElement("div");
        containerElement.id = containerId;
        containerElement.className = "ytq";

        const inputForm = createQuestionInputForm();
        containerElement.appendChild(inputForm);

        return containerElement;
    }

    function insertContainer(targetSectionElement) {
        if (targetSectionElement.querySelector(`#${containerId}`)) {
            return;
        }

        const containerElement = createContainer();
        targetSectionElement.insertAdjacentElement("afterbegin", containerElement);
    }

    const relatedSectionElement = document.querySelector(relatedSelector);
    if (relatedSectionElement) {
        insertContainer(relatedSectionElement);
    } else {
        new ObserverManager().observeParent(
            "#page-manager > ytd-watch-flexy #related.ytd-watch-flexy",
            insertContainer
        );
    }
}
