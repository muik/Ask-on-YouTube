import { ObserverManager } from "../../observer";
import { SELECTORS } from "./comments/constants";

export function scrollForLoadingComments(): void {
    const commentsContainer = document.querySelector("#comments");
    if (!commentsContainer) {
        console.debug("Unexpected: No comments container found");
        scrollToBottom();
        return;
    }
    commentsContainer.scrollIntoView({ behavior: "smooth" });
}

function scrollToBottom(): void {
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
    });
}

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

/**
 * Validates the total comments count to ensure it matches the expected count.
 * This is used to ensure that the comments are loaded correctly.
 * @returns void
 */
export function validateTotalCommentsCount(): void {
    const commentsCount = document.querySelectorAll(
        "#comments > #sections > #contents > ytd-comment-thread-renderer"
    ).length;
    const repliesCount = document.querySelectorAll(
        "#comments > #sections > #contents > ytd-comment-thread-renderer #replies #expander-contents > #contents > ytd-comment-view-model"
    ).length;
    console.debug("comments elements validation results", {
        commentsCount: commentsCount,
        repliesCount: repliesCount,
        totalCommentsCount: commentsCount + repliesCount,
    });
}
