import { ObserverManager } from "../observer.ts";

/**
 * Injects the 'q' shortcut help message into YouTube's keyboard shortcut dialog.
 * This function observes the popup container for the shortcut dialog and adds
 * our custom shortcut information when the dialog appears.
 */
export function injectShortcutHelp() {
    new ObserverManager().findOrObserveElement(
        "body > ytd-app > ytd-popup-container.ytd-app",
        container => {
            const observer = new MutationObserver((mutations, observer) => {
                const dialog = mutations.find(
                    mutation =>
                        mutation.addedNodes.length > 0 &&
                        mutation.addedNodes[0].tagName === "TP-YT-PAPER-DIALOG" &&
                        mutation.addedNodes[0].querySelector("ytd-hotkey-dialog-renderer")
                )?.addedNodes[0];

                if (dialog) {
                    onShortcutHelpDialogChanged(dialog);
                    observer.disconnect();
                }
            });

            observer.observe(container, { childList: true });
        }
    );
}

/**
 * Handles changes to the shortcut help dialog and adds our custom shortcut.
 * We keep observing the options section because YouTube's site might remove our added shortcut
 * when the dialog is open. This ensures our shortcut stays in the dialog.
 * @param {HTMLElement} dialog - The shortcut help dialog element
 */
function onShortcutHelpDialogChanged(dialog) {
    // Keep observing only the options section for changes
    const observer = new MutationObserver(() => {
        const isDialogVisible = !dialog.hasAttribute("aria-hidden");

        if (isDialogVisible) {
            const generalSectionOptions = dialog.querySelector(
                "#sections > ytd-hotkey-dialog-section-renderer:nth-child(2) #options"
            );
            if (generalSectionOptions) {
                addShortcutHelpToSection(generalSectionOptions);
            }
        }
    });

    observer.observe(dialog, { attributeFilter: ["aria-hidden"] });
}

/**
 * Adds the custom shortcut option to the shortcut help section.
 * @param {HTMLElement} options - The options container element
 */
function addShortcutHelpToSection(options) {
    const newOption = options.firstElementChild.cloneNode(true);
    const label = newOption.querySelector("#label");
    const hotkey = newOption.querySelector("#hotkey");

    if (label && hotkey) {
        label.textContent = chrome.i18n.getMessage("questionButtonText");
        hotkey.textContent = "q";
        options.appendChild(newOption);
    }
}
