import { mockGetURL, mockOnInstalledCallback } from "../mock";

import { getMessage, getMessages } from "../messages";

describe("Messages Module", () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        (global.fetch as jest.Mock).mockClear();
        mockGetURL.mockClear();

        // Trigger cache clear through onInstalled event
        mockOnInstalledCallback();
    });

    describe("getMessage", () => {
        it("should return message in requested language", async () => {
            // Mock URL and fetch response
            mockGetURL.mockReturnValue("/_locales/en/messages.json");
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () =>
                    Promise.resolve({
                        hello: { message: "Hello" },
                    }),
            });

            const message = await getMessage("hello", { lang: "en" });
            expect(message).toBe("Hello");
            expect(mockGetURL).toHaveBeenCalledWith(
                "_locales/en/messages.json"
            );
        });

        it("should fall back to default language if message not found", async () => {
            // Mock URL and fetch responses for both languages
            mockGetURL
                .mockReturnValueOnce("/_locales/fr/messages.json")
                .mockReturnValueOnce("/_locales/en/messages.json");

            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({}), // Empty response for French
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: () =>
                        Promise.resolve({
                            hello: { message: "Hello" },
                        }),
                });

            const message = await getMessage("hello", { lang: "fr" });
            expect(message).toBe("Hello");
        });

        it("should return message name if not found in any language", async () => {
            // Mock URL and fetch responses for both languages
            mockGetURL
                .mockReturnValueOnce("/_locales/fr/messages.json")
                .mockReturnValueOnce("/_locales/en/messages.json");

            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({}),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({}),
                });

            const message = await getMessage("nonexistent", { lang: "fr" });
            expect(message).toBe("nonexistent");
        });
    });

    describe("getMessages", () => {
        it("should return multiple messages in requested language", async () => {
            mockGetURL.mockReturnValue("/_locales/en/messages.json");
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () =>
                    Promise.resolve({
                        hello: { message: "Hello" },
                        goodbye: { message: "Goodbye" },
                    }),
            });

            const messages = await getMessages(["hello", "goodbye"], {
                lang: "en",
            });
            expect(messages).toEqual(["Hello", "Goodbye"]);
        });

        it("should handle 404 response gracefully", async () => {
            mockGetURL
                .mockReturnValue("/_locales/xx/messages.json")
                .mockReturnValueOnce("/_locales/en/messages.json");
            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: false,
                    status: 404,
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: () =>
                        Promise.resolve({
                            hello: { message: "Hello" },
                        }),
                });

            const messages = await getMessages(["test"], { lang: "xx" });
            expect(messages).toEqual(["test"]);
        });
    });
}); 