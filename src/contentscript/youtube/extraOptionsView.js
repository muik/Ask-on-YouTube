export function setLoadingState(optionElement, value) {
    if (value) {
        optionElement.setAttribute("default-text", optionElement.innerText);
        optionElement.innerHTML = getSpinnerHtml();
        optionElement.setAttribute("disabled", true);
    } else {
        optionElement.innerHTML = optionElement.getAttribute("default-text");
        optionElement.removeAttribute("disabled");
    }
}

function getSpinnerHtml() {
    return `
<tp-yt-paper-spinner id="spinner" class="style-scope ytd-continuation-item-renderer" aria-label="loading" active="">
<div id="spinnerContainer" class="active  style-scope tp-yt-paper-spinner">
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
</tp-yt-paper-spinner>`;
}
