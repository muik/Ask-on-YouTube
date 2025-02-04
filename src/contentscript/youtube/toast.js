const containerId = "toast-container";

/**
 * Show a toast notification indicating that the browser needs to be reloaded.
 */
export function showToastMessage(message) {
    let containerElement = document.querySelector(`#${containerId}`);
    let toastElement;
    if (!containerElement) {
        document.querySelector("ytd-popup-container").insertAdjacentHTML(
            "beforeend",
            `<yt-notification-action-renderer id="${containerId}">
                <div id="toast-box" style="outline: none; left: 0px; top: 955px;"></div>
            </yt-notification-action-renderer>`
        );

        containerElement = document.querySelector(`#${containerId}`);

        toastElement = containerElement.querySelector("#toast-box");
        toastElement.addEventListener("transitionend", (event) => {
            if (
                event.propertyName === "transform" &&
                !toastElement.classList.contains("open")
            ) {
                toastElement.style.display = "none"; // Hide the element
            }
        });
    } else {
        toastElement = containerElement.querySelector("#toast-box");
    }

    toastElement.textContent = message;

    toastElement.style.display = "";
    toastElement.style.zIndex = "2206";
    toastElement.style.top = `${window.innerHeight - 80}px`;

    // Trigger a reflow to apply transition
    void toastElement.offsetHeight;

    if (!toastElement.classList.contains("open")) {
        toastElement.classList.add("open");
    }

    setTimeout(() => {
        toastElement.classList.remove("open");
    }, 3000);
}
