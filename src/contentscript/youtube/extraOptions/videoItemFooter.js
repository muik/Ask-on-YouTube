import { ObserverManager } from "../../observer.ts";
import {
    extraOptionsClassName,
    getOptionClickResult,
    setOptionClickResult,
} from "../moreOptions.js";
import { ClickElementType } from "../videoInfo.js";
import { createExtraOptionsContainer, insertQuestionMenuUseMark } from "./elements.js";

const observerManager = new ObserverManager();

/**
 * Handle finding and inserting extra options into the footer of a video item dropdown
 * @param {Element} node - The dropdown node element
 * @returns {boolean} - Returns true if footer was found and handled, false otherwise
 */
export function handleVideoItemFooter(dropdown) {
    const footer = dropdown.querySelector(`ytd-menu-popup-renderer #footer`);
    if (!footer) {
        return false;
    }
    const extraOptions = createExtraOptionsContainer();
    footer.insertAdjacentElement("beforeend", extraOptions);
    insertQuestionMenuUseMark(extraOptions);

    observerManager.createObserver(
        dropdown,
        mutations => {
            mutations.forEach(mutation => {
                const target = mutation.target;
                const extraOptions = target.querySelector(`.${extraOptionsClassName}`);
                if (!extraOptions) {
                    console.debug("extra options not found", target);
                    return;
                }

                if (
                    mutation.attributeName === "aria-hidden" &&
                    target.getAttribute("aria-hidden") === "true"
                ) {
                    // to determine the extra options is hidden or not when the dropdown focused
                    extraOptions.removeAttribute("aria-hidden");
                    return;
                }

                if (mutation.attributeName === "focused" && target.hasAttribute("focused")) {
                    const optionClickResult = getOptionClickResult();
                    if (!optionClickResult) {
                        console.debug("no option click result", target);
                        extraOptions.setAttribute("aria-hidden", true);
                        return;
                    }

                    const { videoInfo, type } = optionClickResult;
                    setOptionClickResult(null);

                    if (type === ClickElementType.NO_EXTRA_OPTIONS) {
                        extraOptions.setAttribute("aria-hidden", true);
                    }

                    extraOptions.dataset.videoInfoJson = JSON.stringify(videoInfo);
                }
            });
        },
        { attributeFilter: ["focused", "aria-hidden"] }
    );
    return true;
}
