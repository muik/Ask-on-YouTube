/**
 * Get transcript paragraphised
 * @param {string} link transcript link
 * @param {float} intervalTimeSec interval time in seconds between paragraphs
 * @returns {Promise<string>} paragraphised transcript
 */
export async function getTranscriptParagraphised(link, intervalTimeSec = 1.5) {
    const items = await getRawTranscript(link);
    const paragraphs = [];
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
 * @returns {Promise<Array>} transcripts
 */
async function getRawTranscript(link) {
    // Get Transcript
    const transcriptPageResponse = await fetch(link);
    if (!transcriptPageResponse.ok) {
        throw new Error(`Failed to fetch transcript: ${transcriptPageResponse.status}`);
    }
    
    const transcriptPageXml = await transcriptPageResponse.text();
    if (!transcriptPageXml.includes('<transcript>')) {
        throw new Error('Invalid transcript format');
    }

    // Parse transcript using regex
    const textRegex = /<text start="([^"]+)" dur="([^"]+)">([^<]+)<\/text>/g;
    const items = [];
    let match;

    while ((match = textRegex.exec(transcriptPageXml)) !== null) {
        items.push({
            start: match[1],
            duration: match[2],
            text: match[3]
        });
    }

    return items;
}
