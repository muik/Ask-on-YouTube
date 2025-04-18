import { VideoInfo } from "../types";
import { TranscriptItem } from "./promptData/page";

/**
 * Load a transcript link for a given video ID and language code.
 * @param videoId - The ID of the video to load the transcript link for
 * @param langCode - The language code of the transcript to load. example: "en"
 * @returns The transcript link for the given video ID and language code
 */
export async function loadTranscriptLink(
    items: TranscriptItem[],
    langCode: string = "en"
): Promise<string> {
    if (!items) {
        throw new Error("No transcript items found");
    }

    const item = items.find(i => i.language.code === langCode) || items[0];
    return item.link;
}

export async function getGeminiCustomPrompt(
    videoInfo: VideoInfo,
    transcript: string,
    prompt: string
): Promise<string> {
    const title = videoInfo.title.trim();
    const transcriptRevised = transcript.trim();
    const captionInline = videoInfo.caption
        ? `Caption: \`${videoInfo.caption
              .replace(/`/g, "\\`")
              .replace(/\n/g, " ")
              .replace("  ", ", ")
              .trim()}\`\n`
        : "";

    return `Title: ${title}
${captionInline}URL: https://www.youtube.com/watch?v=${videoInfo.id}
Transcript: \`\`\`
${transcriptRevised}
\`\`\`
------------
${prompt}`;
}

export async function getGeminiPrompt(videoId: string, prompt?: string): Promise<string> {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    return prompt ? `${prompt}\n${videoUrl}` : videoUrl;
}
