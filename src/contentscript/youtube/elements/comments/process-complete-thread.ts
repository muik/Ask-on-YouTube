import { Comment } from "../../../../types";
import { SELECTORS } from "./constants";

export interface TraverseState {
    /** Element to scroll to if traversal stops early to wait for replies/more replies to load. */
    scrollTarget: Element | null;
    /** The last successfully processed comment thread element before stopping or finishing. */
    lastProcessedThread: Element | null;
    /** Accumulator for the number of new comments (including replies) found in this pass. */
    newCommentsCount: number;
    /** Accumulator for the new comments (including replies) found in this pass. */
    newComments: Comment[];
}

/**
 * Extracts text with emojis from a comment element.
 * @param contentElement - The comment content element
 * @returns The text content with emojis
 */
function getTextWithEmojis(contentElement: HTMLElement): string {
    const attributedString = contentElement.querySelector<HTMLElement>(
        SELECTORS.commentText.attributedString
    );
    if (!attributedString) {
        return "";
    }

    // Try to find the text span with the specific class first
    let textSpan = attributedString.querySelector<HTMLElement>(SELECTORS.commentText.textSpan);
    if (!textSpan) {
        // Fallback to any span with role="text" or direct text content
        textSpan =
            attributedString.querySelector<HTMLElement>(SELECTORS.commentText.text) ||
            attributedString;
    }

    // Get all child nodes including text nodes and emoji images
    const nodes = Array.from(textSpan.childNodes);

    return nodes
        .map(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent || "";
            }
            if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as HTMLElement;
                // Check for emoji image
                const img = element.querySelector("img");
                if (img) {
                    return img.getAttribute("alt") || "";
                }
                return element.textContent || "";
            }
            return "";
        })
        .join("")
        .trim();
}

/**
 * Extracts the main comment data from a thread element.
 */
function getCommentFromThread(thread: Element): Comment {
    const commentContent = thread.querySelector<HTMLElement>(SELECTORS.comments.threadContent);
    if (!commentContent) {
        console.debug("Unexpected: No comment content found", thread);
        throw new Error("Unexpected: No comment content found");
    }
    return getComment(commentContent);
}

function getComment(node: HTMLElement): Comment {
    const author =
        node.querySelector<HTMLElement>(SELECTORS.comment.author)?.textContent?.trim() || "";
    const publishedTime =
        node.querySelector<HTMLElement>(SELECTORS.comment.publishedTime)?.textContent?.trim() || "";
    const text = getTextWithEmojis(node.querySelector<HTMLElement>(SELECTORS.comment.text) || node);
    const comment: Comment = {
        author: author.substring(1), // exclude the "@", ex: "@John" -> "John"
        publishedTime,
        text,
    };

    const likesText = node
        .querySelector<HTMLElement>(SELECTORS.comment.likesCount)
        ?.textContent?.trim();
    if (likesText) {
        const likesCount = parseInt(likesText);
        if (!isNaN(likesCount)) {
            comment.likesCount = likesCount;
        }
    }

    return comment;
}

/**
 * Processes a thread where replies are fully loaded or non-existent.
 * Only processes if the traversal hasn't already been stopped.
 * @param thread The comment thread element.
 * @param state The traversal state object.
 * @param replyElements Optional array of reply content elements.
 */
export function processCompleteThread(
    thread: Element,
    state: TraverseState,
    replyElements?: NodeListOf<HTMLElement>
): void {
    if (state.scrollTarget) {
        // the scroll target is the thread that is not fully loaded.
        // so we don't process it
        return;
    }

    // Only process if we haven't decided to stop
    const comment = getCommentFromThread(thread);
    let count = 1;
    if (replyElements && replyElements.length > 0) {
        comment.replies = Array.from(replyElements).map(getComment);
        count += comment.replies.length;
    }
    state.newComments.push(comment);
    state.newCommentsCount += count;
    state.lastProcessedThread = thread; // Update cursor to this successfully processed thread
}
