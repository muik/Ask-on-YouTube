import { ObserverManager } from "../../observer";
import { extraOptionsClassName, getOptionClickResult, setOptionClickResult } from "../moreOptions";
import { ClickElementType } from "../videoInfo";
import { createExtraOptionsContainer } from "./elements";

const observerManager = new ObserverManager();

/**
 * Handle finding and inserting extra options into the footer of a shorts item dropdown
 * @param dropdown - The dropdown node element
 * @returns Returns true if footer was found and handled, false otherwise
 */
export function handleShortsItemFooter(dropdown: Element): boolean {
    const sheetViewModel = dropdown.querySelector("yt-sheet-view-model");
    if (!sheetViewModel) {
        return false;
    }

    observeShortsSheetViewModel(sheetViewModel);

    observerManager.createObserver(
        dropdown,
        (mutations: MutationRecord[]) => {
            mutations.forEach(mutation => {
                const target = mutation.target as Element;

                if (mutation.attributeName === "focused" && target.hasAttribute("focused")) {
                    const extraOptions = target.querySelector(
                        `.${extraOptionsClassName}`
                    ) as HTMLElement;
                    if (!extraOptions) {
                        console.debug("extra options not found", target);
                        return;
                    }

                    const optionClickResult = getOptionClickResult();
                    if (!optionClickResult) {
                        console.debug("no option click result", target);
                        extraOptions.setAttribute("aria-hidden", "true");
                        return;
                    }

                    const { videoInfo, type } = optionClickResult;
                    setOptionClickResult(null);

                    if (type === ClickElementType.NO_EXTRA_OPTIONS) {
                        extraOptions.setAttribute("aria-hidden", "true");
                    }

                    extraOptions.dataset.videoInfoJson = JSON.stringify(videoInfo);
                }
            });
        },
        { attributeFilter: ["focused"] }
    );
    return true;
}

/**
 * Observes the sheet view model for YouTube Shorts dropdowns to insert extra options
 * @param sheetViewModel - The sheet view model element to observe
 */
function observeShortsSheetViewModel(sheetViewModel: Element): void {
    observerManager.createObserver(
        sheetViewModel,
        (mutations: MutationRecord[], observer: MutationObserver) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType !== Node.ELEMENT_NODE) {
                        return;
                    }
                    const footer = (node as Element).querySelector(
                        ".yt-contextual-sheet-layout-wiz__footer-container"
                    );
                    if (!footer) {
                        return;
                    }

                    observerManager.cleanupObserver(observer);

                    const extraOptions = createExtraOptionsContainer();
                    footer.insertAdjacentElement("beforeend", extraOptions);

                    // prevent the extra options from being removed
                    preventExtraOptionsRemoval(footer);
                });
            }
        },
        { childList: true }
    );
}

/**
 * Prevents extra options from being removed by recreating them when they are removed
 * @param footer - The footer element to observe
 */
function preventExtraOptionsRemoval(footer: Element): void {
    observerManager.createObserver(
        footer,
        (mutations: MutationRecord[]) => {
            mutations.forEach(mutation => {
                if (mutation.removedNodes.length > 0) {
                    mutation.removedNodes.forEach(node => {
                        if ((node as Element).classList?.contains(extraOptionsClassName)) {
                            const footer = mutation.target as Element;
                            const extraOptions = createExtraOptionsContainer();
                            footer.insertAdjacentElement("beforeend", extraOptions);
                        }
                    });
                }
            });
        },
        { childList: true }
    );
}
