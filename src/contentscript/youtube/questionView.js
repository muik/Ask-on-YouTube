import { handleSendMessageError } from "../../errors.js";
import { getTitleTokens, setTitleToken } from "./questionDialog/titleToken.js";
import { showToastMessage } from "./toast.js";

const containerId = "dialog-container";
const defaultQuestion = "주요 요점이 무엇인가요?";

export function showQuestionDialog(videoInfo) {
    let containerElement = document.querySelector(
        `ytd-popup-container #${containerId}`
    );
    if (!containerElement) {
        containerElement = insertQuestionDialog();
    } else {
        containerElement.style.display = "block";
    }

    document.body.insertAdjacentHTML("beforeend", getDialogBackgoundHtml());

    // close the dialog when the user clicks the background
    const backgroundElement = document.querySelector(
        "tp-yt-iron-overlay-backdrop"
    );
    backgroundElement.addEventListener("click", () => {
        hideQuestionDialog();
    });

    setQuestionDialogContent(videoInfo);
    showProgressSpinner(containerElement);

    // set dialog position in the center of the screen
    repositionDialog();

    try {
        chrome.runtime.sendMessage(
            { message: "getSuggestedQuestions", videoInfo },
            (response) => {
                if (chrome.runtime.lastError || response.error) {
                    const error = chrome.runtime.lastError || response.error;
                    console.error("getSuggestedQuestions Error:", error);
                    setError(`Failed to load - ${error.message}`);
                } else {
                    console.debug("suggested questions response:", response);
                    setSuggestedQuestions(response);
                }
                hideProgressSpinner(containerElement);
                repositionDialog();
            }
        );
    } catch (error) {
        if (!handleSendMessageError(error)) {
            console.error("sendMessage getSuggestedQuestions Error:", error);
            setError(`Failed to load - ${error.message}`);
        }
        hideProgressSpinner(containerElement);
        repositionDialog();
    }
}

function showProgressSpinner(containerElement) {
    const spinnerElement = containerElement.querySelector("#spinner");
    spinnerElement.removeAttribute("hidden");
    const paperSpinnerElement = spinnerElement.querySelector(
        "tp-yt-paper-spinner"
    );
    paperSpinnerElement.removeAttribute("aria-hidden");
    paperSpinnerElement.setAttribute("active", "");
}

function hideProgressSpinner(containerElement) {
    const spinnerElement = containerElement.querySelector("#spinner");
    spinnerElement.setAttribute("hidden", "");
}

function setQuestionDialogContent(videoInfo) {
    const containerElement = document.querySelector(
        `ytd-popup-container #${containerId}`
    );

    containerElement.setAttribute("video-id", videoInfo.id);

    const inputElement = containerElement.querySelector("input[type='text']");
    const titleElement = containerElement.querySelector(".title");
    const captionElement = containerElement.querySelector(
        ".video-info .caption"
    );
    titleElement.innerHTML = "";
    captionElement.innerHTML = "";

    const titleTokens = getTitleTokens(videoInfo.title);
    titleTokens.forEach(setTitleToken(titleElement, inputElement));

    const thumbnailElement = containerElement.querySelector("img.thumbnail");
    thumbnailElement.setAttribute("src", videoInfo.thumbnail);

    // cursor focus on the input field
    inputElement.focus();

    const suggestionsElement = containerElement.querySelector("ul.suggestions");
    suggestionsElement.innerHTML = "";
}

function setSuggestedQuestions(response) {
    const containerElement = document.querySelector(
        `ytd-popup-container #${containerId}`
    );
    const thumbnailElement = containerElement.querySelector(
        ".video-info img.thumbnail"
    );
    const captionElement = containerElement.querySelector(
        ".video-info .caption"
    );
    const inputElement = containerElement.querySelector("input[type='text']");
    const suggestionsElement = containerElement.querySelector("ul.suggestions");

    thumbnailElement.setAttribute("title", response.caption);
    captionElement.textContent = response.caption;

    captionElement.addEventListener("click", (e) => {
        const caption = e.target.textContent;
        if (caption) {
            inputElement.value = caption;
        }
    });

    const questions = response.questions;
    if (questions) {
        const questionClickListener = (e) => {
            const question = e.target.textContent;
            inputElement.value = question;
        };

        questions.forEach((question) => {
            const li = document.createElement("li");
            li.textContent = question;
            suggestionsElement.appendChild(li);

            li.addEventListener("click", questionClickListener);
        });
    }
}

function setError(message) {
    const containerElement = document.querySelector(
        `ytd-popup-container #${containerId}`
    );
    const errorElement = containerElement.querySelector("p.error");
    errorElement.textContent = message;
}

function insertQuestionDialog() {
    document
        .querySelector("ytd-popup-container")
        .insertAdjacentHTML("beforeend", getQuestionHtml());

    const containerElement = document.querySelector(
        `ytd-popup-container #${containerId}`
    );
    // request button click event
    const requestButton = containerElement.querySelector(
        "#contents button.question-button"
    );
    requestButton.addEventListener("click", onRequestButtonClick);

    // enter key event on the input field
    const inputElement = containerElement.querySelector(
        "#contents input[type='text']"
    );
    inputElement.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            requestButton.click();
        }
    });

    // close the dialog when the user clicks the close button
    const closeButton = containerElement.querySelector("#close-button");
    closeButton.addEventListener("click", hideQuestionDialog);

    // close the dialog when the user clicks outside of it or presses escape key
    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            hideQuestionDialog();
        }
    });

    // reposition the dialog when the window is resized
    window.addEventListener("resize", () => {
        repositionDialog();
    });

    return containerElement;
}

function onRequestButtonClick(event) {
    const buttonElement = event.target;
    const containerElement = buttonElement.closest(
        `ytd-popup-container #${containerId}`
    );
    const inputElement = containerElement.querySelector(
        "#contents input[type='text']"
    );
    const question = inputElement.value || inputElement.placeholder;
    const thumbnailElement = containerElement.querySelector("img.thumbnail");
    const videoInfo = {
        id: containerElement.getAttribute("video-id"),
        title: containerElement.querySelector(".title").textContent,
        caption: thumbnailElement.getAttribute("title") || null,
    };
    const target = "chatgpt";

    // set loading state
    buttonElement.setAttribute("disabled", "");
    inputElement.setAttribute("disabled", "");

    try {
        chrome.runtime.sendMessage(
            { message: "setPrompt", target: target, videoInfo, question },
            (response) => {
                onPromptSet(response);
                buttonElement.removeAttribute("disabled");
                inputElement.removeAttribute("disabled");
            }
        );
    } catch (error) {
        console.error("sendMessage setPrompt Error:", error);
        showToastMessage(`sendMessage setPrompt Error: ${error.message}`);
        buttonElement.removeAttribute("disabled");
        inputElement.removeAttribute("disabled");
    }
}

function onPromptSet(response) {
    if (isQuestionDialogClosed()) {
        return;
    }

    if (chrome.runtime.lastError) {
        const errorMessage = `Error - ${
            chrome.runtime.lastError.message || chrome.runtime.lastError
        }`;
        console.error("Error setting prompt.", chrome.runtime.lastError);
        showToastMessage(errorMessage);
        return;
    }

    if (response.error) {
        const { code, message } = response.error;
        if (code === "TRANSCRIPT_NOT_FOUND") {
            showToastMessage(message);
        } else {
            const errorMessage = `Error - code: ${code}`;
            console.error("Error setting prompt.", response.error);
            showToastMessage(errorMessage);
        }
        return;
    }

    if (!response.targetUrl) {
        console.error("Error - targetUrl is not set.");
        showToastMessage("Error - targetUrl is not set.");
        return;
    }

    window.open(response.targetUrl, "_blank");

    hideQuestionDialog();
}

function repositionDialog() {
    const containerElement = document.querySelector(
        `ytd-popup-container #${containerId}`
    );
    if (!containerElement || containerElement.style.display == "none") {
        return;
    }

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const dialogWidth = containerElement.offsetWidth;
    const dialogHeight = containerElement.offsetHeight;
    const dialogX = (screenWidth - dialogWidth) / 2;
    const dialogY = (screenHeight - dialogHeight) / 2;
    containerElement.style.left = `${dialogX}px`;
    containerElement.style.top = `${dialogY}px`;

    // set z-index to the highest possible value
    const zIndexElements = document.querySelectorAll("[style*='z-index']");
    const highestZIndex =
        Math.max(
            ...Array.from(zIndexElements).map((element) =>
                parseInt(element.style.zIndex)
            )
        ) || 2200;

    const backdropElement = document.querySelector(
        "tp-yt-iron-overlay-backdrop"
    );
    backdropElement.style.zIndex = highestZIndex + 1;
    containerElement.style.zIndex = highestZIndex + 2;
}

function isQuestionDialogClosed() {
    const containerElement = document.querySelector(
        `ytd-popup-container #${containerId}`
    );
    return containerElement && containerElement.style.display === "none";
}

function hideQuestionDialog() {
    const containerElement = document.querySelector(
        `ytd-popup-container #${containerId}`
    );
    containerElement.style.display = "none";

    const inputElement = containerElement.querySelector(
        "#contents input[type='text']"
    );
    inputElement.value = "";

    const backgroundElement = document.querySelector(
        "tp-yt-iron-overlay-backdrop"
    );
    if (backgroundElement) {
        backgroundElement.remove();
    }
}

function getDialogBackgoundHtml() {
    return `<tp-yt-iron-overlay-backdrop opened="" class="opened"></tp-yt-iron-overlay-backdrop>`;
}

function getQuestionHtml() {
    return `
<div id="${containerId}" role="dialog" class="style-scope ytd-popup-container ytq-dialog" style="position: fixed;">
  <ytd-unified-share-panel-renderer class="style-scope ytd-popup-container" tabindex="-1" links-only="true" can-post="">
    <yt-icon-button id="close-button" class="style-scope ytd-unified-share-panel-renderer" role="button" aria-label="취소"><button id="button" class="style-scope yt-icon-button" aria-label="취소">
      <yt-icon icon="close" class="style-scope ytd-unified-share-panel-renderer"><span class="yt-icon-shape style-scope yt-icon yt-spec-icon-shape"><div style="width: 100%; height: 100%; display: block; fill: currentcolor;"><svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true" style="pointer-events: none; display: inherit; width: 100%; height: 100%;"><path d="m12.71 12 8.15 8.15-.71.71L12 12.71l-8.15 8.15-.71-.71L11.29 12 3.15 3.85l.71-.71L12 11.29l8.15-8.15.71.71L12.71 12z"></path></svg></div></span></yt-icon>
    </button><yt-interaction id="interaction" class="circular style-scope yt-icon-button"><div class="stroke style-scope yt-interaction"></div><div class="fill style-scope yt-interaction"></div></yt-interaction></yt-icon-button>
    <yt-share-panel-header-renderer id="share-panel-header" class="style-scope ytd-unified-share-panel-renderer">
    <div id="title-bar" class="style-scope yt-share-panel-header-renderer">
      <div id="title" class="style-scope yt-share-panel-header-renderer"><yt-share-panel-title-v15-renderer class="style-scope yt-share-panel-header-renderer"><h2 id="title" class="style-scope yt-share-panel-title-v15-renderer">Ask to AI</h2>
    </yt-share-panel-title-v15-renderer></div>
    </div>
    </yt-share-panel-header-renderer>
    <div id="contents" class="style-scope ytd-unified-share-panel-renderer">
      <div class="video-info">
        <img class="thumbnail" />
        <div class="text-container">
          <div class="title"></div>
          <span class="caption inputable"></span>
        </div>
      </div>
      <div class="question-input-container">
        <input type="text" value="" placeholder="${defaultQuestion}">
        <button class="question-button"><span class="default-text">요청</span><span class="loading-text">요청 중..</span></button>
      </div>
      <div class="question-suggestions">
        <span class="title">Suggestions</span>
        <ul class="suggestions"></ul>
        <p class="error"></p>
        ${spinnerHtml}
      </div>
    </div>
  </ytd-unified-share-panel-renderer>
</div>
`;
}

const spinnerHtml = `
<div id="spinner" class="style-scope ytd-unified-share-panel-renderer" style="height: 111px">
<tp-yt-paper-spinner class="style-scope ytd-unified-share-panel-renderer" aria-label="loading" active=""><div id="spinnerContainer" class="active  style-scope tp-yt-paper-spinner">
  <div class="spinner-layer layer-1 style-scope tp-yt-paper-spinner">
    <div class="circle-clipper left style-scope tp-yt-paper-spinner">
      <div class="circle style-scope tp-yt-paper-spinner"></div>
    </div>
    <div class="circle-clipper right style-scope tp-yt-paper-spinner">
      <div class="circle style-scope tp-yt-paper-spinner"></div>
    </div>
  </div>

  <div class="spinner-layer layer-2 style-scope tp-yt-paper-spinner">
    <div class="circle-clipper left style-scope tp-yt-paper-spinner">
      <div class="circle style-scope tp-yt-paper-spinner"></div>
    </div>
    <div class="circle-clipper right style-scope tp-yt-paper-spinner">
      <div class="circle style-scope tp-yt-paper-spinner"></div>
    </div>
  </div>

  <div class="spinner-layer layer-3 style-scope tp-yt-paper-spinner">
    <div class="circle-clipper left style-scope tp-yt-paper-spinner">
      <div class="circle style-scope tp-yt-paper-spinner"></div>
    </div>
    <div class="circle-clipper right style-scope tp-yt-paper-spinner">
      <div class="circle style-scope tp-yt-paper-spinner"></div>
    </div>
  </div>

  <div class="spinner-layer layer-4 style-scope tp-yt-paper-spinner">
    <div class="circle-clipper left style-scope tp-yt-paper-spinner">
      <div class="circle style-scope tp-yt-paper-spinner"></div>
    </div>
    <div class="circle-clipper right style-scope tp-yt-paper-spinner">
      <div class="circle style-scope tp-yt-paper-spinner"></div>
    </div>
  </div>
</div>
</tp-yt-paper-spinner>
</div>`;
