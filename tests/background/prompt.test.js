import { jest } from '@jest/globals';
import { loadTranscript } from '../../src/background/prompt.js';

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

jest.mock('xmldom', () => ({
    DOMParser: jest.fn(() => ({
        parseFromString: jest.fn(() => ({
            getElementsByTagName: jest.fn(() => ({
                length: mockTextNodes.length,
                item: (i) => mockTextNodes[i],
                [Symbol.iterator]: function* () { yield* mockTextNodes; }
            }))
        }))
    }))
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

describe('loadTranscript', () => {
    beforeEach(() => {
        fetch.mockClear();
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

        // Mock fetch responses
        fetch
            .mockResolvedValueOnce({
                text: () => Promise.resolve(mockVideoPageHtml)
            })
            .mockResolvedValueOnce({
                text: () => Promise.resolve('<?xml version="1.0" encoding="utf-8" ?><transcript><text start="0" dur="1">Test text</text></transcript>')
            });

        const result = await loadTranscript('test-video-id');
        expect(result).toBe('Test text');
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(fetch.mock.calls[0][0]).toBe('https://www.youtube.com/watch?v=test-video-id');
        expect(fetch.mock.calls[1][0]).toBe('https://example.com/transcript/en');
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

        // Mock fetch responses
        fetch
            .mockResolvedValueOnce({
                text: () => Promise.resolve(mockVideoPageHtml)
            })
            .mockResolvedValueOnce({
                text: () => Promise.resolve('<?xml version="1.0" encoding="utf-8" ?><transcript><text start="0" dur="1">Texto de prueba</text></transcript>')
            });

        // Update mock text nodes for Spanish
        mockTextNodes[0].textContent = 'Texto de prueba';

        const result = await loadTranscript('test-video-id', 'es');
        expect(result).toBe('Texto de prueba');
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(fetch.mock.calls[1][0]).toBe('https://example.com/transcript/es');

        // Reset mock text nodes
        mockTextNodes[0].textContent = 'Test text';
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

        // Mock fetch responses
        fetch
            .mockResolvedValueOnce({
                text: () => Promise.resolve(mockVideoPageHtml)
            })
            .mockResolvedValueOnce({
                text: () => Promise.resolve('<?xml version="1.0" encoding="utf-8" ?><transcript><text start="0" dur="1">Test text</text></transcript>')
            });

        const result = await loadTranscript('test-video-id', 'fr');
        expect(result).toBe('Test text');
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(fetch.mock.calls[1][0]).toBe('https://example.com/transcript/en');
    });
}); 