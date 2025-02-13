import { getLangOptionsWithLink } from "../contentscript/transcript.js";
import { getPromptChatGPT, getPromptGemini } from "../storage.js";
import { getTranscriptParagraphised } from "./transcript.js";

export async function loadTranscript(videoId) {
    const langOptionsWithLink = await getLangOptionsWithLink(videoId);
    if (!langOptionsWithLink) {
        return;
    }

    const link = langOptionsWithLink[0].link;
    const transcript = await getTranscriptParagraphised(link);

    return transcript;
}

export async function getChatGPTPrompt(videoInfo, transcript, settings) {
    if (settings.promptChatGPT == null) {
        settings.promptChatGPT = await getPromptChatGPT();
    }

    const prompt = settings.promptChatGPT;
    const title = videoInfo.title.trim();
    const transcriptRevised = transcript.trim();

    return `${prompt}\nTitle: "${title}"\nTranscript: "${transcriptRevised}"`;
}

export async function getChatGPTCustomPrompt(videoInfo, transcript, prompt) {
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

export async function getGeminiPrompt(videoId, settings) {
    if (settings.promptGemini == null) {
        settings.promptGemini = await getPromptGemini();
    }

    const prompt = settings.promptGemini;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    return prompt ? `${prompt}\n${videoUrl}` : videoUrl;
}
