import { getTranscriptParagraphised, InvalidTranscriptFormatError, TranscriptFetchError } from '../transcript';
import { Chapter } from '../promptData/types';

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

        const mockTranscriptXmlOverHour = `
            <transcript>
                <text start="3600.0" dur="1.5">Hello world</text>
                <text start="3660.0" dur="1.0">This is a test</text>
                <text start="3670.0" dur="1.5">of the transcript</text>
                <text start="3680.0" dur="1.0">paragraph system</text>
            </transcript>
        `;

        it('should paragraphise transcript with default interval', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(mockTranscriptXml)
            });

            const result = await getTranscriptParagraphised('https://example.com/transcript', null);
            
            expect(result).toBe(
                'Hello world This is a test of the transcript paragraph system'
            );
        });

        it('should paragraphise transcript with custom interval', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(mockTranscriptXml)
            });

            const result = await getTranscriptParagraphised('https://example.com/transcript', null, 3.0);
            
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

            const result = await getTranscriptParagraphised('https://example.com/transcript', null);
            
            expect(result).toBe('Hello & world This is \'test\'');
        });

        it('should paragraphise transcript with chapters', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(mockTranscriptXml)
            });

            const chapters: Chapter[] = [
                { title: 'Introduction', startTime: 0 },
                { title: 'Main Content', startTime: 2.5 }
            ];

            const result = await getTranscriptParagraphised('https://example.com/transcript', chapters);
            
            expect(result).toBe(
                '## Introduction [0:00~]\nHello world This is a test\n\n## Main Content [0:02~]\nof the transcript paragraph system'
            );
        });

        it('should paragraphise transcript with chapters starting after 0', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(mockTranscriptXml)
            });

            const chapters: Chapter[] = [
                { title: 'First Chapter', startTime: 2.5 },
                { title: 'Second Chapter', startTime: 4.0 }
            ];

            const result = await getTranscriptParagraphised('https://example.com/transcript', chapters);
            
            expect(result).toBe(
                'Hello world This is a test\n\n## First Chapter [0:02~]\nof the transcript\n\n## Second Chapter [0:04~]\nparagraph system'
            );
        });

        it('should paragraphise transcript with chapters over an hour', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(mockTranscriptXmlOverHour)
            });

            const chapters: Chapter[] = [
                { title: 'First Hour', startTime: 3600 },
                { title: 'After First Hour', startTime: 3660 }
            ];

            const result = await getTranscriptParagraphised('https://example.com/transcript', chapters);
            
            expect(result).toBe(
                '## First Hour [1:00:00~]\nHello world\n\n## After First Hour [1:01:00~]\nThis is a test\nof the transcript\nparagraph system'
            );
        });
    });

    describe('getRawTranscript', () => {
        it('should throw TranscriptFetchError when fetch fails', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 404
            });

            await expect(getTranscriptParagraphised('https://example.com/transcript', null))
                .rejects
                .toThrow(TranscriptFetchError);
        });

        it('should throw InvalidTranscriptFormatError when transcript format is invalid', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve('Invalid XML format')
            });

            await expect(getTranscriptParagraphised('https://example.com/transcript', null))
                .rejects
                .toThrow(InvalidTranscriptFormatError);
        });

        it('should throw error when transcript fetch fails', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            await expect(getTranscriptParagraphised('https://example.com/transcript', null))
                .rejects
                .toThrow('Network error');
        });
    });
}); 