import { ObserverManager } from "../../../observer";
import { NODE_NAMES, SELECTORS } from "./constants";
import { getNumberFromText } from "../number";

/**
 * Loads the total comments head count from the comments head section.
 * @param setTotalCommentsCount - The function to set the total comments count.
 * @param observerManager - The observer manager to use.
 */
export function loadTotalCommentsHeadCount(
    setTotalCommentsCount: (count: number | undefined) => void,
    observerManager: ObserverManager
): void {
    observerManager.findOrObserveElement(SELECTORS.comments.threadsContainer, contentsElement => {
        // Comments are turned off.
        if (contentsElement.firstElementChild?.nodeName === NODE_NAMES.messageRenderer) {
            setTotalCommentsCount(0);
            return;
        }

        observerManager.findOrObserveElement(SELECTORS.comments.headerCount, element => {
            const countNumber = getTotalCommentsCountFromCountElement(element);
            setTotalCommentsCount(countNumber);
        });
    });
}

function getTotalCommentsCountFromCountElement(countElement: HTMLElement): number | undefined {
    const countText = countElement.textContent;
    if (!countText) {
        console.debug("No count found");
        return;
    }

    return getNumberFromText(countText);
}
