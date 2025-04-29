import { Chapter } from "./promptData/types";

interface TranscriptItem {
    start: number; // in seconds like 0.1
    duration: number; // in seconds like 1.5
    text: string;
}

export class TranscriptError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "TranscriptError";
    }
}

export class InvalidTranscriptFormatError extends TranscriptError {
    constructor() {
        super("Invalid transcript format");
        this.name = "InvalidTranscriptFormatError";
    }
}

export class TranscriptFetchError extends TranscriptError {
    constructor(status: number) {
        super(`Failed to fetch transcript: ${status}`);
        this.name = "TranscriptFetchError";
    }
}

/**
 * Get transcript paragraphised
 * @param {string} link transcript link
 * @param {number} intervalTimeSec interval time in seconds between paragraphs
 * @returns {Promise<string>} paragraphised transcript
 */
export async function getTranscriptParagraphised(
    link: string,
    chapters: Chapter[] | null,
    intervalTimeSec: number = 1.5
): Promise<string> {
    const items = await getRawTranscript(link);

    // group items by chapter
    const groups = groupItemsByChapter(items, chapters);

    const lines = groups.map(group => {
        const chapter = group.chapter;
        const text = getParagraphisedTranscript(group.items, intervalTimeSec);
        if (!chapter) {
            return text;
        }

        const timeText = getTimeText(chapter.startTime);
        return `\n## ${chapter.title} [${timeText}~]\n${text}`;
    });

    return lines.join("\n").trim();
}

// 1.21 -> "0:01"
// 61.3 -> "1:01"
// 3661.74 -> "1:01:01"
function getTimeText(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

interface ChapterGroup {
    chapter?: Chapter;
    items: TranscriptItem[];
}

function groupItemsByChapter(items: TranscriptItem[], chapters: Chapter[] | null): ChapterGroup[] {
    if (!chapters) {
        return [{ items }];
    }

    const groups: ChapterGroup[] = [];
    let currentChapterIndex = 0;
    let currentChapterStartTime = chapters[currentChapterIndex].startTime;
    let currentGroupItems: TranscriptItem[] | null = null;

    items.forEach(item => {
        if (item.start >= currentChapterStartTime) {
            currentGroupItems = [item];
            groups.push({
                chapter: chapters[currentChapterIndex],
                items: currentGroupItems,
            });

            currentChapterStartTime =
                chapters[++currentChapterIndex]?.startTime ?? Number.MAX_SAFE_INTEGER;
        } else {
            // before the first chapter
            if (!currentGroupItems) {
                currentGroupItems = [item];
                groups.push({ items: currentGroupItems });
            } else {
                currentGroupItems.push(item);
            }
        }
    });

    console.log(groups, chapters, items);

    return groups;
}

function getParagraphisedTranscript(items: TranscriptItem[], intervalTimeSec: number): string {
    const paragraphs: string[] = [];
    let endTime = -intervalTimeSec;
    let paragraphIndex = -1;

    items.forEach(item => {
        const startTime = item.start;
        const text = item.text
            .replace(/[\s\u00A0]+/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&#39;/g, "'")
            .trim();
        if (startTime - endTime >= intervalTimeSec) {
            paragraphs.push(text);
            paragraphIndex += 1;
        } else {
            paragraphs[paragraphIndex] += " " + text;
        }
        endTime = startTime + item.duration;
    });

    return paragraphs.join("\n");
}

/**
 * Get raw transcript
 * @param {string} link transcript link
 * @returns {Promise<TranscriptItem[]>} transcripts
 * @throws {TranscriptFetchError} when transcript fetch fails
 * @throws {InvalidTranscriptFormatError} when transcript format is invalid
 */
async function getRawTranscript(link: string): Promise<TranscriptItem[]> {
    const transcriptPageResponse = await fetch(link);
    if (!transcriptPageResponse) {
        throw new Error("Transcript fetch failed with link: " + link);
    }
    if (!transcriptPageResponse.ok) {
        throw new TranscriptFetchError(transcriptPageResponse.status);
    }

    const transcriptPageXml = await transcriptPageResponse.text();
    if (!transcriptPageXml.includes("<transcript>")) {
        throw new InvalidTranscriptFormatError();
    }

    const textRegex = /<text start="([^"]+)" dur="([^"]+)">([^<]+)<\/text>/g;
    const items: TranscriptItem[] = [];
    let match: RegExpExecArray | null;

    while ((match = textRegex.exec(transcriptPageXml)) !== null) {
        if (match.length === 4) {
            // Ensure we have all capture groups
            items.push({
                start: parseFloat(match[1]),
                duration: parseFloat(match[2]),
                text: match[3],
            });
        }
    }

    return items;
}
