export interface TranscriptItem {
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

interface VideoPageData {
    transcriptItems: TranscriptItem[] | null;
    description: string | null;
}

/**
 * Get page prompt data from a video page
 * @param videoId - The ID of the video to get page prompt data from
 * @returns The page prompt data from the video page
 */
export async function getVideoPageData(videoId: string): Promise<VideoPageData> {
    const response = await fetch("https://www.youtube.com/watch?v=" + videoId);
    const html = await response.text();
    const { items, endIndex } = getTranscriptItemsFromHtml(html);
    const description = getDescriptionFromText(html.substring(endIndex));

    return {
        transcriptItems: items,
        description,
    };
}

function getDescriptionFromText(text: string): string | null {
    const START_MARKER = ',"description":{"simpleText":"';
    const END_MARKER = '"},"lengthSeconds":"';

    const descriptionIndex = text.indexOf(START_MARKER);
    if (descriptionIndex === -1) {
        console.debug("No start marker of description found");
        return null;
    }

    const startIndex = descriptionIndex + START_MARKER.length;
    const endIndex = text.indexOf(END_MARKER, startIndex);

    if (endIndex === -1) {
        console.debug("No end marker of description found");
        return null;
    }

    const description = text.slice(startIndex, endIndex);
    return description.replace(/\\n/g, "\n");
}

function getTranscriptItemsFromHtml(videoPageHtml: string): {
    items: TranscriptItem[] | null;
    endIndex: number;
} {
    const CAPTIONS_START_MARKER = '"captions":';
    const CAPTIONS_END_MARKER = ',"videoDetails';
    const captionsIndex = videoPageHtml.indexOf(CAPTIONS_START_MARKER);

    if (captionsIndex === -1) {
        return {
            items: null,
            endIndex: -1,
        };
    } // No Caption Available

    const startIndex = captionsIndex + CAPTIONS_START_MARKER.length;
    const captionsEndIndex = videoPageHtml.indexOf(CAPTIONS_END_MARKER, startIndex);
    const captionsJsonString = videoPageHtml.slice(startIndex, captionsEndIndex).replace("\n", "");
    const captionsJson = JSON.parse(captionsJsonString) as YouTubeCaptionsResponse;
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
        endIndex: captionsEndIndex,
    };
}
