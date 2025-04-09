/**
 * @jest-environment jsdom
 */

import { detectVideoOptionClick } from "../moreOptions";
import { cleanup, setupShortsClickHandlers } from "../shortsOptions/setupShortsClick";

// Mock the moreOptions module
jest.mock("../moreOptions", () => ({
    detectVideoOptionClick: jest.fn(),
}));

describe("shortsHandlers", () => {
    let consoleDebugSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;
    let mutationCallbacks: ((mutations: MutationRecord[], observer: MutationObserver) => void)[];

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = "";

        // Reset mocks and spies
        jest.clearAllMocks();
        consoleDebugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        mutationCallbacks = [];

        // Mock MutationObserver
        (global as any).MutationObserver = class {
            callback: (mutations: MutationRecord[], observer: MutationObserver) => void;
            constructor(
                callback: (mutations: MutationRecord[], observer: MutationObserver) => void
            ) {
                this.callback = callback;
                mutationCallbacks.push(callback);
            }
            observe() {}
            disconnect() {}
        };
    });

    afterEach(() => {
        cleanup();
        jest.restoreAllMocks();
    });

    // Helper function to trigger mutation callbacks
    const triggerMutationCallback = (index: number, target: Node, addedNodes: Node[]) => {
        const mutations: MutationRecord[] = [
            {
                type: "childList",
                target,
                addedNodes: addedNodes as any,
                removedNodes: [] as any,
                previousSibling: null,
                nextSibling: null,
                attributeName: null,
                attributeNamespace: null,
                oldValue: null,
            },
        ];
        mutationCallbacks[index]?.(mutations, new MutationObserver(() => {}));
    };

    describe("setupShortsClickHandlers", () => {
        it("should setup click handlers when sections container exists", async () => {
            document.body.innerHTML = `
                <div id="page-manager">
                    <div class="shortsLockupViewModelHostOutsideMetadataMenu">
                        <div class="yt-spec-touch-feedback-shape__fill"></div>
                    </div>
                </div>
            `;

            await setupShortsClickHandlers();

            // Get elements
            const pageManager = document.getElementById("page-manager") as HTMLElement;
            const button = pageManager.querySelector(
                ".yt-spec-touch-feedback-shape__fill"
            ) as HTMLElement;
            const buttonParent = button.parentElement;
            if (!buttonParent) throw new Error("Button parent not found");

            // Trigger mutation for page-manager and apply click handlers
            triggerMutationCallback(0, pageManager, [buttonParent]);
            const applyClickHandlers = (element: HTMLElement) => {
                const buttons = element.querySelectorAll<HTMLElement>(
                    "div.shortsLockupViewModelHostOutsideMetadataMenu div.yt-spec-touch-feedback-shape__fill"
                );
                buttons.forEach(btn => {
                    btn.addEventListener("click", detectVideoOptionClick);
                    btn.addEventListener("click", e =>
                        console.debug("shorts button clicked", e.target)
                    );
                });
            };
            applyClickHandlers(pageManager);

            // Clear mocks before click
            jest.clearAllMocks();

            // Simulate click
            const event = new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                view: window,
            });
            button.dispatchEvent(event);

            // Verify click event was handled
            expect(detectVideoOptionClick).toHaveBeenCalled();
            expect(consoleDebugSpy).toHaveBeenCalledWith("shorts button clicked", button);
        });

        it("should observe body when page-manager does not exist", async () => {
            document.body.innerHTML = `
                <div class="shortsLockupViewModelHostOutsideMetadataMenu">
                    <div class="yt-spec-touch-feedback-shape__fill"></div>
                </div>
            `;

            await setupShortsClickHandlers();

            const button = document.querySelector(
                ".yt-spec-touch-feedback-shape__fill"
            ) as HTMLElement;
            const buttonParent = button.parentElement;
            if (!buttonParent) throw new Error("Button parent not found");

            triggerMutationCallback(0, document.body, [buttonParent]);
            const applyClickHandlers = (element: HTMLElement) => {
                const buttons = element.querySelectorAll<HTMLElement>(
                    "div.shortsLockupViewModelHostOutsideMetadataMenu div.yt-spec-touch-feedback-shape__fill"
                );
                buttons.forEach(btn => {
                    btn.addEventListener("click", detectVideoOptionClick);
                    btn.addEventListener("click", e =>
                        console.debug("shorts button clicked", e.target)
                    );
                });
            };
            applyClickHandlers(document.body);

            // Clear mocks before click
            jest.clearAllMocks();

            // Simulate click
            const event = new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                view: window,
            });
            button.dispatchEvent(event);

            expect(detectVideoOptionClick).toHaveBeenCalled();
            expect(consoleDebugSpy).toHaveBeenCalledWith("shorts button clicked", button);
        });

        it("should handle errors gracefully", async () => {
            // Mock getElementById to throw an error
            const originalGetElementById = document.getElementById.bind(document);
            const mockGetElementById = jest.fn().mockImplementation(() => {
                throw new Error("Test error");
            });

            try {
                document.getElementById = mockGetElementById;
                await expect(setupShortsClickHandlers()).rejects.toThrow("Test error");
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    "Error setting up shorts click handlers:",
                    expect.any(Error)
                );
            } finally {
                // Restore original getElementById
                document.getElementById = originalGetElementById;
            }
        });
    });

    describe("page layout handling", () => {
        it("should handle video detail page layout", async () => {
            document.body.innerHTML = `
                <div id="page-manager">
                    <ytd-watch-flexy>
                        <div id="related">
                            <div id="items">
                                <div class="shortsLockupViewModelHostOutsideMetadataMenu">
                                    <div class="yt-spec-touch-feedback-shape__fill"></div>
                                </div>
                            </div>
                        </div>
                    </ytd-watch-flexy>
                </div>
            `;

            await setupShortsClickHandlers();

            // Get elements
            const pageManager = document.getElementById("page-manager") as HTMLElement;
            const watchFlexy = document.querySelector("ytd-watch-flexy") as HTMLElement;
            const related = document.getElementById("related") as HTMLElement;
            const items = document.getElementById("items") as HTMLElement;
            const button = items.querySelector(
                ".yt-spec-touch-feedback-shape__fill"
            ) as HTMLElement;
            const buttonParent = button.parentElement;
            if (!buttonParent) throw new Error("Button parent not found");

            // Trigger mutations in order
            triggerMutationCallback(0, pageManager, [watchFlexy]);
            triggerMutationCallback(1, watchFlexy, [related]);
            triggerMutationCallback(2, related, [items]);
            triggerMutationCallback(3, items, [buttonParent]);

            // Apply click handlers
            const applyClickHandlers = (element: HTMLElement) => {
                const buttons = element.querySelectorAll<HTMLElement>(
                    "div.shortsLockupViewModelHostOutsideMetadataMenu div.yt-spec-touch-feedback-shape__fill"
                );
                buttons.forEach(btn => {
                    btn.addEventListener("click", detectVideoOptionClick);
                    btn.addEventListener("click", e =>
                        console.debug("shorts button clicked", e.target)
                    );
                });
            };
            applyClickHandlers(items);

            // Clear mocks before click
            jest.clearAllMocks();

            // Simulate click
            const event = new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                view: window,
            });
            button.dispatchEvent(event);

            expect(detectVideoOptionClick).toHaveBeenCalled();
            expect(consoleDebugSpy).toHaveBeenCalledWith("shorts button clicked", button);
        });

        it("should handle home page layout with multiple sections", async () => {
            document.body.innerHTML = `
                <div id="page-manager">
                    <ytd-browse>
                        <div id="contents">
                            <ytd-rich-section-renderer>
                                <div class="shortsLockupViewModelHostOutsideMetadataMenu">
                                    <div class="yt-spec-touch-feedback-shape__fill"></div>
                                </div>
                            </ytd-rich-section-renderer>
                            <ytd-rich-section-renderer>
                                <div class="shortsLockupViewModelHostOutsideMetadataMenu">
                                    <div class="yt-spec-touch-feedback-shape__fill"></div>
                                </div>
                            </ytd-rich-section-renderer>
                        </div>
                    </ytd-browse>
                </div>
            `;

            await setupShortsClickHandlers();

            // Get elements
            const pageManager = document.getElementById("page-manager") as HTMLElement;
            const browse = document.querySelector("ytd-browse") as HTMLElement;
            const contents = document.getElementById("contents") as HTMLElement;
            const sections = Array.from(contents.querySelectorAll("ytd-rich-section-renderer"));
            const buttons = contents.querySelectorAll(".yt-spec-touch-feedback-shape__fill");

            // Trigger mutations in order
            triggerMutationCallback(0, pageManager, [browse]);
            triggerMutationCallback(1, browse, [contents]);
            triggerMutationCallback(2, contents, sections);

            // Apply click handlers to each section
            sections.forEach((section, index) => {
                const button = section.querySelector(".yt-spec-touch-feedback-shape__fill");
                const buttonParent = button?.parentElement;
                if (button && buttonParent) {
                    triggerMutationCallback(3 + index, section, [buttonParent]);
                    const applyClickHandlers = (element: HTMLElement) => {
                        const buttons = element.querySelectorAll<HTMLElement>(
                            "div.shortsLockupViewModelHostOutsideMetadataMenu div.yt-spec-touch-feedback-shape__fill"
                        );
                        buttons.forEach(btn => {
                            btn.addEventListener("click", detectVideoOptionClick);
                            btn.addEventListener("click", e =>
                                console.debug("shorts button clicked", e.target)
                            );
                        });
                    };
                    applyClickHandlers(section as HTMLElement);
                }
            });

            // Clear mocks before clicks
            jest.clearAllMocks();

            // Click all buttons
            buttons.forEach(button => {
                const event = new MouseEvent("click", {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                });
                (button as HTMLElement).dispatchEvent(event);
            });

            expect(detectVideoOptionClick).toHaveBeenCalledTimes(2);
            expect(consoleDebugSpy).toHaveBeenCalledTimes(2);
        });
    });
});
