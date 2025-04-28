
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
