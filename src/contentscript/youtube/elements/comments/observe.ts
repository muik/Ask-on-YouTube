import { ObserverManager } from "../../../observer";
import { SELECTORS } from "./constants";

/**
 * Watches the comments expanded state.
 * @param observerManager - The observer manager to use.
 * @param setIsCommentsExpanded - The function to set the comments expanded state.
 * @param abortSignal - The abort signal to use.
 */
export function watchCommentsExpanded(
    observerManager: ObserverManager,
    setIsCommentsExpanded: (isCommentsExpanded: boolean) => void,
    abortSignal: AbortSignal
): void {
    let timeout: NodeJS.Timeout | undefined;

    setIsCommentsExpanded(false);

    function onExpanded(observer: MutationObserver): () => void {
        return () => {
            observerManager.cleanupObserver(observer);
            if (!abortSignal.aborted) {
                setIsCommentsExpanded(true);
            }
        };
    }

    observerManager.findOrObserveElement(SELECTORS.comments.threadsContainer, commentsContainer => {
        const observer = observerManager.createObserver(
            commentsContainer,
            (_mutations, observer) => {
                clearTimeout(timeout);
                if (abortSignal.aborted) {
                    observerManager.cleanupObserver(observer);
                    return;
                }
                timeout = setTimeout(onExpanded(observer), 50);
            },
            { childList: true, subtree: true }
        );

        // timeout is used to ensure that the observer is not cleaned up prematurely
        timeout = setTimeout(onExpanded(observer), 100);
    });
}
