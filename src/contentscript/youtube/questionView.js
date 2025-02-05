const containerId = "dialog-container";

export function showQuestionDialog(videoInfo) {
    let containerElement = document.querySelector(
        `ytd-popup-container #${containerId}`
    );
    if (!containerElement) {
        containerElement = insertQuestionDialog();
    } else {
        containerElement.style.display = "block";
    }

    showProgressSpinner(containerElement);
    setTimeout(() => {
        setQuestionDialogContent(videoInfo);
        hideProgressSpinner(containerElement);
        repositionDialog();
    }, 500);

    document.body.insertAdjacentHTML("beforeend", getDialogBackgoundHtml());

    // close the dialog when the user clicks the background
    const backgroundElement = document.querySelector(
        "tp-yt-iron-overlay-backdrop"
    );
    backgroundElement.addEventListener("click", () => {
        hideQuestionDialog();
    });

    // set dialog position in the center of the screen
    repositionDialog();
}

function showProgressSpinner(containerElement) {
    const spinnerElement = containerElement.querySelector("#spinner");
    spinnerElement.removeAttribute("hidden");
    const paperSpinnerElement = spinnerElement.querySelector(
        "tp-yt-paper-spinner"
    );
    paperSpinnerElement.removeAttribute("aria-hidden");
    paperSpinnerElement.setAttribute("active", "");

    containerElement.querySelector("#share-panel-header").style.display =
        "none";
    containerElement.querySelector("#contents").style.display = "none";
}

function hideProgressSpinner(containerElement) {
    const spinnerElement = containerElement.querySelector("#spinner");
    spinnerElement.setAttribute("hidden", "");

    containerElement.querySelector("#share-panel-header").style.display = "";
    containerElement.querySelector("#contents").style.display = "";
}

function setQuestionDialogContent(videoInfo) {
    const containerElement = document.querySelector(
        `ytd-popup-container #${containerId}`
    );

    containerElement.querySelector(".title").textContent = videoInfo.title;
    containerElement
        .querySelector("img.thumbnail")
        .setAttribute("src", videoInfo.thumbnail);

    // cursor focus on the input field
    const inputElement = containerElement.querySelector("input[type='text']");
    inputElement.focus();
}

function insertQuestionDialog() {
    document
        .querySelector("ytd-popup-container")
        .insertAdjacentHTML("beforeend", getQuestionHtml());

    const containerElement = document.querySelector(
        `ytd-popup-container #${containerId}`
    );

    // close the dialog when the user clicks the close button
    const closeButton = containerElement.querySelector("#close-button");
    closeButton.addEventListener("click", () => {
        hideQuestionDialog();
    });

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

function hideQuestionDialog() {
    const containerElement = document.querySelector(
        `ytd-popup-container #${containerId}`
    );
    containerElement.style.display = "none";

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
    <div id="spinner" class="style-scope ytd-unified-share-panel-renderer" hidden="">
    <tp-yt-paper-spinner class="style-scope ytd-unified-share-panel-renderer" aria-label="loading" aria-hidden="true"><div id="spinnerContainer" class="  style-scope tp-yt-paper-spinner">
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
  </div>
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
      <img class="thumbnail" />
      <div class="title"></div>
      <div class="question-input-container">
      <input type="text" value="" placeholder="요약해줘">
      <button class="question-button">질문</button>
    </div>
  </div>
  </ytd-unified-share-panel-renderer>
</div>
`;
}
