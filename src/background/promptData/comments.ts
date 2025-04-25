import { Comment } from "../../types";

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

    for (const c of comments) {
        // Top-level comment line
        const commentLine = `- ${c.author}: "${c.text}"${
            c.likesCount != null ? `, ${c.likesCount} likes` : ""
        }`;
        lines.push(commentLine);

        // If replies exist, add header and list replies
        if (c.replies && c.replies.length > 0) {
            lines.push(`  - ${c.replies.length} Replies:`);
            for (const r of c.replies) {
                const replyLine = `    - ${r.author}: "${r.text}"${
                    r.likesCount != null ? `, ${r.likesCount} likes` : ""
                }`;
                lines.push(replyLine);
            }
        }
    }

    return lines.join("\n");
}
