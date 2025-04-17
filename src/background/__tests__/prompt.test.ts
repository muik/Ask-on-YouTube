import { VideoInfo } from '../../types';
import { getGeminiCustomPrompt, getGeminiPrompt, loadTranscriptLink } from '../prompt';

// Mock fetch globally
global.fetch = jest.fn();

describe('prompt.ts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('loadTranscriptLink', () => {
        it('should return transcript link for specified language', async () => {
            const mockVideoId = 'test123';
            const mockHtml = `
                "captions":{
                    "playerCaptionsTracklistRenderer":{
                        "captionTracks":[
                            {
                                "languageCode":"en",
                                "name":{"simpleText":"English"},
                                "baseUrl":"https://example.com/en"
                            },
                            {
                                "languageCode":"es",
                                "name":{"simpleText":"Spanish"},
                                "baseUrl":"https://example.com/es"
                            }
                        ]
                    }
                }
            `;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                text: () => Promise.resolve(mockHtml)
            });

            const result = await loadTranscriptLink(mockVideoId, 'en');
            expect(result).toBe('https://example.com/en');
        });

        it('should return first available transcript if specified language not found', async () => {
            const mockVideoId = 'test123';
            const mockHtml = `
                "captions":{
                    "playerCaptionsTracklistRenderer":{
                        "captionTracks":[
                            {
                                "languageCode":"es",
                                "name":{"simpleText":"Spanish"},
                                "baseUrl":"https://example.com/es"
                            }
                        ]
                    }
                }
            `;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                text: () => Promise.resolve(mockHtml)
            });

            const result = await loadTranscriptLink(mockVideoId, 'en');
            expect(result).toBe('https://example.com/es');
        });

        it('should return undefined if no captions available', async () => {
            const mockVideoId = 'test123';
            const mockHtml = 'no captions here';

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                text: () => Promise.resolve(mockHtml)
            });

            const result = await loadTranscriptLink(mockVideoId);
            expect(result).toBeUndefined();
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