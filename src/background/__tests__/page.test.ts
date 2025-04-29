import { getVideoPageData } from "../promptData/page";

// Mock fetch globally
global.fetch = jest.fn();

describe("page.ts", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getVideoPageData", () => {
        const mockVideoId = "test123";
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
            },"videoDetails":{
                "test": "test"
            },"description":{"simpleText":"Test video description"},"lengthSeconds":"120","chapters":[
                {
                    "chapterRenderer":{
                        "title":{"simpleText":"Chapter 1"},
                        "timeRangeStartMillis":0
                    }
                },
                {
                    "chapterRenderer":{
                        "title":{"simpleText":"Chapter 2"},
                        "timeRangeStartMillis":60000
                    }
                }
            ],"trackingParams":"abc123"
        `;

        it("should extract transcript items, description, and chapters from video page", async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(mockHtml),
            });

            const result = await getVideoPageData(mockVideoId);

            expect(result).toEqual({
                transcriptItems: [
                    {
                        language: {
                            code: "en",
                            name: "English",
                        },
                        link: "https://example.com/en",
                    },
                    {
                        language: {
                            code: "es",
                            name: "Spanish",
                        },
                        link: "https://example.com/es",
                    },
                ],
                description: "Test video description",
                chapters: [
                    {
                        title: "Chapter 1",
                        startTime: 0,
                    },
                    {
                        title: "Chapter 2",
                        startTime: 60000,
                    },
                ],
            });
        });

        it("should handle missing transcript items", async () => {
            const htmlWithoutTranscript = mockHtml.replace('"captions":', '"nocaptions":');
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(htmlWithoutTranscript),
            });

            const result = await getVideoPageData(mockVideoId);

            expect(result.transcriptItems).toBeNull();
            expect(result.description).toBe("Test video description");
            expect(result.chapters?.length).toBe(2);
        });

        it("should handle missing description", async () => {
            const htmlWithoutDescription = mockHtml.replace(',"description":', ',"nodescription":');
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(htmlWithoutDescription),
            });

            const result = await getVideoPageData(mockVideoId);

            expect(result.transcriptItems?.length).toBe(2);
            expect(result.description).toBeNull();
            expect(result.chapters?.length).toBe(2);
        });

        it("should handle missing chapters", async () => {
            const htmlWithoutChapters = mockHtml.replace(',"chapters":', ',"nochapters":');
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(htmlWithoutChapters),
            });

            const result = await getVideoPageData(mockVideoId);

            expect(result.transcriptItems?.length).toBe(2);
            expect(result.description).toBe("Test video description");
            expect(result.chapters).toBeNull();
        });

        it("should handle fetch error", async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

            await expect(getVideoPageData(mockVideoId)).rejects.toThrow("Network error");
        });

        it("should handle non-200 response", async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 404,
                text: () => Promise.resolve("Not Found"),
            });

            await expect(getVideoPageData(mockVideoId)).rejects.toThrow();
        });
    });
});
