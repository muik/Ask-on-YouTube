import { ObserverManager } from "src/contentscript/observer";

export function getCommentsCountHeader() {
    return document.querySelector<HTMLElement>("#comments #header");
}

export function getCommentsCount(headerElement: HTMLElement): number | undefined {
    const countElement = headerElement.querySelector<HTMLElement>("#count");
    if (!countElement) {
        console.debug("No count element found");
        return;
    }

    return getTotalCommentsCountFromCountElement(countElement);
}

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

export interface Comment {
    author: string;
    publishedTime: string;
    text: string;
    likesCount: string;
    repliesCount?: number;
    replies?: Comment[];
}

export function getComments(): Comment[] {
    const items = document.querySelectorAll<HTMLElement>(
        "#comments > #sections > #contents > ytd-comment-thread-renderer > #comment > #body > #main"
    );

    return Array.from(items).map(item => getComment(item));
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

export function getIsAllCommentsLoaded(): boolean {
    return !document.querySelector(
        "#comments > #sections > #contents > ytd-continuation-item-renderer"
    );
}

export function watchCommentsLoaded(
    observerManager: ObserverManager,
    setComments: (comments: Comment[] | ((prev: Comment[]) => Comment[])) => void,
    setIsAllCommentsLoaded: (isAllCommentsLoaded: boolean) => void,
    setIsCommentsLoading: (isCommentsLoading: boolean) => void
): void {
    const newComments: Comment[] = [];
    const commentsContainerSelector = "#comments > #sections > #contents";
    let allCommentsLoadedTimeout: NodeJS.Timeout | undefined;

    function allCommentsLoaded(): void {
        console.debug("allCommentsLoaded");
        setIsAllCommentsLoaded(true);
        setIsCommentsLoading(false);

        if (newComments.length > 0) {
            // append new comments to the list
            setComments(comments => [...comments, ...newComments]);
            newComments.length = 0;
        }
    }

    observerManager.findOrObserveElement(commentsContainerSelector, element => {
        observerManager.createObserver(
            element,
            mutations => {
                for (const mutation of mutations) {
                    if (mutation.type !== "childList") {
                        continue;
                    }

                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType !== Node.ELEMENT_NODE) {
                            return;
                        }

                        if (node.nodeName === "YTD-COMMENT-THREAD-RENDERER") {
                            const itemElement = node as HTMLElement;
                            const contentElement = itemElement.querySelector<HTMLElement>(
                                ":scope > #comment > #body > #main"
                            );
                            if (contentElement) {
                                const comment = getComment(contentElement);
                                newComments.push(comment);
                            }
                        } else if (node.nodeName === "YTD-CONTINUATION-ITEM-RENDERER") {
                            clearTimeout(allCommentsLoadedTimeout);

                            setIsAllCommentsLoaded(false);
                            setIsCommentsLoading(false);

                            if (newComments.length > 0) {
                                // append new comments to the list
                                setComments(comments => [...comments, ...newComments]);
                                newComments.length = 0;
                            }
                        }
                    });
                    mutation.removedNodes.forEach(node => {
                        if (node.nodeName === "YTD-CONTINUATION-ITEM-RENDERER") {
                            setIsCommentsLoading(true);
                            newComments.length = 0;
                        }
                    });

                    if (newComments.length > 0) {
                        clearTimeout(allCommentsLoadedTimeout);
                        allCommentsLoadedTimeout = setTimeout(allCommentsLoaded, 50);
                    }
                }
            },
            { childList: true }
        );
    });
}

export function scrollForMoreComments(): void {
    const loadMoreButton = document.querySelector(
        "#comments > #sections > #contents > ytd-continuation-item-renderer"
    );
    if (!loadMoreButton) {
        console.debug("Unexpected: No load more button found");
        scrollToBottom();
        return;
    }
    loadMoreButton.scrollIntoView({ behavior: "smooth" });
}

export function loadTotalCommentsCount(
    setTotalCommentsCount: (count: number | undefined) => void,
    observerManager: ObserverManager
): void {
    const countElementSelector = "#comments > #sections > #header #count";
    observerManager.findOrObserveElement(countElementSelector, element => {
        const countNumber = getTotalCommentsCountFromCountElement(element);
        setTotalCommentsCount(countNumber);
    });
}

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

export function watchCommentsSpinner(observerManager: ObserverManager): void {
    const spinnerSelector = "#comments > #sections > #spinner-container";
    console.debug("watching comments spinner", spinnerSelector);
    observerManager.findOrObserveElement(spinnerSelector, element => {
        console.debug("spinner element", element);
        observerManager.createObserver(
            element,
            mutations => {
                console.debug("spinner mutations", mutations);
            },
            { attributes: true }
        );
    });
}

export function expandReplyComments(): boolean {
    const expandButtons = document.querySelectorAll<HTMLButtonElement>(
        "#comments > #sections > #contents > ytd-comment-thread-renderer > #replies #expander #more-replies button"
    );
    expandButtons.forEach(button => {
        button.click();
    });
    return expandButtons.length > 0;
}

export function showMoreReplies(): boolean {
    const expandButtons = document.querySelectorAll<HTMLButtonElement>(
        "#comments > #sections > #contents > ytd-comment-thread-renderer > #replies #expander ytd-continuation-item-renderer button"
    );
    expandButtons.forEach(button => {
        button.click();
    });
    return expandButtons.length > 0;
}

export function scrollToBottomOfCommentsContainer(): void {
    const commentsContainer = document.querySelector("#comments");
    if (!commentsContainer) {
        console.debug("Unexpected: No comments container found");
        return;
    }
    commentsContainer.scrollIntoView({ behavior: "smooth", block: "end" });
}

export function scrollUntilReplyCommentsLoaded(
    observerManager: ObserverManager,
    setIsReplyCommentsLoading: (isReplyCommentsLoading: boolean) => void
): void {
    const commentsContainerSelector = "#comments > #sections > #contents";
    let scrollTimeout: NodeJS.Timeout | undefined;

    setIsReplyCommentsLoading(true);

    observerManager.findOrObserveElement(commentsContainerSelector, commentsContainer => {
        observerManager.createObserver(
            commentsContainer,
            (_mutations, observer) => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    const notLoadedReply = commentsContainer.querySelector(
                        ":scope > ytd-comment-thread-renderer > #replies #expander-contents ytd-continuation-item-renderer"
                    );
                    console.debug("scrollTimeout", notLoadedReply);
                    if (!notLoadedReply) {
                        observerManager.cleanupObserver(observer);
                        setIsReplyCommentsLoading(false);
                        commentsContainer.scrollIntoView({ behavior: "smooth", block: "end" });
                        return;
                    }
                    showMoreReplies();
                    notLoadedReply.scrollIntoView({ behavior: "smooth" });
                }, 50);
            },
            { childList: true, subtree: true }
        );
    });
}

const selectors = {
    threadsContainer: "#comments > #sections > #contents",
    replies: "#replies:not([hidden])",
    expandReplies: "#expander #more-replies:not([hidden]) button",
    moreReplies: "ytd-continuation-item-renderer button",
};

function getCommentFromThread(thread: Element): Comment {
    const commentContent = thread.querySelector<HTMLElement>(":scope > #comment > #body > #main");
    if (!commentContent) {
        console.debug("Unexpected: No comment content found", thread);
        throw new Error("Unexpected: No comment content found");
    }
    return getComment(commentContent);
}

export function traverseCommentElements(startThread: Element | null): {
    newPostponedThread: Element | null;
    newCommentsCount: number;
    newComments: Comment[];
} {
    const threadsContainer = document.querySelector(selectors.threadsContainer);
    if (!threadsContainer) {
        throw new Error("Unexpected: No threads container found");
    }
    if (startThread && !startThread.nextElementSibling) {
        // startThread is the last thread
        startThread.scrollIntoView({ behavior: "smooth", block: "end" });
        return { newPostponedThread: null, newCommentsCount: 0, newComments: [] };
    }

    let thread = startThread?.nextElementSibling || threadsContainer.firstElementChild;
    if (!thread) {
        throw new Error("Unexpected: No thread found");
    }

    let scrollTarget: Element | null = null;
    let newPostponedThread: Element | null = null;
    let newCommentsCount: number = 0;
    const newComments: Comment[] = [];

    while (thread && thread.nodeName === "YTD-COMMENT-THREAD-RENDERER") {
        const repliesContainer = thread.querySelector(selectors.replies);

        // if there are replies, expand them
        if (repliesContainer) {
            const expandReplies = repliesContainer.querySelector<HTMLButtonElement>(
                selectors.expandReplies
            );
            if (expandReplies) {
                expandReplies.click();
                if (!scrollTarget) {
                    scrollTarget = expandReplies.closest("#expander");
                    if (!scrollTarget) {
                        console.debug("Unexpected: No scroll target found", expandReplies);
                        throw new Error("Unexpected: No scroll target found");
                    }
                    newPostponedThread = thread.previousElementSibling;
                }
            } else {
                const replyCommentsContainer = repliesContainer.querySelector(
                    "#expander-contents > #contents"
                );
                if (!replyCommentsContainer) {
                    throw new Error("Unexpected: No reply comments container found");
                }
                if (
                    replyCommentsContainer.firstElementChild?.nodeName ===
                    "YTD-CONTINUATION-ITEM-RENDERER"
                ) {
                    if (!scrollTarget) {
                        scrollTarget = replyCommentsContainer.closest("#expander");
                        if (!scrollTarget) {
                            console.debug("Unexpected: No scroll target found", expandReplies);
                            throw new Error("Unexpected: No scroll target found");
                        }
                        newPostponedThread = thread.previousElementSibling;
                    }
                } else {
                    // expanded replies
                    const moreReplies = repliesContainer.querySelector<HTMLButtonElement>(
                        selectors.moreReplies
                    );
                    if (moreReplies) {
                        moreReplies.click();
                        if (!scrollTarget) {
                            scrollTarget = moreReplies.closest("#contents");
                            if (!scrollTarget) {
                                console.debug("Unexpected: No scroll target found", moreReplies);
                                throw new Error("Unexpected: No scroll target found");
                            }
                            newPostponedThread = thread.previousElementSibling;
                        }
                    } else {
                        // all replies loaded
                        if (!scrollTarget) {
                            const comment = getCommentFromThread(thread);
                            const repliesContents =
                                repliesContainer.querySelectorAll<HTMLElement>(
                                    "#contents #body #main"
                                );
                            comment.replies = Array.from(repliesContents).map(getComment);
                            newComments.push(comment);
                            newCommentsCount += 1 + comment.replies.length;
                            newPostponedThread = thread;
                        }
                    }
                }
            }
        } else {
            // no replies
            if (!scrollTarget) {
                const comment = getCommentFromThread(thread);
                newComments.push(comment);
                newCommentsCount += 1;
                newPostponedThread = thread;
            }
        }

        thread = thread.nextElementSibling;
    }

    if (scrollTarget) {
        scrollTarget.scrollIntoView({ behavior: "smooth" });
    } else {
        if (!newPostponedThread && thread?.nodeName === "YTD-CONTINUATION-ITEM-RENDERER") {
            newPostponedThread = thread.previousElementSibling;
            if (!newPostponedThread) {
                throw new Error("Unexpected: No postponed thread found");
            }
            thread.scrollIntoView({ behavior: "smooth", block: "end" });
        } else {
            const lastThread = thread || newPostponedThread;
            if (!lastThread) {
                throw new Error("Unexpected: No last thread found");
            }
            lastThread.scrollIntoView({ behavior: "smooth", block: "end" });
        }
    }

    return { newPostponedThread, newCommentsCount, newComments };
}

export function watchReplyCommentsLoaded(
    observerManager: ObserverManager,
    setIsReplyCommentsLoading: (isReplyCommentsLoading: boolean) => void
): void {
    const commentsContainerSelector = "#comments > #sections > #contents";
    let scrollTimeout: NodeJS.Timeout | undefined;

    setIsReplyCommentsLoading(true);

    observerManager.findOrObserveElement(commentsContainerSelector, commentsContainer => {
        observerManager.createObserver(
            commentsContainer,
            (_mutations, observer) => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    observerManager.cleanupObserver(observer);
                    setIsReplyCommentsLoading(false);
                }, 50);
            },
            { childList: true, subtree: true }
        );
    });
}
