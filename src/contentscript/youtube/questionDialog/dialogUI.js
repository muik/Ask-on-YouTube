import { initAutoComplete } from "../autoComplete.js";
import { containerId, getContainerElement } from "../questionView.js";
import { loadCaption, loadCaptionError } from "./caption.js";
import { getQuestionHtml } from "./html.js";
import { setQuestionOptionsView } from "./questionOptions.jsx";

/**
 * Creates a background overlay element for the dialog
 * @param {Object} options - The options for background element setup
 * @param {Function} options.onClick - Callback for when the background is clicked
 * @returns {HTMLElement} The background element
 */
export function createBackgroundElement({ onClick }) {
    const element = document.createElement("tp-yt-iron-overlay-backdrop");
    element.setAttribute("opened", "");
    element.classList.add("opened");
    element.addEventListener("click", onClick);
    return element;
}

/**
 * Inserts the question dialog into the page
 * @param {Object} options - The options for dialog setup
 * @param {Function} options.onRequestButtonClick - Callback for when the request button is clicked
 * @param {Function} options.onCloseButtonClick - Callback for when the close button is clicked
 * @param {Function} options.onEscapeKey - Callback for when escape key is pressed
 * @param {Function} options.onResize - Callback for when window is resized
 * @returns {HTMLElement} The container element
 */
export function insertQuestionDialog({
    onRequestButtonClick,
    onCloseButtonClick,
    onResize
}) {
    document
        .querySelector("ytd-popup-container")
        .insertAdjacentHTML("beforeend", getQuestionHtml());

    const containerElement = getContainerElement();
    
    // Setup thumbnail events
    const thumbnailElement = containerElement.querySelector("img.thumbnail");
    thumbnailElement.addEventListener("load", loadCaption);
    thumbnailElement.addEventListener("error", loadCaptionError);

    // Setup button events
    const requestButton = containerElement.querySelector("#contents button.question-button");
    requestButton.addEventListener("click", onRequestButtonClick);

    // Setup input events
    const inputElement = containerElement.querySelector("#contents textarea.question-input");
    inputElement.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            requestButton.click();
        }
    });

    // Setup caption click event
    const captionElement = containerElement.querySelector(".video-info .caption");
    captionElement.addEventListener("click", textToInputClickListener);

    setQuestionOptionsView(containerElement);

    // Setup close events
    const closeButton = containerElement.querySelector("#close-button");
    closeButton.addEventListener("click", onCloseButtonClick);

    window.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            onCloseButtonClick();
        }
    });

    window.addEventListener("resize", onResize);

    initAutoComplete(inputElement);

    return containerElement;
}

export function textToInputClickListener(e) {
    e.preventDefault();
    const text = e.target.textContent.replace(/\n/g, " ").replace("  ", ", ").trim();
    if (text) {
        const containerElement = e.target.closest(`#${containerId}`);
        const inputElement = containerElement.querySelector("textarea.question-input");
        inputElement.value = text;

        // focus on the input field, and move the cursor to the end of the text
        inputElement.focus();
        inputElement.setSelectionRange(text.length, text.length);
        inputElement.dispatchEvent(new CustomEvent("input"));
    }
} 