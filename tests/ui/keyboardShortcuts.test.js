/**
 * @jest-environment jsdom
 */

import { jest } from "@jest/globals";

// Mock all dependencies
jest.unstable_mockModule("../../src/config", () => ({
    default: {
        MAX_QUESTIONS_COUNT: 5,
        MAX_HISTORY_SIZE: 50,
        MAX_HISTORY_SIZE_IN_PROMPT: 10,
        REF_CODE: "ytq",
    },
}));

jest.unstable_mockModule("../../src/constants", () => ({
    BackgroundActions: {},
    QuestionOptionKeys: {
        FAVORITES: "favorites",
        RECENTS: "recents",
        SUGGESTIONS: "suggestions",
    },
}));

jest.unstable_mockModule("../../src/contentscript/youtube/videoDetail.jsx", () => ({
    injectElements: jest.fn(),
}));

// Create mock functions
const mockFindQuestionMenuShown = jest.fn();
const mockFindSimpleQuestionInputShown = jest.fn();
const mockShowQuestionDialog = jest.fn();
const mockGetVideoInfoFromShortsDetail = jest.fn();

// Mock the modules
jest.unstable_mockModule("../../src/contentscript/youtube/moreOptions.ts", () => ({
    findQuestionMenuShown: mockFindQuestionMenuShown,
    detectVideoOptionClick: jest.fn(),
    injectExtraOptions: jest.fn(),
}));

jest.unstable_mockModule("../../src/contentscript/youtube/components/SimpleQuestionForm.tsx", () => ({
    findSimpleQuestionInputShown: mockFindSimpleQuestionInputShown,
}));

jest.unstable_mockModule("../../src/contentscript/youtube/questionView.ts", () => ({
    showQuestionDialog: mockShowQuestionDialog,
    isQuestionDialogOpened: jest.fn().mockReturnValue(false),
}));

jest.unstable_mockModule("../../src/contentscript/youtube/videoInfo.ts", () => ({
    getVideoInfoFromShortsDetail: mockGetVideoInfoFromShortsDetail,
}));

// Import the functions we want to test
const { handleQuestionShortcut, isVideoDetailPage } = await import(
    "../../src/contentscript/youtube/keyboardShortcuts.js"
);

describe("Keyboard Shortcuts", () => {
    let mockEvent;
    let mockQuestionButton;
    let mockQuestionInput;
    let originalQuerySelector;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock window.location
        const mockLocation = new URL("https://www.youtube.com/watch?v=test123");
        Object.defineProperty(window, "location", {
            value: mockLocation,
            writable: true,
        });

        // Create mock elements
        mockQuestionButton = document.createElement("button");
        mockQuestionButton.click = jest.fn();

        mockQuestionInput = document.createElement("input");
        mockQuestionInput.focus = jest.fn();

        // Create base mock event
        mockEvent = {
            code: "KeyQ",
            ctrlKey: false,
            altKey: false,
            metaKey: false,
            shiftKey: false,
            preventDefault: jest.fn(),
            target: document.createElement("div"),
        };

        // Mock document.querySelector
        originalQuerySelector = document.querySelector;
        document.querySelector = jest.fn();
    });

    afterEach(() => {
        // Restore original querySelector
        document.querySelector = originalQuerySelector;
    });

    describe("isVideoDetailPage", () => {
        test("should return true for video watch pages", () => {
            expect(isVideoDetailPage()).toBe(true);
        });

        test("should return false for non-video pages", () => {
            window.location = new URL(
                "https://www.youtube.com/feed/subscriptions"
            );
            expect(isVideoDetailPage()).toBe(false);
        });

        test("should return false for watch pages without video ID", () => {
            window.location = new URL("https://www.youtube.com/watch");
            expect(isVideoDetailPage()).toBe(false);
        });
    });

    describe("handleQuestionShortcut", () => {
        test("should not trigger for non-Q key", () => {
            mockEvent.code = "KeyW";
            handleQuestionShortcut(mockEvent);

            expect(mockEvent.preventDefault).not.toHaveBeenCalled();
            expect(document.querySelector).not.toHaveBeenCalled();
        });

        test("should not trigger when modifier keys are pressed", () => {
            const modifierTests = [
                { ctrlKey: true },
                { altKey: true },
                { metaKey: true },
                { shiftKey: true },
            ];

            modifierTests.forEach((modifier) => {
                const testEvent = { ...mockEvent, ...modifier };
                handleQuestionShortcut(testEvent);

                expect(mockEvent.preventDefault).not.toHaveBeenCalled();
                expect(document.querySelector).not.toHaveBeenCalled();
            });
        });

        test("should not trigger when target is an input element", () => {
            mockEvent.target = document.createElement("input");
            handleQuestionShortcut(mockEvent);

            expect(mockEvent.preventDefault).not.toHaveBeenCalled();
            expect(document.querySelector).not.toHaveBeenCalled();
        });

        test("should click question button if dropdown menu is shown", () => {
            // Mock findQuestionMenuShown to return a button
            mockFindQuestionMenuShown.mockReturnValue(mockQuestionButton);

            handleQuestionShortcut(mockEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockQuestionButton.click).toHaveBeenCalled();
        });

        test("should focus question input if on video page and input is shown", () => {
            // Mock findQuestionMenuShown to return null (no dropdown shown)
            mockFindQuestionMenuShown.mockReturnValue(null);

            // Mock findSimpleQuestionInputShown to return an input
            mockFindSimpleQuestionInputShown.mockReturnValue(mockQuestionInput);

            handleQuestionShortcut(mockEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockQuestionInput.focus).toHaveBeenCalled();
        });

        test("should not focus input if not on video page", () => {
            window.location = new URL(
                "https://www.youtube.com/feed/subscriptions"
            );

            // Mock findQuestionMenuShown to return null (no dropdown shown)
            mockFindQuestionMenuShown.mockReturnValue(null);

            handleQuestionShortcut(mockEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockQuestionInput.focus).not.toHaveBeenCalled();
        });

        test("should show question dialog on shorts page", () => {
            // Set location to shorts page
            window.location = new URL("https://www.youtube.com/shorts/test123");

            // Mock findQuestionMenuShown to return null (no dropdown shown)
            mockFindQuestionMenuShown.mockReturnValue(null);

            // Mock querySelector for shorts container
            const mockContainer = document.createElement("div");
            document.querySelector.mockReturnValue(mockContainer);

            // Mock getVideoInfoFromShortsDetail
            const mockVideoInfo = { id: "test123", title: "Test Video" };
            mockGetVideoInfoFromShortsDetail.mockReturnValue({ videoInfo: mockVideoInfo });

            handleQuestionShortcut(mockEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockShowQuestionDialog).toHaveBeenCalledWith(mockVideoInfo);
        });
    });
});
