export const SELECTORS = {
    comments: {
        sections: "#comments > #sections",
        headerCount: "#comments > #sections > #header #count",
        threadsContainer: "#comments > #sections > #contents", // comment items container
        threadContent: ":scope > #comment > #body > #main",
    },
    comment: {
        author: "#author-text",
        publishedTime: "#published-time-text",
        text: "#content",
        likesCount: "#vote-count-middle",
    },
    commentText: {
        attributedString: "yt-attributed-string",
        textSpan: ".yt-core-attributed-string",
        text: "span[role='text']",
    },
    replies: {
        container: "#replies:not([hidden])",
        expanderContainer: "#expander",
        expandButton: "#expander #more-replies:not([hidden]) button",
        moreRepliesContainer: "ytd-continuation-item-renderer",
        moreButton: "ytd-continuation-item-renderer button",
        itemContents: "#contents #body #main",
        commentsContainer: "#expander-contents > #contents",
    },
} as const; // Use "as const" for stricter typing

export const NODE_NAMES = {
    commentThread: "YTD-COMMENT-THREAD-RENDERER",
    continuation: "YTD-CONTINUATION-ITEM-RENDERER",
    messageRenderer: "YTD-MESSAGE-RENDERER",
} as const;

export const ATTRIBUTES = {
    canShowMore: "can-show-more",
} as const;

/**
 * Scroll behavior for the scrollIntoView method.
 * "auto" - The browser will scroll the element into view at its current position.
 * "smooth" - The browser will scroll the element into view with a smooth animation.
 */
export const SCROLL_BEHAVIOR = "auto";
