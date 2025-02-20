import { jest } from "@jest/globals";
import { getTranscriptParagraphised } from "../../src/background/transcript";

// Mock the fetch function globally for all tests in this file
global.fetch = jest.fn();

describe("getTranscriptParagraphised", () => {
    beforeEach(() => {
        fetch.mockClear(); // Clear mock calls before each test
    });

    it("should return an empty string for an empty transcript", async () => {
        fetch.mockResolvedValueOnce({
            text: async () => `
                <?xml version="1.0" encoding="utf-8" ?>
                <transcript>
                </transcript>
            `,
        });

        const result = await getTranscriptParagraphised("test-link");
        expect(result).toBe("");
    });

    it("should paragraphise a simple transcript", async () => {
        fetch.mockResolvedValueOnce({
            text: async () => `
                <?xml version="1.0" encoding="utf-8" ?>
                <transcript>
                    <text start="0.0" dur="1.0">Hello</text>
                    <text start="1.0" dur="1.0">world</text>
                </transcript>
            `,
        });

        const result = await getTranscriptParagraphised("test-link");
        expect(result).toBe("Hello world");
    });

    it("should create new paragraphs based on intervalTimeSec", async () => {
        fetch.mockResolvedValueOnce({
            text: async () => `
                <?xml version="1.0" encoding="utf-8" ?>
                <transcript>
                    <text start="0.0" dur="1.0">First</text>
                    <text start="1.0" dur="0.4">sentence</text>
                    <text start="3.0" dur="1.0">Second</text>
                    <text start="4.0" dur="0.5">sentence</text>
                </transcript>
            `,
        });

        const result = await getTranscriptParagraphised("test-link", 1);
        expect(result).toBe("First sentence\nSecond sentence");
    });

    it("should handle special characters and extra spaces", async () => {
        fetch.mockResolvedValueOnce({
            text: async () => `
                <?xml version="1.0" encoding="utf-8" ?>
                <transcript>
                    <text start="0.0" dur="1.0">  Hello&#39;s  </text>
                    <text start="1.0" dur="1.0">  world   </text>
                </transcript>
            `,
        });

        const result = await getTranscriptParagraphised("test-link");
        expect(result).toBe("Hello's world");
    });
});
