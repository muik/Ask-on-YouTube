import { LRUCache } from "../lruCache.js";
import { loadTranscriptLink } from "../prompt.js";
import { getTranscriptParagraphised } from "../transcript.js";
import { getVideoPageData } from "./page.js";

interface VideoPagePromptData {
    transcript: string | null;
    description: string | null;
}

const dataCache = new LRUCache(10);

export async function getVideoPagePromptDataCached(
    videoId: string,
    langCode: string = "en",
    includeTranscript: boolean
): Promise<VideoPagePromptData> {
    const cacheKey = `${videoId}-${langCode}-${includeTranscript ? 1 : 0}`;
    if (dataCache.has(cacheKey)) {
        const data = dataCache.get(cacheKey);
        console.debug(`Using cached transcript for video ID: ${videoId} and langCode: ${langCode}`);
        return data;
    }

    const { transcriptItems, description, chapters } = await getVideoPageData(videoId);
    const data: VideoPagePromptData = {
        transcript: null,
        description: description,
    };

    if (!includeTranscript || !transcriptItems) {
        return data;
    }

    const link = await loadTranscriptLink(transcriptItems, langCode);
    data.transcript = await getTranscriptParagraphised(link, chapters);

    dataCache.put(cacheKey, data);
    console.debug(`Cached transcript for video ID: ${videoId} and langCode: ${langCode}`);

    return data;
}
