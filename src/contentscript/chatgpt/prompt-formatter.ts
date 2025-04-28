import { PromptData } from "../../types";
import { getMessage, Messages } from "./messages";

/**
 * Get a prompt with a code block of the text.
 * @param title - The title of the text.
 * @param text - The text to be included in the prompt.
 * @returns A string prompt with the text code block.
 */
export function getCodeBlockedText({ title, text }: { title: string; text: string }): string {
    return `${title}: \`\`\`
${text.trim()}
\`\`\``;
}

export function getVideoInfoPrompt({ videoInfo, langCode, description }: PromptData): string {
    const contents = [];
    const message = getMessage(langCode);
    const title = videoInfo.title.trim();

    contents.push(`${message.title}: ${title}`);

    if (videoInfo.caption) {
        contents.push(
            `${message.caption}: ${videoInfo.caption
                .replace(/`/g, "\\`")
                .replace(/\n/g, " ")
                .replace("  ", ", ")
                .trim()}`
        );
    }

    contents.push(`URL: https://www.youtube.com/watch?v=${videoInfo.id}`);

    if (description) {
        contents.push(getDescriptionPrompt(description, message));
    }

    return contents.join("\n");
}

function getDescriptionPrompt(description: string, message: Messages): string {
    const formattedDescription = description.trim();

    return `${message.description}: \`\`\`${formattedDescription}\`\`\``;
}
