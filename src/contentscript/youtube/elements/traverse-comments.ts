import { Comment } from "../../../types";

interface TraverseCommentElementsResult {
    newCursorThread: Element | null;
    newCommentsCount: number;
    newComments: Comment[];
    isAllCommentsLoaded: boolean;
}

const selectors = {
    threadsContainer: "#comments > #sections > #contents",
    replies: "#replies:not([hidden])",
    expandRepliesButton: "#expander #more-replies:not([hidden]) button",
    moreRepliesButton: "ytd-continuation-item-renderer button",
};

function getCommentFromThread(thread: Element): Comment {
    const commentContent = thread.querySelector<HTMLElement>(":scope > #comment > #body > #main");
    if (!commentContent) {
        console.debug("Unexpected: No comment content found", thread);
        throw new Error("Unexpected: No comment content found");
    }
    return getComment(commentContent);
}

function getComment(node: HTMLElement): Comment {
    const author = node.querySelector<HTMLElement>("#author-text")?.textContent?.trim() || "";
    const publishedTime =
        node.querySelector<HTMLElement>("#published-time-text")?.textContent?.trim() || "";
    const text = node.querySelector<HTMLElement>("#content")?.textContent?.trim() || "";
    const likesCount =
        node.querySelector<HTMLElement>("#vote-count-middle")?.textContent?.trim() || "";
    return { author, publishedTime, text, likesCount };
}

/**
 * Traverses the comment elements and returns the new postponed thread, the new comments count, the new comments, and whether all comments are loaded.
 * @param startThread - The thread to start traversing from.
 * @returns An object containing the new postponed thread, the new comments count, the new comments, and whether all comments are loaded.
 */
export function traverseCommentElements(
    startThread: Element | null
): TraverseCommentElementsResult {
    if (startThread && !startThread.nextElementSibling) {
        // startThread is the last thread
        startThread.scrollIntoView({ behavior: "smooth", block: "end" });
        return {
            newCursorThread: null,
            newCommentsCount: 0,
            newComments: [],
            isAllCommentsLoaded: true,
        };
    }

    const threadsContainer = document.querySelector(selectors.threadsContainer);
    if (!threadsContainer) {
        throw new Error("Unexpected: No threads container found");
    }
    let thread = startThread?.nextElementSibling || threadsContainer.firstElementChild;
    if (!thread) {
        throw new Error("Unexpected: No thread found");
    }

    let scrollTarget: Element | null = null;
    let newCursorThread: Element | null = null;
    let newCommentsCount: number = 0;
    const newComments: Comment[] = [];

    console.debug("start while loop", thread);

    while (thread && thread.nodeName === "YTD-COMMENT-THREAD-RENDERER") {
        const repliesContainer = thread.querySelector(selectors.replies);

        // no replies
        if (!repliesContainer) {
            if (!scrollTarget) {
                const comment = getCommentFromThread(thread);
                newComments.push(comment);
                newCommentsCount += 1;
                newCursorThread = thread;
            }

            thread = thread.nextElementSibling;
            continue;
        }

        // if there are replies, expand them
        const expandRepliesButton = repliesContainer.querySelector<HTMLButtonElement>(
            selectors.expandRepliesButton
        );
        if (expandRepliesButton) {
            expandRepliesButton.click();
            if (!scrollTarget) {
                scrollTarget = expandRepliesButton.closest("#expander");
                if (!scrollTarget) {
                    console.debug("Unexpected: No scroll target found", expandRepliesButton);
                    throw new Error("Unexpected: No scroll target found");
                }
                newCursorThread = thread.previousElementSibling;
            }

            thread = thread.nextElementSibling;
            continue;
        }

        const replyCommentsContainer = repliesContainer.querySelector(
            "#expander-contents > #contents"
        );
        if (!replyCommentsContainer) {
            throw new Error("Unexpected: No reply comments container found");
        }

        // not loaded replies
        if (
            replyCommentsContainer.firstElementChild?.nodeName === "YTD-CONTINUATION-ITEM-RENDERER"
        ) {
            if (!scrollTarget) {
                scrollTarget = replyCommentsContainer.closest("#expander");
                if (!scrollTarget) {
                    console.debug("Unexpected: No scroll target found", expandRepliesButton);
                    throw new Error("Unexpected: No scroll target found");
                }
                newCursorThread = thread.previousElementSibling;
            }

            thread = thread.nextElementSibling;
            continue;
        }

        const moreRepliesButton = repliesContainer.querySelector<HTMLButtonElement>(
            selectors.moreRepliesButton
        );
        // more replies button
        if (moreRepliesButton) {
            moreRepliesButton.click();
            if (!scrollTarget) {
                console.debug("set more replies button as scroll target", moreRepliesButton);
                scrollTarget = moreRepliesButton.closest("ytd-continuation-item-renderer");
                if (!scrollTarget) {
                    console.debug("Unexpected: No scroll target found", moreRepliesButton);
                    throw new Error("Unexpected: No scroll target found");
                }
                newCursorThread = thread.previousElementSibling;
            }

            thread = thread.nextElementSibling;
            continue;
        }

        // all replies loaded
        if (!scrollTarget) {
            const comment = getCommentFromThread(thread);
            const repliesContents =
                repliesContainer.querySelectorAll<HTMLElement>("#contents #body #main");
            comment.replies = Array.from(repliesContents).map(getComment);
            newComments.push(comment);
            newCommentsCount += 1 + comment.replies.length;
            newCursorThread = thread;
        }

        thread = thread.nextElementSibling;
    }

    console.debug("after while loop", scrollTarget, newCursorThread, thread);

    let isAllCommentsLoaded = false;

    if (scrollTarget) {
        // scroll to the break point for waiting loading replies
        scrollTarget.scrollIntoView({ behavior: "smooth" });
    } else {
        // no break point, scroll to the end spinner of the page
        if (!newCursorThread && thread?.nodeName === "YTD-CONTINUATION-ITEM-RENDERER") {
            newCursorThread = thread.previousElementSibling;
            if (!newCursorThread) {
                throw new Error("Unexpected: No postponed thread found");
            }
            thread.scrollIntoView({ behavior: "smooth", block: "end" });
        } else {
            const lastThread = thread || newCursorThread;
            if (!lastThread) {
                throw new Error("Unexpected: No last thread found");
            }
            lastThread.scrollIntoView({ behavior: "smooth", block: "end" });
            isAllCommentsLoaded = !thread;
        }
    }

    return {
        newCursorThread,
        newCommentsCount,
        newComments,
        isAllCommentsLoaded,
    };
}
