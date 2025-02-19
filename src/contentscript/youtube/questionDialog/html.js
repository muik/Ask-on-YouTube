import { Config } from "../../../config.js";
import { containerId } from "../questionView.js";

export function getQuestionHtml() {
    const requestButtonName = chrome.i18n.getMessage("requestButtonName");
    const requestingButtonName = chrome.i18n.getMessage("requestingButtonName");
    const questionDialogTitle = chrome.i18n.getMessage("questionDialogTitle");
    const favorites = chrome.i18n.getMessage("favorites");
    const suggestions = chrome.i18n.getMessage("suggestions");
    const recents = chrome.i18n.getMessage("recents");

    return `
<div id="${containerId}" role="dialog" class="style-scope ytd-popup-container ytq ytq-dialog" style="position: fixed;">
  <ytd-unified-share-panel-renderer class="style-scope ytd-popup-container" tabindex="-1" links-only="true" can-post="">
    <yt-icon-button id="close-button" class="style-scope ytd-unified-share-panel-renderer" role="button" aria-label="취소"><button id="button" class="style-scope yt-icon-button" aria-label="취소">
      <yt-icon icon="close" class="style-scope ytd-unified-share-panel-renderer"><span class="yt-icon-shape style-scope yt-icon yt-spec-icon-shape"><div style="width: 100%; height: 100%; display: block; fill: currentcolor;"><svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true" style="pointer-events: none; display: inherit; width: 100%; height: 100%;"><path d="m12.71 12 8.15 8.15-.71.71L12 12.71l-8.15 8.15-.71-.71L11.29 12 3.15 3.85l.71-.71L12 11.29l8.15-8.15.71.71L12.71 12z"></path></svg></div></span></yt-icon>
    </button><yt-interaction id="interaction" class="circular style-scope yt-icon-button"><div class="stroke style-scope yt-interaction"></div><div class="fill style-scope yt-interaction"></div></yt-interaction></yt-icon-button>
    <yt-share-panel-header-renderer id="share-panel-header" class="style-scope ytd-unified-share-panel-renderer">
    <div id="title-bar" class="style-scope yt-share-panel-header-renderer">
      <div id="title" class="style-scope yt-share-panel-header-renderer">
        <yt-share-panel-title-v15-renderer class="style-scope yt-share-panel-header-renderer">
          <h2 id="title" class="style-scope yt-share-panel-title-v15-renderer">${questionDialogTitle}</h2>
        </yt-share-panel-title-v15-renderer>
      </div>
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
      <div class="ytq-form">
        <div class="question-input-container">
          <input type="text" value="">
          <button class="question-button"><span class="default-text">${requestButtonName}</span><span class="loading-text">${requestingButtonName}</span></button>
        </div>
        <p id="question-input-error" class="message"></p>
      </div>
      <div class="question-suggestions">
        <div class="question-options">
          <span class="title" data-option="favorites">${favorites}</span>
          <span class="title" data-option="suggestions">${suggestions}</span>
          <span class="title" data-option="recents">${recents}</span>
        </div>
        <ul class="suggestions"></ul>
        <p id="question-suggestions-error" class="message"></p>
        ${spinnerHtml}
      </div>
    </div>
  </ytd-unified-share-panel-renderer>
</div>`;
}

export function getDialogBackgoundHtml() {
    return `<tp-yt-iron-overlay-backdrop opened="" class="opened"></tp-yt-iron-overlay-backdrop>`;
}

const SPINNER_HEIGHT = 37 * Config.MAX_QUESTIONS_COUNT;

const spinnerHtml = `
<div id="spinner" class="style-scope ytd-unified-share-panel-renderer" style="height: ${SPINNER_HEIGHT}px">
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
