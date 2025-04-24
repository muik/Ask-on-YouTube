import { ObserverManager } from "../../observer";

function getTotalCommentsCountFromCountElement(countElement: HTMLElement): number | undefined {
    const countText = countElement.textContent;
    if (!countText) {
        console.debug("No count found");
        return;
    }

    return getNumberFromText(countText);
}

function getNumberFromText(text: string): number {
    return parseInt(text.replace(/,/g, "")) || 0;
}

/**
 * Loads the total comments head count from the comments head section.
 * @param setTotalCommentsCount - The function to set the total comments count.
 * @param observerManager - The observer manager to use.
 */
export function loadTotalCommentsHeadCount(
    setTotalCommentsCount: (count: number | undefined) => void,
    observerManager: ObserverManager
): void {
    const contentsSelector = "#comments > #sections > #contents";
    observerManager.findOrObserveElement(contentsSelector, contentsElement => {
        // Comments are turned off.
        if (contentsElement.firstElementChild?.nodeName === "YTD-MESSAGE-RENDERER") {
            setTotalCommentsCount(0);
            return;
        }

        const countElementSelector = "#comments > #sections > #header #count";
        observerManager.findOrObserveElement(countElementSelector, element => {
            const countNumber = getTotalCommentsCountFromCountElement(element);
            setTotalCommentsCount(countNumber);
        });
    });
}
