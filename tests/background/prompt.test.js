import { jest } from '@jest/globals';

// Mock xmldom
const mockTextNodes = [
    {
        getAttribute: (attr) => {
            switch (attr) {
                case 'start': return '0';
                case 'dur': return '1';
                default: return '';
            }
        },
        textContent: 'Test text'
    }
];

// Mock the transcript module
const mockGetTranscriptParagraphised = jest.fn();
jest.unstable_mockModule('../../src/background/transcript.js', () => ({
    getTranscriptParagraphised: mockGetTranscriptParagraphised
}));

// Mock xmldom
jest.unstable_mockModule('xmldom', () => ({
    DOMParser: class {
        parseFromString() {
            return {
                getElementsByTagName: () => ({
                    length: mockTextNodes.length,
                    item: (i) => mockTextNodes[i],
                    [Symbol.iterator]: function* () { yield* mockTextNodes; }
                })
            };
        }
    }
}));

// Mock Array.from for the mock text nodes
const originalArrayFrom = Array.from;
Array.from = function(arrayLike) {
    if (arrayLike && arrayLike[Symbol.iterator]) {
        return [...arrayLike];
    }
    return originalArrayFrom(arrayLike);
};

// Mock the fetch function globally for all tests in this file
global.fetch = jest.fn();

// Import the functions we want to test
const { loadTranscript } = await import('../../src/background/prompt.js');

describe('loadTranscript', () => {
    beforeEach(() => {
        fetch.mockClear();
        mockGetTranscriptParagraphised.mockClear();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should load transcript successfully with default language (en)', async () => {
        // Mock the video page HTML response
        const mockVideoPageHtml = `
            "captions":{
                "playerCaptionsTracklistRenderer":{
                    "captionTracks":[
                        {
                            "baseUrl":"https://example.com/transcript/en",
                            "name":{"simpleText":"English"},
                            "languageCode":"en"
                        },
                        {
                            "baseUrl":"https://example.com/transcript/es",
                            "name":{"simpleText":"Spanish"},
                            "languageCode":"es"
                        }
                    ]
                }
            },"videoDetails"
        `;

        // Mock fetch and transcript responses
        fetch.mockResolvedValueOnce({
            text: () => Promise.resolve(mockVideoPageHtml)
        });
        mockGetTranscriptParagraphised.mockResolvedValueOnce('Test text');

        const result = await loadTranscript('test-video-id');
        expect(result).toBe('Test text');
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch.mock.calls[0][0]).toBe('https://www.youtube.com/watch?v=test-video-id');
        expect(mockGetTranscriptParagraphised).toHaveBeenCalledWith('https://example.com/transcript/en');
    });

    it('should load transcript with specified language code', async () => {
        // Mock the video page HTML response
        const mockVideoPageHtml = `
            "captions":{
                "playerCaptionsTracklistRenderer":{
                    "captionTracks":[
                        {
                            "baseUrl":"https://example.com/transcript/en",
                            "name":{"simpleText":"English"},
                            "languageCode":"en"
                        },
                        {
                            "baseUrl":"https://example.com/transcript/es",
                            "name":{"simpleText":"Spanish"},
                            "languageCode":"es"
                        }
                    ]
                }
            },"videoDetails"
        `;

        // Mock fetch and transcript responses
        fetch.mockResolvedValueOnce({
            text: () => Promise.resolve(mockVideoPageHtml)
        });
        mockGetTranscriptParagraphised.mockResolvedValueOnce('Texto de prueba');

        const result = await loadTranscript('test-video-id', 'es');
        expect(result).toBe('Texto de prueba');
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(mockGetTranscriptParagraphised).toHaveBeenCalledWith('https://example.com/transcript/es');
    });

    it('should return undefined when no captions are available', async () => {
        // Mock video page HTML without captions
        const mockVideoPageHtml = `<html><body>No captions here</body></html>`;

        // Mock fetch response for video page
        fetch.mockResolvedValueOnce({
            text: () => Promise.resolve(mockVideoPageHtml)
        });

        const result = await loadTranscript('test-video-id');
        expect(result).toBeUndefined();
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(mockGetTranscriptParagraphised).not.toHaveBeenCalled();
    });

    it('should fallback to first available language if requested language is not available', async () => {
        // Mock the video page HTML response
        const mockVideoPageHtml = `
            "captions":{
                "playerCaptionsTracklistRenderer":{
                    "captionTracks":[
                        {
                            "baseUrl":"https://example.com/transcript/en",
                            "name":{"simpleText":"English"},
                            "languageCode":"en"
                        }
                    ]
                }
            },"videoDetails"
        `;

        // Mock fetch and transcript responses
        fetch.mockResolvedValueOnce({
            text: () => Promise.resolve(mockVideoPageHtml)
        });
        mockGetTranscriptParagraphised.mockResolvedValueOnce('Test text');

        const result = await loadTranscript('test-video-id', 'fr');
        expect(result).toBe('Test text');
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(mockGetTranscriptParagraphised).toHaveBeenCalledWith('https://example.com/transcript/en');
    });
}); 