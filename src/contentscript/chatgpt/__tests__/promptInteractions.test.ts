/**
 * @jest-environment jsdom
 */

import { PromptData } from "../../../types";
import { MockDataTransfer, MockDragEvent, MockFile } from "../../__mocks__/domMocks";
import { promptDivider } from "../messages";
import { setPromptText, setPromptWithTranscript } from "../promptInteractions";
import { getCodeBlockedText, getVideoInfoPrompt } from "../prompt-formatter";

// Mock chrome.i18n.getMessage
global.chrome = {
    i18n: {
        getMessage: jest.fn(key => key),
    },
} as any;

// Mock transcript functions
jest.mock("../prompt-formatter", () => ({
    getCodeBlockedText: jest.fn(),
    getVideoInfoPrompt: jest.fn(),
}));

// Set up global mocks
global.DataTransfer = MockDataTransfer as any;
global.File = MockFile as any;
global.DragEvent = MockDragEvent as any;

describe("promptInteractions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = "";
    });

    describe("setPromptText", () => {
        it("should set prompt text with proper HTML formatting", () => {
            // Setup
            const textarea = document.createElement("textarea");
            const text = "Line 1\nLine 2\nLine 3";

            // Execute
            setPromptText(textarea, text);

            // Verify
            expect(textarea.innerHTML).toBe(
                "&lt;p&gt;Line 1&lt;/p&gt;&lt;p&gt;Line 2&lt;/p&gt;&lt;p&gt;Line 3&lt;/p&gt;"
            );
        });

        it("should handle empty text", () => {
            // Setup
            const textarea = document.createElement("textarea");

            // Execute
            setPromptText(textarea, "");

            // Verify
            expect(textarea.innerHTML).toBe("&lt;p&gt;&lt;/p&gt;");
        });
    });

    describe("setPromptWithTranscript", () => {
        beforeEach(() => {
            (getVideoInfoPrompt as jest.Mock).mockReturnValue("Mock Video Info");
            (getCodeBlockedText as jest.Mock).mockReturnValue("Mock Transcript");
        });

        it("should set prompt and attach transcript file", () => {
            // Setup
            const textarea = document.createElement("textarea");
            const promptData: PromptData = {
                videoInfo: {
                    id: "test-id",
                    title: "Test Title",
                },
                transcript: "Test transcript",
                question: "Test question",
                langCode: "en",
                description: "Test description",
            };

            // Spy on dispatchEvent
            const dispatchEventSpy = jest.spyOn(textarea, "dispatchEvent");

            // Execute
            setPromptWithTranscript(textarea, promptData);

            // Verify
            expect(textarea.innerHTML).toBe(
                `&lt;p&gt;Test question&lt;/p&gt;&lt;p&gt;${promptDivider}&lt;/p&gt;&lt;p&gt;Mock Video Info&lt;/p&gt;`
            );
            expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
            expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(DragEvent));

            // Verify the DragEvent details
            const eventCall = dispatchEventSpy.mock.calls[0][0] as DragEvent;
            expect(eventCall.type).toBe("drop");
            expect(eventCall.bubbles).toBe(true);
            expect(eventCall.cancelable).toBe(true);

            // Verify file attachment
            const file = eventCall.dataTransfer?.files[0];
            expect(file?.name).toBe("attachFilename");
            expect(file?.type).toBe("text/plain");
        });

        it("should call transcript helper functions with correct parameters", () => {
            // Setup
            const textarea = document.createElement("textarea");
            const promptData: PromptData = {
                videoInfo: {
                    id: "test-id",
                    title: "Test Title",
                },
                transcript: "Test transcript",
                question: "Test question",
                langCode: "fr",
                description: "Test description",
            };

            // Execute
            setPromptWithTranscript(textarea, promptData);

            // Verify
            expect(getVideoInfoPrompt).toHaveBeenCalledWith(promptData);
            expect(getCodeBlockedText).toHaveBeenCalledWith({
                title: "Transcript",
                text: promptData.transcript
            });
        });
    });
});
