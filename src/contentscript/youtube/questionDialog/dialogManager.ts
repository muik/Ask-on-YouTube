import { render } from "preact";
import { getContainerElement } from "./container";

export function hideQuestionDialog(): void {
    const containerElement = getContainerElement();
    if (!containerElement) {
        return;
    }

    containerElement.style.display = "none";

    const backgroundElement = document.querySelector("tp-yt-iron-overlay-backdrop");
    if (backgroundElement) {
        backgroundElement.remove();
    }

    render(null, containerElement);
}
