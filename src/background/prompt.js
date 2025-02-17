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

export async function getGeminiPrompt(videoId, prompt) {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    return prompt ? `${prompt}\n${videoUrl}` : videoUrl;
}

async function getLangOptionsWithLink(videoId) {
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
    const languageOptions = Array.from(captionTracks).map((i) => {
        return i.name.simpleText;
    });

    const first = "English"; // Sort by English first
    languageOptions.sort(function (x, y) {
        return x.includes(first) ? -1 : y.includes(first) ? 1 : 0;
    });
    languageOptions.sort(function (x, y) {
        return x == first ? -1 : y == first ? 1 : 0;
    });

    return Array.from(languageOptions).map((langName) => {
        const link = captionTracks.find(
            (i) => i.name.simpleText === langName
        ).baseUrl;
        return {
            language: langName,
            link: link,
        };
    });
}
