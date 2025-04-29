import { Chapter } from "./types";

interface Transcript {
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

interface YouTubeChapter {
    chapterRenderer: {
        title: {
            simpleText: string;
        };
        timeRangeStartMillis: number;
    };
}

interface VideoPageData {
    transcriptItems: Transcript[] | null;
    description: string | null;
    chapters: Chapter[] | null;
}

/**
 * Get page prompt data from a video page
 * @param videoId - The ID of the video to get page prompt data from
 * @returns The page prompt data from the video page
 */
export async function getVideoPageData(videoId: string): Promise<VideoPageData> {
    const response = await fetch("https://www.youtube.com/watch?v=" + videoId);
    if (!response.ok) {
        throw new Error("Failed to fetch video page");
    }
    const html = await response.text();

    return getVideoPageDataFromHtml(html);
}

async function getVideoPageDataFromHtml(html: string): Promise<VideoPageData> {
    const transcriptResult = getTranscriptItemsFromHtml(html);
    const transcriptItems = transcriptResult?.items ?? null;
    if (transcriptResult) {
        html = html.substring(transcriptResult.endIndex);
    }

    const descriptionResult = getDescriptionFromText(html);
    const description = descriptionResult?.description ?? null;
    if (descriptionResult) {
        html = html.substring(descriptionResult.endIndex);
    }

    const chaptersResult = extractChaptersFromVideoHtml(html);
    const chapters = chaptersResult?.chapters ?? null;

    return {
        transcriptItems,
        description,
        chapters,
    };
}

function getTextBetweenMarkers(
    text: string,
    startMarker: string,
    endMarker: string
): {
    text: string;
    endIndex: number;
} | null {
    const startMarkerIndex = text.indexOf(startMarker);
    if (startMarkerIndex === -1) {
        console.debug("No start marker found");
        return null;
    }

    const startIndex = startMarkerIndex + startMarker.length;
    const endIndex = text.indexOf(endMarker, startIndex);
    if (endIndex === -1) {
        console.debug("No end marker found");
        return null;
    }

    return {
        text: text.substring(startIndex, endIndex),
        endIndex, // to be used for the next marker
    };
}

function getDescriptionFromText(text: string): {
    description: string;
    endIndex: number;
} | null {
    const START_MARKER = ',"description":{"simpleText":"';
    const END_MARKER = '"},"lengthSeconds":"';

    const result = getTextBetweenMarkers(text, START_MARKER, END_MARKER);
    if (!result) return null;

    const description = result.text.replace(/\\n/g, "\n");
    return {
        description,
        endIndex: result.endIndex,
    };
}

function getTranscriptItemsFromHtml(videoPageHtml: string): {
    items: Transcript[];
    endIndex: number;
} | null {
    const CAPTIONS_START_MARKER = '"captions":';
    const CAPTIONS_END_MARKER = ',"videoDetails';

    const result = getTextBetweenMarkers(videoPageHtml, CAPTIONS_START_MARKER, CAPTIONS_END_MARKER);
    if (!result) return null;

    const jsonString = result.text.replace("\n", "");
    const captionsJson = JSON.parse(jsonString) as YouTubeCaptionsResponse;
    const captionTracks = captionsJson.playerCaptionsTracklistRenderer.captionTracks;

    const items = captionTracks.map(track => ({
        language: {
            code: track.languageCode,
            name: track.name.simpleText,
        },
        link: track.baseUrl,
    }));

    return {
        items,
        endIndex: result.endIndex,
    };
}

function extractChaptersFromVideoHtml(htmlContent: string): {
    chapters: Chapter[];
    endIndex: number;
} | null {
    const START_MARKER = '"chapters":';
    const END_MARKER = ',"trackingParams":';

    const result = getTextBetweenMarkers(htmlContent, START_MARKER, END_MARKER);
    if (!result) return null;

    try {
        // Parse the chapters array
        const chaptersJson = JSON.parse(result.text);

        const chapters = chaptersJson.map((chapter: YouTubeChapter) => ({
            title: chapter.chapterRenderer.title.simpleText,
            startTime: chapter.chapterRenderer.timeRangeStartMillis / 1000,
        }));

        return {
            chapters,
            endIndex: result.endIndex,
        };
    } catch (error) {
        console.error("Error parsing chapters:", error, result.text);
        return null;
    }
}
