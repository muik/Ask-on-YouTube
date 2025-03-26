import { DOMParser } from "linkedom";

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
        const text = item.text
            .replace(/[\s\u00A0]+/g, " ")
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
    const transcriptPageResponse = await fetch(link); // Fetch the transcript data
    const transcriptPageXml = await transcriptPageResponse.text();

    // Parse Transcript using linkedom's DOMParser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(transcriptPageXml, "text/xml");

    // Extract text nodes (assuming <text> elements in the XML)
    const textNodes = xmlDoc.getElementsByTagName("text");

    // Map the nodes into an array of objects
    return Array.from(textNodes).map(node => {
        return {
            start: node.getAttribute("start"),
            duration: node.getAttribute("dur"),
            text: node.textContent,
        };
    });
}
