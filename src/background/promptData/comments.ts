import { Comment } from "../../types";
import { formatInlineText } from "./format";

/**
 * Build a prompt with bullets showing nesting, and a "Replies:" header before replies.
 * @param comments Array of top-level Comment objects
 * @returns A single string prompt
 */
export function getCommentsPromptText(comments: Comment[] | undefined): string {
    if (!comments) {
        return "";
    }
    if (comments.length === 0) {
        return "No comments"; // TODO: translate
    }

    const lines: string[] = [];

    function formatCommentLine(c: Comment): string {
        const inlineText = formatInlineText(c.text);
        const postText = c.likesCount ? `, ${c.likesCount} likes` : "";
        return `- ${c.author}: "${inlineText}"${postText}`;
    }

    for (const c of comments) {
        // Top-level comment line
        const commentLine = formatCommentLine(c);
        lines.push(commentLine);

        // If replies exist, add header and list replies
        if (c.replies && c.replies.length > 0) {
            lines.push(`  - ${c.replies.length} Replies:`);
            for (const r of c.replies) {
                const replyLine = `    ${formatCommentLine(r)}`;
                lines.push(replyLine);
            }
        }
    }

    return lines.join("\n");
}
