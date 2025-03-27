/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";
import { injectShortcutHelp } from "../../src/contentscript/youtube/shortcutHelp.js";

// Mock chrome.i18n
global.chrome = {
    i18n: {
        getMessage: jest.fn().mockReturnValue("Question"),
    },
};

describe("Shortcut Help", () => {
    let mockContainer;
    let mockDialog;
    let mockGeneralSectionOptions;
    let mockOptionTemplate;
    let mockObserver;
    let observerCallback;
    let visibilityObserverCallback;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create mock elements
        mockContainer = document.createElement("ytd-popup-container");
        mockContainer.classList.add("ytd-app");
        mockDialog = document.createElement("tp-yt-paper-dialog");
        mockGeneralSectionOptions = document.createElement("div");
        mockGeneralSectionOptions.id = "options";
        mockOptionTemplate = document.createElement("div");
        mockOptionTemplate.innerHTML = `
            <div id="label"></div>
            <div id="hotkey"></div>
        `;

        // Setup mock DOM structure
        const hotkeyDialogRenderer = document.createElement(
            "ytd-hotkey-dialog-renderer"
        );
        const sections = document.createElement("div");
        sections.id = "sections";

        // Add a first section (to make our section the second one)
        const firstSection = document.createElement(
            "ytd-hotkey-dialog-section-renderer"
        );
        sections.appendChild(firstSection);

        // Add our section
        const generalSection = document.createElement(
            "ytd-hotkey-dialog-section-renderer"
        );
        generalSection.appendChild(mockGeneralSectionOptions);
        sections.appendChild(generalSection);

        hotkeyDialogRenderer.appendChild(sections);
        mockDialog.appendChild(hotkeyDialogRenderer);
        mockGeneralSectionOptions.appendChild(mockOptionTemplate);

        // Mock MutationObserver
        mockObserver = {
            observe: jest.fn(),
            disconnect: jest.fn(),
        };
        global.MutationObserver = jest.fn().mockImplementation((callback) => {
            if (!observerCallback) {
                observerCallback = callback;
            } else {
                visibilityObserverCallback = callback;
            }
            return mockObserver;
        });

        // Mock document.querySelector
        document.querySelector = jest.fn().mockReturnValue(mockContainer);
    });

    test("should observe container for dialog changes", () => {
        injectShortcutHelp();
        expect(mockObserver.observe).toHaveBeenCalledWith(mockContainer, {
            childList: true,
        });
    });

    test("should add shortcut help when dialog appears", () => {
        injectShortcutHelp();

        // Setup mutation record
        const mutation = {
            type: "childList",
            addedNodes: [mockDialog],
        };

        // Call the observer callback
        observerCallback([mutation], mockObserver);

        // Verify observer was disconnected
        expect(mockObserver.disconnect).toHaveBeenCalled();

        // Make dialog visible to trigger shortcut addition
        mockDialog.removeAttribute("aria-hidden");
        visibilityObserverCallback(
            [
                {
                    type: "attributes",
                    attributeName: "aria-hidden",
                    target: mockDialog,
                },
            ],
            mockObserver
        );

        // Verify shortcut was added
        const addedOption = mockGeneralSectionOptions.lastElementChild;
        expect(addedOption.querySelector("#label").textContent).toBe(
            "Question"
        );
        expect(addedOption.querySelector("#hotkey").textContent).toBe("q");
    });

    test("should handle dialog visibility changes", () => {
        injectShortcutHelp();

        // Setup mutation record for dialog appearance
        const mutation = {
            type: "childList",
            addedNodes: [mockDialog],
        };

        // Call the observer callback
        observerCallback([mutation], mockObserver);

        // Simulate dialog becoming visible
        const visibilityMutation = {
            type: "attributes",
            attributeName: "aria-hidden",
            target: mockDialog,
        };
        mockDialog.removeAttribute("aria-hidden");

        // Call the visibility observer callback
        visibilityObserverCallback([visibilityMutation], mockObserver);

        // Verify shortcut was added
        const addedOption = mockGeneralSectionOptions.lastElementChild;
        expect(addedOption.querySelector("#label").textContent).toBe(
            "Question"
        );
        expect(addedOption.querySelector("#hotkey").textContent).toBe("q");
    });

    test("should not add shortcut if options section is not found", () => {
        // Remove the options section before injecting
        mockGeneralSectionOptions.remove();

        injectShortcutHelp();

        // Setup mutation record
        const mutation = {
            type: "childList",
            addedNodes: [mockDialog],
        };

        // Call the observer callback
        observerCallback([mutation], mockObserver);

        // Make dialog visible to trigger shortcut addition
        mockDialog.removeAttribute("aria-hidden");
        visibilityObserverCallback(
            [
                {
                    type: "attributes",
                    attributeName: "aria-hidden",
                    target: mockDialog,
                },
            ],
            mockObserver
        );

        // Verify no shortcut was added
        const optionsSection = mockDialog.querySelector(
            "#sections > ytd-hotkey-dialog-section-renderer:nth-child(2) #options"
        );
        expect(optionsSection).toBeNull();
    });
});
