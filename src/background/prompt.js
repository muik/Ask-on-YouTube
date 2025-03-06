import { getTranscriptParagraphised } from "./transcript.js";

/**
 * Load a transcript for a given video ID and language code.
 * @param {string} videoId - The ID of the video to load the transcript for.
 * @param {string} langCode - The language code of the transcript to load. example: "en"
 * @returns {Promise<string>} The transcript for the given video ID and language code.
 */
export async function loadTranscript(videoId, langCode = "en") {
    const items = await getTranscriptItems(videoId);
    if (!items) {
        return;
    }

    const item = items.find((i) => i.language.code === langCode) || items[0];
    const link = item.link;

    return await getTranscriptParagraphised(link);
}

export async function getGeminiCustomPrompt(videoInfo, transcript, prompt) {
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

export async function getGeminiPrompt(videoId, prompt) {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    return prompt ? `${prompt}\n${videoUrl}` : videoUrl;
}

async function getTranscriptItems(videoId) {
    // Get a transcript URL
    const videoPageResponse = await fetch(
        "https://www.youtube.com/watch?v=" + videoId
    );
    const videoPageHtml = await videoPageResponse.text();
    const splittedHtml = videoPageHtml.split('"captions":');

    if (splittedHtml.length < 2) {
        return;
    } // No Caption Available

    const captions_json = JSON.parse(
        splittedHtml[1].split(',"videoDetails')[0].replace("\n", "")
    );
    const captionTracks =
        captions_json.playerCaptionsTracklistRenderer.captionTracks;

    return captionTracks.map((i) => {
        return {
            language: {
                code: i.languageCode,
                name: i.name.simpleText,
            },
            link: i.baseUrl,
        };
    });
}
