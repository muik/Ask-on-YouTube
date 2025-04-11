import { PromptData } from "../../types";
import { getMessage } from "./messages";

export function formatTranscript(transcript: string): string {
    return transcript.trim();
}

export function getTranscriptPrompt(transcript: string, langCode: string): string {
    const message = getMessage(langCode);
    const formattedTranscript = formatTranscript(transcript);
    
    return `${message.transcript}: \`\`\`
${formattedTranscript}
\`\`\``;
}

export function getVideoInfoPrompt(videoInfo: PromptData["videoInfo"], langCode: string): string {
    const message = getMessage(langCode);
    const title = videoInfo.title.trim();
    const captionInline = videoInfo.caption
        ? `${message.caption}: ${videoInfo.caption
              .replace(/`/g, "\\`")
              .replace(/\n/g, " ")
              .replace("  ", ", ")
              .trim()}\n`
        : "";

    return `${message.title}: ${title}
${captionInline}URL: https://www.youtube.com/watch?v=${videoInfo.id}`;
} 