/**
 * @jest-environment jsdom
 */

import { PromptData } from "../../../types";
import { waitForElm } from "../../utils";
import { isAnswerUrlObserving, observeAnswerUrl, stopAnswerUrlObserver } from "../answer";
import { handlePromptResponse } from "../prompt";
import { setPromptText, setPromptWithTranscript } from "../promptInteractions";
import { getNewChatButton, hasErrorResponseArticle, isNotLogin, SELECTORS } from "../ui";

// Mock dependencies
jest.mock("../../utils", () => ({
    waitForElm: jest.fn(),
}));

jest.mock("../answer", () => ({
    observeAnswerUrl: jest.fn(),
    stopAnswerUrlObserver: jest.fn(),
    isAnswerUrlObserving: jest.fn(),
}));

jest.mock("../promptInteractions", () => ({
    setPromptText: jest.fn(),
    setPromptWithTranscript: jest.fn(),
}));

jest.mock("../ui", () => ({
    getNewChatButton: jest.fn(),
    hasErrorResponseArticle: jest.fn(),
    isNotLogin: jest.fn(),
    SELECTORS: {
        PROMPT_TEXTAREA: 'textarea[data-id="prompt-textarea"]',
        SEND_BUTTON: 'button[data-id="send-button"]',
        SEND_BUTTON_NOT_DISABLED: 'button[data-id="send-button"]:not([disabled])',
        SPEECH_BUTTON: 'button[data-id="speech-button"]',
    },
}));

describe("handlePromptResponse", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = "";
        (waitForElm as jest.Mock).mockReset();
    });

    it("should handle prompt submission successfully", async () => {
        // Setup
        const mockPromptData: PromptData = {
            videoInfo: {
                id: "test-video-id",
                title: "Test Video",
            },
            transcript: "Test transcript",
            description: "Test video description",
            question: "Test question",
            langCode: "en",
        };

        const mockTextarea = document.createElement("textarea");
        mockTextarea.setAttribute("data-id", "prompt-textarea");

        const mockSendButton = document.createElement("button");
        mockSendButton.setAttribute("data-id", "send-button");

        const mockSpeechButton = document.createElement("button");
        mockSpeechButton.setAttribute("data-id", "speech-button");

        (waitForElm as jest.Mock)
            .mockImplementationOnce(() => Promise.resolve(mockTextarea))
            .mockImplementationOnce(() => Promise.resolve(mockSendButton))
            .mockImplementationOnce(() => Promise.resolve(mockSpeechButton));

        (isAnswerUrlObserving as jest.Mock).mockReturnValue(true);
        (hasErrorResponseArticle as jest.Mock).mockReturnValue(true);

        // Execute
        handlePromptResponse({ promptData: mockPromptData });

        // Wait for all promises to resolve
        await new Promise(resolve => setTimeout(resolve, 200));

        // Verify
        expect(waitForElm).toHaveBeenCalledWith(SELECTORS.PROMPT_TEXTAREA);
        expect(setPromptText).toHaveBeenCalled();
        expect(observeAnswerUrl).toHaveBeenCalledWith(mockPromptData);
        expect(stopAnswerUrlObserver).toHaveBeenCalled();
    });

    it("should handle disabled send button and try to attach transcript", async () => {
        // Setup
        const mockPromptData: PromptData = {
            videoInfo: {
                id: "test-video-id",
                title: "Test Video",
            },
            transcript: "Test transcript",
            description: "Test video description",
            question: "Test question",
            langCode: "en",
        };

        const mockTextarea = document.createElement("textarea");
        mockTextarea.setAttribute("data-id", "prompt-textarea");
        document.body.appendChild(mockTextarea);

        const mockSendButton = document.createElement("button");
        mockSendButton.setAttribute("data-id", "send-button");
        mockSendButton.setAttribute("disabled", "true");

        const mockNewChatButton = document.createElement("button");
        mockNewChatButton.setAttribute("data-id", "new-chat-button");

        const mockSendButtonNotDisabled = document.createElement("button");
        mockSendButtonNotDisabled.setAttribute("data-id", "send-button");

        const mockSpeechButton = document.createElement("button");
        mockSpeechButton.setAttribute("data-id", "speech-button");

        (waitForElm as jest.Mock)
            .mockImplementationOnce(() => Promise.resolve(mockTextarea))
            .mockImplementationOnce(() => Promise.resolve(mockSendButton))
            .mockImplementationOnce(() => Promise.resolve(mockSendButtonNotDisabled))
            .mockImplementationOnce(() => Promise.resolve(mockSpeechButton));

        (getNewChatButton as jest.Mock).mockReturnValue(mockNewChatButton);
        (isNotLogin as jest.Mock).mockReturnValue(false);
        (isAnswerUrlObserving as jest.Mock).mockReturnValue(true);

        // Execute
        handlePromptResponse({ promptData: mockPromptData });

        // Wait for all promises to resolve
        await new Promise(resolve => setTimeout(resolve, 500));

        // Verify
        expect(waitForElm).toHaveBeenCalledWith(SELECTORS.PROMPT_TEXTAREA);
        expect(setPromptText).toHaveBeenCalled();
        expect(getNewChatButton).toHaveBeenCalled();
        expect(setPromptWithTranscript).toHaveBeenCalled();
        expect(stopAnswerUrlObserver).toHaveBeenCalled();
    });

    it("should handle login required case", async () => {
        // Setup
        const mockPromptData: PromptData = {
            videoInfo: {
                id: "test-video-id",
                title: "Test Video",
            },
            transcript: "Test transcript",
            description: "Test video description",
            question: "Test question",
            langCode: "en",
        };

        const mockTextarea = document.createElement("textarea");
        mockTextarea.setAttribute("data-id", "prompt-textarea");
        document.body.appendChild(mockTextarea);

        const mockSendButton = document.createElement("button");
        mockSendButton.setAttribute("data-id", "send-button");
        mockSendButton.setAttribute("disabled", "true");

        (waitForElm as jest.Mock)
            .mockImplementationOnce(() => Promise.resolve(mockTextarea))
            .mockImplementationOnce(() => Promise.resolve(mockSendButton));

        (isNotLogin as jest.Mock).mockReturnValue(true);

        // Execute
        handlePromptResponse({ promptData: mockPromptData });

        // Wait for all promises to resolve
        await new Promise(resolve => setTimeout(resolve, 200));

        // Verify
        expect(waitForElm).toHaveBeenCalledWith(SELECTORS.PROMPT_TEXTAREA);
        expect(setPromptText).toHaveBeenCalledTimes(2); // Once for initial prompt, once for login message
        expect(getNewChatButton).not.toHaveBeenCalled();
    });

    it("should handle missing prompt data", () => {
        // Setup
        const consoleSpy = jest.spyOn(console, "debug");

        // Execute
        handlePromptResponse({ promptData: null as unknown as PromptData });

        // Verify
        expect(consoleSpy).toHaveBeenCalledWith("No prompt data received");
        expect(waitForElm).not.toHaveBeenCalled();
    });
});
