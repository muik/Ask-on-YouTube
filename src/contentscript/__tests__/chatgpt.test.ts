/**
 * @jest-environment jsdom
 */

import { mockChrome } from "../../background/__mocks__/chrome";
import { BackgroundActions, Targets } from "../../constants";
import { PromptResponse } from "../../types/chatgpt";
import { mockConfig } from "../__mocks__/config";
import { mockHandlePromptResponse } from "../__mocks__/prompt";

// Import the mocks
jest.mock("../../background/__mocks__/setup");

// Mock the utils module
jest.mock("../utils.js", () => ({
    waitForElm: jest.fn(),
}));

// Mock the prompt module
jest.mock("../chatgpt/prompt", () => ({
    handlePromptResponse: mockHandlePromptResponse,
}));

// Mock the chatgpt module
jest.mock("../chatgpt", () => ({
    isChatGPTExtensionPage: jest.fn(),
    getPromptFromBackground: jest.fn(),
    initializeChatGPT: jest.fn(),
}));

describe("ChatGPT Content Script", () => {
    let originalLocation: Location;

    beforeEach(() => {
        // Store original location
        originalLocation = window.location;
        // Reset all mocks
        jest.clearAllMocks();
        // Setup waitForElm mock
        const mockElm = document.createElement("div");
        require("../utils.js").waitForElm.mockResolvedValue(mockElm);
    });

    afterEach(() => {
        // Restore original location
        Object.defineProperty(window, "location", {
            value: originalLocation,
            writable: true,
        });
    });

    describe("isChatGPTExtensionPage", () => {
        it("should return true for valid ChatGPT extension page", () => {
            Object.defineProperty(window, "location", {
                value: {
                    hostname: "chatgpt.com",
                    search: `?ref=${mockConfig.REF_CODE}`,
                },
                writable: true,
            });

            const { isChatGPTExtensionPage } = jest.requireActual("../chatgpt");
            const result = isChatGPTExtensionPage();
            expect(result).toBe(true);
        });

        it("should return false for different hostname", () => {
            Object.defineProperty(window, "location", {
                value: {
                    hostname: "example.com",
                    search: `?ref=${mockConfig.REF_CODE}`,
                },
                writable: true,
            });

            const { isChatGPTExtensionPage } = jest.requireActual("../chatgpt");
            const result = isChatGPTExtensionPage();
            expect(result).toBe(false);
        });

        it("should return false for different ref code", () => {
            Object.defineProperty(window, "location", {
                value: {
                    hostname: "chatgpt.com",
                    search: "?ref=invalid",
                },
                writable: true,
            });

            const { isChatGPTExtensionPage } = jest.requireActual("../chatgpt");
            const result = isChatGPTExtensionPage();
            expect(result).toBe(false);
        });
    });

    describe("getPromptFromBackground", () => {
        it("should send correct message to background script", async () => {
            const mockResponse: PromptResponse = {
                promptData: {
                    videoInfo: {
                        id: "test-video-id",
                        title: "Test Video",
                    },
                    transcript: "Test transcript",
                    question: "Test question",
                    langCode: "en",
                },
            };
            mockChrome.runtime.sendMessage.mockResolvedValue(mockResponse);

            const { getPromptFromBackground } = jest.requireActual("../chatgpt");
            const result = await getPromptFromBackground();

            expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
                action: BackgroundActions.GET_PROMPT,
                target: Targets.CHATGPT,
            });
            expect(result).toEqual(mockResponse);
        });
    });

    describe("initializeChatGPT", () => {
        it("should not initialize if not on ChatGPT extension page", async () => {
            Object.defineProperty(window, "location", {
                value: {
                    hostname: "example.com",
                    search: "",
                },
                writable: true,
            });

            const { initializeChatGPT } = jest.requireActual("../chatgpt");
            await initializeChatGPT();

            expect(mockHandlePromptResponse).not.toHaveBeenCalled();
        });

        it("should handle prompt response on valid page", async () => {
            Object.defineProperty(window, "location", {
                value: {
                    hostname: "chatgpt.com",
                    search: `?ref=${mockConfig.REF_CODE}`,
                },
                writable: true,
            });

            const mockResponse: PromptResponse = {
                promptData: {
                    videoInfo: {
                        id: "test-video-id",
                        title: "Test Video",
                    },
                    transcript: "Test transcript",
                    question: "Test question",
                    langCode: "en",
                },
            };
            mockChrome.runtime.sendMessage.mockResolvedValue(mockResponse);

            const { initializeChatGPT } = jest.requireActual("../chatgpt");
            await initializeChatGPT();

            expect(mockHandlePromptResponse).toHaveBeenCalledWith(mockResponse);
        });

        it("should handle errors gracefully", async () => {
            Object.defineProperty(window, "location", {
                value: {
                    hostname: "chatgpt.com",
                    search: `?ref=${mockConfig.REF_CODE}`,
                },
                writable: true,
            });

            mockChrome.runtime.sendMessage.mockRejectedValue(new Error("Test error"));

            const consoleSpy = jest.spyOn(console, "error").mockImplementation();

            const { initializeChatGPT } = jest.requireActual("../chatgpt");
            await initializeChatGPT();

            expect(consoleSpy).toHaveBeenCalledWith("Error getting prompt", expect.any(Error));
            consoleSpy.mockRestore();
        });
    });
});
