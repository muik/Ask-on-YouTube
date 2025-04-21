import { render } from "preact";
import { ObserverManager } from "../observer.js";
import { SimpleQuestionForm } from "./components/SimpleQuestionForm.tsx";

const observerManager = new ObserverManager();

export function injectDetailRelatedElements() {
    const containerId = "ytq-detail-related-above";
    const relatedSelector = "#page-manager > ytd-watch-flexy #related.ytd-watch-flexy";

    function createContainer() {
        const containerElement = document.createElement("div");
        containerElement.id = containerId;
        containerElement.className = "ytq";

        render(<SimpleQuestionForm />, containerElement);

        return containerElement;
    }

    function insertContainer(targetSectionElement) {
        if (targetSectionElement.querySelector(`#${containerId}`)) {
            return;
        }

        const containerElement = createContainer();
        targetSectionElement.insertAdjacentElement("afterbegin", containerElement);
    }

    observerManager.findOrObserveElement(relatedSelector, insertContainer);
}
