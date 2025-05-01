import { ObserverManager } from "../../observer";
import { extraOptionsClassName, getOptionClickResult, setOptionClickResult } from "../moreOptions";
import { ClickElementType } from "../videoInfo";
import { createExtraOptionsContainer } from "./elements";

const observerManager = new ObserverManager();

/**
 * Handle finding and inserting extra options into the footer of a video item dropdown
 * @param {HTMLElement} dropdown - The dropdown node element
 * @returns {boolean} - Returns true if footer was found and handled, false otherwise
 */
export function handleVideoItemFooter(dropdown: Element): boolean {
    const footer = dropdown.querySelector(`ytd-menu-popup-renderer #footer`);
    if (!footer) {
        return false;
    }
    const extraOptions = createExtraOptionsContainer();
    footer.insertAdjacentElement("beforeend", extraOptions);

    observerManager.createObserver(
        dropdown,
        (mutations: MutationRecord[]) => {
            mutations.forEach(mutation => {
                const target = mutation.target as HTMLElement;
                const extraOptions = target.querySelector(
                    `.${extraOptionsClassName}`
                ) as HTMLElement;
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
                    if (!optionClickResult || !optionClickResult.videoInfo) {
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
        { attributeFilter: ["focused", "aria-hidden"] }
    );
    return true;
}
