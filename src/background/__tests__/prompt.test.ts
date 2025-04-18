import { VideoInfo } from '../../types';
import { getGeminiCustomPrompt, getGeminiPrompt, loadTranscriptLink } from '../prompt';
import { TranscriptItem } from '../promptData/page';

// Mock fetch globally
global.fetch = jest.fn();

describe('prompt.ts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('loadTranscriptLink', () => {
        it('should return transcript link for specified language', async () => {
            const mockTranscriptItems: TranscriptItem[] = [
                {
                    language: {
                        code: 'en',
                        name: 'English'
                    },
                    link: 'https://example.com/en'
                },
                {
                    language: {
                        code: 'es',
                        name: 'Spanish'
                    },
                    link: 'https://example.com/es'
                }
            ];

            const result = await loadTranscriptLink(mockTranscriptItems, 'en');
            expect(result).toBe('https://example.com/en');
        });

        it('should return first available transcript if specified language not found', async () => {
            const mockTranscriptItems: TranscriptItem[] = [
                {
                    language: {
                        code: 'es',
                        name: 'Spanish'
                    },
                    link: 'https://example.com/es'
                }
            ];

            const result = await loadTranscriptLink(mockTranscriptItems, 'en');
            expect(result).toBe('https://example.com/es');
        });

        it('should throw error if no transcript items provided', async () => {
            await expect(loadTranscriptLink([])).rejects.toThrow('Cannot read properties of undefined (reading \'link\')');
        });
    });

    describe('getGeminiCustomPrompt', () => {
        it('should create a custom prompt with all video info', async () => {
            const videoInfo: VideoInfo = {
                id: 'test123',
                title: 'Test Video',
                caption: 'Test Caption'
            };
            const transcript = 'This is a test transcript';
            const prompt = 'What is this video about?';

            const result = await getGeminiCustomPrompt(videoInfo, transcript, prompt);

            expect(result).toContain('Title: Test Video');
            expect(result).toContain('Caption: `Test Caption`');
            expect(result).toContain('URL: https://www.youtube.com/watch?v=test123');
            expect(result).toContain('Transcript: ```');
            expect(result).toContain('This is a test transcript');
            expect(result).toContain('What is this video about?');
        });

        it('should handle video info without caption', async () => {
            const videoInfo: VideoInfo = {
                id: 'test123',
                title: 'Test Video'
            };
            const transcript = 'This is a test transcript';
            const prompt = 'What is this video about?';

            const result = await getGeminiCustomPrompt(videoInfo, transcript, prompt);

            expect(result).toContain('Title: Test Video');
            expect(result).not.toContain('Caption:');
            expect(result).toContain('URL: https://www.youtube.com/watch?v=test123');
        });
    });

    describe('getGeminiPrompt', () => {
        it('should return video URL when no prompt provided', async () => {
            const videoId = 'test123';
            const result = await getGeminiPrompt(videoId);
            expect(result).toBe('https://www.youtube.com/watch?v=test123');
        });

        it('should combine prompt with video URL', async () => {
            const videoId = 'test123';
            const prompt = 'What is this video about?';
            const result = await getGeminiPrompt(videoId, prompt);
            expect(result).toBe('What is this video about?\nhttps://www.youtube.com/watch?v=test123');
        });
    });
}); 