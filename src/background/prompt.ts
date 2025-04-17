import { VideoInfo } from "../types";

interface TranscriptItem {
    language: {
        code: string;
        name: string;
    };
    link: string;
}

interface YouTubeCaptionTrack {
    languageCode: string;
    name: {
        simpleText: string;
    };
    baseUrl: string;
}

interface YouTubeCaptionsResponse {
    playerCaptionsTracklistRenderer: {
        captionTracks: YouTubeCaptionTrack[];
    };
}

/**
 * Load a transcript link for a given video ID and language code.
 * @param videoId - The ID of the video to load the transcript link for
 * @param langCode - The language code of the transcript to load. example: "en"
 * @returns The transcript link for the given video ID and language code
 */
export async function loadTranscriptLink(
    videoId: string,
    langCode: string = "en"
): Promise<string | undefined> {
    const items = await getTranscriptItems(videoId);
    if (!items) {
        return;
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

async function getTranscriptItems(videoId: string): Promise<TranscriptItem[] | undefined> {
    // Get a transcript URL
    const videoPageResponse = await fetch("https://www.youtube.com/watch?v=" + videoId);
    const videoPageHtml = await videoPageResponse.text();
    const splittedHtml = videoPageHtml.split('"captions":');

    if (splittedHtml.length < 2) {
        return;
    } // No Caption Available

    const captionsJson = JSON.parse(
        splittedHtml[1].split(',"videoDetails')[0].replace("\n", "")
    ) as YouTubeCaptionsResponse;
    const captionTracks = captionsJson.playerCaptionsTracklistRenderer.captionTracks;

    return captionTracks.map(track => ({
        language: {
            code: track.languageCode,
            name: track.name.simpleText,
        },
        link: track.baseUrl,
    }));
}
