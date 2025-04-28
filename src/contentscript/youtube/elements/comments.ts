import { ObserverManager } from "../../observer";

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
    const commentsContainerSelector = "#comments > #sections > #contents";
    let scrollTimeout: NodeJS.Timeout | undefined;

    setIsCommentsExpanded(false);

    observerManager.findOrObserveElement(commentsContainerSelector, commentsContainer => {
        observerManager.createObserver(
            commentsContainer,
            (_mutations, observer) => {
                clearTimeout(scrollTimeout);
                if (abortSignal.aborted) {
                    observerManager.cleanupObserver(observer);
                    return;
                }
                scrollTimeout = setTimeout(() => {
                    observerManager.cleanupObserver(observer);
                    if (!abortSignal.aborted) {
                        setIsCommentsExpanded(true);
                    }
                }, 50);
            },
            { childList: true, subtree: true }
        );
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
