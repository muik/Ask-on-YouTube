interface TranscriptItem {
    start: string;
    duration: string;
    text: string;
}

export class TranscriptError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TranscriptError';
    }
}

export class InvalidTranscriptFormatError extends TranscriptError {
    constructor() {
        super('Invalid transcript format');
        this.name = 'InvalidTranscriptFormatError';
    }
}

export class TranscriptFetchError extends TranscriptError {
    constructor(status: number) {
        super(`Failed to fetch transcript: ${status}`);
        this.name = 'TranscriptFetchError';
    }
}

/**
 * Get transcript paragraphised
 * @param {string} link transcript link
 * @param {number} intervalTimeSec interval time in seconds between paragraphs
 * @returns {Promise<string>} paragraphised transcript
 */
export async function getTranscriptParagraphised(link: string, intervalTimeSec: number = 1.5): Promise<string> {
    const items = await getRawTranscript(link);
    const paragraphs: string[] = [];
    let endTime = -intervalTimeSec;
    let paragraphIndex = -1;

    items.forEach(item => {
        const startTime = parseFloat(item.start);
        console.log('Raw text from YouTube:', item.text);
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
        endTime = startTime + parseFloat(item.duration);
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
        throw new Error('Transcript fetch failed with link: ' + link);
    }
    if (!transcriptPageResponse.ok) {
        throw new TranscriptFetchError(transcriptPageResponse.status);
    }
    
    const transcriptPageXml = await transcriptPageResponse.text();
    if (!transcriptPageXml.includes('<transcript>')) {
        throw new InvalidTranscriptFormatError();
    }

    const textRegex = /<text start="([^"]+)" dur="([^"]+)">([^<]+)<\/text>/g;
    const items: TranscriptItem[] = [];
    let match: RegExpExecArray | null;

    while ((match = textRegex.exec(transcriptPageXml)) !== null) {
        if (match.length === 4) { // Ensure we have all capture groups
            items.push({
                start: match[1],
                duration: match[2],
                text: match[3]
            });
        }
    }

    return items;
} 