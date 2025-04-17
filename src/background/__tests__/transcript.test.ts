import { getTranscriptParagraphised, InvalidTranscriptFormatError, TranscriptFetchError } from '../transcript';

// Mock fetch globally
global.fetch = jest.fn();

describe('transcript.ts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getTranscriptParagraphised', () => {
        const mockTranscriptXml = `
            <transcript>
                <text start="0.0" dur="1.5">Hello world</text>
                <text start="2.0" dur="1.0">This is a test</text>
                <text start="3.5" dur="1.5">of the transcript</text>
                <text start="5.5" dur="1.0">paragraph system</text>
            </transcript>
        `;

        it('should paragraphise transcript with default interval', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(mockTranscriptXml)
            });

            const result = await getTranscriptParagraphised('https://example.com/transcript');
            
            expect(result).toBe(
                'Hello world This is a test of the transcript paragraph system'
            );
        });

        it('should paragraphise transcript with custom interval', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(mockTranscriptXml)
            });

            const result = await getTranscriptParagraphised('https://example.com/transcript', 3.0);
            
            expect(result).toBe(
                'Hello world This is a test of the transcript paragraph system'
            );
        });

        it('should clean text by removing extra spaces and HTML entities', async () => {
            const dirtyTranscriptXml = `
                <transcript>
                    <text start="0.0" dur="1.5">Hello  &amp;  world</text>
                    <text start="2.0" dur="1.0">This is &#39;test&#39;</text>
                </transcript>
            `;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(dirtyTranscriptXml)
            });

            const result = await getTranscriptParagraphised('https://example.com/transcript');
            
            expect(result).toBe('Hello & world This is \'test\'');
        });
    });

    describe('getRawTranscript', () => {
        it('should throw TranscriptFetchError when fetch fails', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 404
            });

            await expect(getTranscriptParagraphised('https://example.com/transcript'))
                .rejects
                .toThrow(TranscriptFetchError);
        });

        it('should throw InvalidTranscriptFormatError when transcript format is invalid', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve('Invalid XML format')
            });

            await expect(getTranscriptParagraphised('https://example.com/transcript'))
                .rejects
                .toThrow(InvalidTranscriptFormatError);
        });

        it('should throw error when transcript fetch fails', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            await expect(getTranscriptParagraphised('https://example.com/transcript'))
                .rejects
                .toThrow('Network error');
        });
    });
}); 