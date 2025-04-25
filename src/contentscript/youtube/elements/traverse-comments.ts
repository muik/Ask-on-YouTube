import { Comment } from "../../../types";
import { processCompleteThread, TraverseState } from "./process-complete-thread";

// --- Interfaces ---

interface TraverseCommentElementsResult {
    /** The last successfully processed comment thread element. Used as the starting point for the next traversal. */
    newCursorThread: Element | null;
    /** Total number of new comments (including replies) found. */
    newCommentsCount: number;
    /** Array of new comments (top-level comments may include nested replies). */
    newComments: Comment[];
    /** Flag indicating if the end of all comments (no more continuation elements) was reached. */
    isAllCommentsLoaded: boolean;
}

// --- Constants ---

const SELECTORS = {
    threadsContainer: "#comments > #sections > #contents",
    replies: {
        container: "#replies:not([hidden])",
        expandButton: "#expander #more-replies:not([hidden]) button",
        moreButton: "ytd-continuation-item-renderer button",
        itemContents: "#contents #body #main",
        commentsContainer: "#expander-contents > #contents",
    },
} as const; // Use "as const" for stricter typing

const NODE_NAMES = {
    commentThread: "YTD-COMMENT-THREAD-RENDERER",
    continuation: "YTD-CONTINUATION-ITEM-RENDERER",
} as const;

/**
 * Scroll behavior for the scrollIntoView method.
 * "auto" - The browser will scroll the element into view at its current position.
 * "smooth" - The browser will scroll the element into view with a smooth animation.
 */
const SCROLL_BEHAVIOR = "auto";

// --- Utility Functions ---

function handleCommentWithNotExpandedReplies(
    expandRepliesButton: HTMLButtonElement,
    thread: Element,
    state: TraverseState
) {
    expandRepliesButton.click();
    if (!state.scrollTarget) {
        state.scrollTarget = expandRepliesButton.closest("#expander");
        if (!state.scrollTarget) {
            console.debug("Unexpected: No scroll target found", expandRepliesButton);
            throw new Error("Unexpected: No scroll target found");
        }
        state.lastProcessedThread = thread.previousElementSibling;
    }
}

function handleCommentWithNotLoadedReplies(
    replyCommentsContainer: Element,
    thread: Element,
    state: TraverseState
) {
    if (!state.scrollTarget) {
        state.scrollTarget = replyCommentsContainer.closest("#expander");
        if (!state.scrollTarget) {
            console.debug("Unexpected: No scroll target found", replyCommentsContainer);
            throw new Error("Unexpected: No scroll target found");
        }
        state.lastProcessedThread = thread.previousElementSibling;
    }
}

function handleCommentWithMoreReplies(
    moreRepliesButton: HTMLButtonElement,
    thread: Element,
    state: TraverseState
) {
    moreRepliesButton.click();
    if (!state.scrollTarget) {
        console.debug("set more replies button as scroll target", moreRepliesButton);
        state.scrollTarget = moreRepliesButton.closest("ytd-continuation-item-renderer");
        if (!state.scrollTarget) {
            console.debug("Unexpected: No scroll target found", moreRepliesButton);
            throw new Error("Unexpected: No scroll target found");
        }
        state.lastProcessedThread = thread.previousElementSibling;
    }
}

// --- Core Logic Functions ---

/**
 * Handles the logic for a single comment thread element during traversal.
 * It checks for replies, expands/clicks buttons if necessary, and updates the state.
 * If an action requires waiting (clicking expand/more), it sets `state.scrollTarget`.
 * If a thread and its replies (if any) are fully processed, it updates counts and comments.
 * @param thread The current comment thread element.
 * @param state The mutable traversal state.
 */
function handleThread(thread: Element, state: TraverseState) {
    // Check if replies exist
    const repliesContainer = thread.querySelector(SELECTORS.replies.container);
    if (!repliesContainer) {
        // Case 1: No replies section
        processCompleteThread(thread, state);
        return;
    }

    // if there are replies, expand them
    const expandRepliesButton = repliesContainer.querySelector<HTMLButtonElement>(
        SELECTORS.replies.expandButton
    );
    if (expandRepliesButton) {
        handleCommentWithNotExpandedReplies(expandRepliesButton, thread, state);
        return;
    }

    const replyCommentsContainer = repliesContainer.querySelector(
        SELECTORS.replies.commentsContainer
    );
    if (!replyCommentsContainer) {
        throw new Error("Unexpected: No reply comments container found");
    }

    // not loaded replies
    if (replyCommentsContainer.firstElementChild?.nodeName === "YTD-CONTINUATION-ITEM-RENDERER") {
        handleCommentWithNotLoadedReplies(replyCommentsContainer, thread, state);
        return;
    }

    const moreRepliesButton = repliesContainer.querySelector<HTMLButtonElement>(
        SELECTORS.replies.moreButton
    );
    // more replies button
    if (moreRepliesButton) {
        handleCommentWithMoreReplies(moreRepliesButton, thread, state);
        return;
    }

    // all replies loaded
    if (!state.scrollTarget) {
        const repliesContents = repliesContainer.querySelectorAll<HTMLElement>(
            SELECTORS.replies.itemContents
        );
        processCompleteThread(thread, state, repliesContents);
    }
}

/**
 * Scrolls the view based on the final state of the traversal and determines if all comments were loaded.
 * @param state The final state after the traversal loop.
 * @param nextElement The element immediately following the last processed/checked thread (could be null, continuation, or other).
 * @returns `true` if all comments appear to be loaded, `false` otherwise.
 */
function scrollAndDetermineCompletion(state: TraverseState, thread: Element | null): boolean {
    if (state.scrollTarget) {
        // scroll to the break point for waiting loading replies
        state.scrollTarget.scrollIntoView({ behavior: SCROLL_BEHAVIOR });
        return false;
    }

    // no break point, scroll to the end spinner of the page
    if (!state.lastProcessedThread && thread?.nodeName === NODE_NAMES.continuation) {
        state.lastProcessedThread = thread.previousElementSibling;
        if (!state.lastProcessedThread) {
            throw new Error("Unexpected: No postponed thread found");
        }
        thread.scrollIntoView({ behavior: SCROLL_BEHAVIOR, block: "end" });
        return false;
    }

    const lastThread = thread || state.lastProcessedThread;
    if (!lastThread) {
        throw new Error("Unexpected: No last thread found");
    }
    lastThread.scrollIntoView({ behavior: SCROLL_BEHAVIOR, block: "end" });

    if (!thread) {
        const canShowMore = document
            .querySelector("#comments > #sections")
            ?.hasAttribute("can-show-more");
        return !canShowMore;
    }

    return !thread;
}

// --- Main Exported Function ---

/**
 * Traverses comment elements starting from a given thread, extracting new comments
 * and handling dynamic loading/expansion of replies and top-level comments.
 *
 * @param startThread - The element *after which* to start traversing. If null, starts from the beginning.
 * @returns An object containing the new comments found, count, the last processed thread (cursor),
 * and a flag indicating if all comments on the page appear to be loaded.
 */
export function traverseCommentElements(
    startThread: Element | null
): TraverseCommentElementsResult {
    if (startThread && !startThread.nextElementSibling) {
        // startThread is the last thread
        startThread.scrollIntoView({ behavior: SCROLL_BEHAVIOR, block: "end" });
        return {
            newCursorThread: null,
            newCommentsCount: 0,
            newComments: [],
            isAllCommentsLoaded: true,
        };
    }

    const threadsContainer = document.querySelector(SELECTORS.threadsContainer);
    if (!threadsContainer) {
        throw new Error("Unexpected: No threads container found");
    }
    let thread = startThread?.nextElementSibling || threadsContainer.firstElementChild;
    if (!thread) {
        throw new Error("Unexpected: No thread found");
    }

    const state: TraverseState = {
        scrollTarget: null,
        lastProcessedThread: null,
        newCommentsCount: 0,
        newComments: [],
    };

    console.debug("start while loop", thread);

    while (thread && thread.nodeName === NODE_NAMES.commentThread) {
        handleThread(thread, state);

        thread = thread.nextElementSibling;
    }

    console.debug("after while loop", state, thread);

    const isAllCommentsLoaded = scrollAndDetermineCompletion(state, thread);

    if (isAllCommentsLoaded) {
        console.debug(
            "section html:",
            document.querySelector("#comments > #sections"),
            document.querySelector("#comments > #sections")?.cloneNode(true)
        );
    }

    return {
        newCursorThread: state.lastProcessedThread,
        newCommentsCount: state.newCommentsCount,
        newComments: state.newComments,
        isAllCommentsLoaded,
    };
}
