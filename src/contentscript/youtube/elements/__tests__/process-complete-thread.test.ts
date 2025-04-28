/**
 * @jest-environment jsdom
 */
import { processCompleteThread } from "../comments/process-complete-thread";
import { Comment } from "../../../../types";

describe("processCompleteThread", () => {
    let mockThread: Element;
    let mockReplyElements: NodeListOf<HTMLElement>;
    let state: { scrollTarget: Element | null; lastProcessedThread: Element | null; newCommentsCount: number; newComments: Comment[] };

    beforeEach(() => {
        // Create a mock thread element with all required selectors
        mockThread = document.createElement("div");
        mockThread.innerHTML = `
            <div id="comment">
                <div id="body">
                    <div id="main">
                        <div id="author-text">@TestUser</div>
                        <div id="published-time-text">2 days ago</div>
                        <div id="content">
                            <yt-attributed-string>
                                <span role="text">This is a test comment <span><img alt="👍"></span></span>
                            </yt-attributed-string>
                        </div>
                        <div id="vote-count-middle">42</div>
                    </div>
                </div>
            </div>
        `;

        // Create mock reply elements
        const mockReply = document.createElement("div");
        mockReply.innerHTML = `
            <div id="author-text">@ReplyUser</div>
            <div id="published-time-text">1 day ago</div>
            <div id="content">
                <yt-attributed-string>
                    <span>This is a reply</span>
                </yt-attributed-string>
            </div>
            <div id="vote-count-middle">10</div>
        `;

        // Create a proper NodeListOf implementation
        const mockNodeList = {
            length: 1,
            item: (index: number) => index === 0 ? mockReply : null,
            forEach: (callback: (value: HTMLElement, key: number, parent: NodeListOf<HTMLElement>) => void) => {
                callback(mockReply, 0, mockNodeList as NodeListOf<HTMLElement>);
            },
            entries: function* () {
                yield [0, mockReply] as [number, HTMLElement];
            },
            keys: function* () {
                yield 0;
            },
            values: function* () {
                yield mockReply;
            },
            [Symbol.iterator]: function* () {
                yield mockReply;
            }
        } as NodeListOf<HTMLElement>;

        mockReplyElements = mockNodeList;

        // Initialize state
        state = {
            scrollTarget: null,
            lastProcessedThread: null,
            newCommentsCount: 0,
            newComments: []
        };
    });

    it("should process a thread with no replies", () => {
        processCompleteThread(mockThread, state);

        expect(state.newCommentsCount).toBe(1);
        expect(state.newComments).toHaveLength(1);
        expect(state.newComments[0]).toEqual({
            author: "TestUser",
            publishedTime: "2 days ago",
            text: "This is a test comment 👍",
            likesCount: 42
        });
        expect(state.lastProcessedThread).toBe(mockThread);
    });

    it("should process a thread with replies", () => {
        processCompleteThread(mockThread, state, mockReplyElements);

        expect(state.newCommentsCount).toBe(2); // 1 main comment + 1 reply
        expect(state.newComments).toHaveLength(1);
        expect(state.newComments[0].replies).toHaveLength(1);
        expect(state.newComments[0].replies![0]).toEqual({
            author: "ReplyUser",
            publishedTime: "1 day ago",
            text: "This is a reply",
            likesCount: 10
        });
        expect(state.lastProcessedThread).toBe(mockThread);
    });

    it("should not process thread if scrollTarget is set", () => {
        state.scrollTarget = document.createElement("div");
        processCompleteThread(mockThread, state, mockReplyElements);

        expect(state.newCommentsCount).toBe(0);
        expect(state.newComments).toHaveLength(0);
        expect(state.lastProcessedThread).toBeNull();
    });

    it("should handle comments without likes count", () => {
        const noLikesThread = document.createElement("div");
        noLikesThread.innerHTML = `
            <div id="comment">
                <div id="body">
                    <div id="main">
                        <div id="author-text">@NoLikesUser</div>
                        <div id="published-time-text">3 days ago</div>
                        <div id="content">
                            <yt-attributed-string>
                                <span>Comment with no likes</span>
                            </yt-attributed-string>
                        </div>
                    </div>
                </div>
            </div>
        `;

        processCompleteThread(noLikesThread, state);

        expect(state.newComments[0]).toEqual({
            author: "NoLikesUser",
            publishedTime: "3 days ago",
            text: "Comment with no likes"
        });
        expect(state.newComments[0]).not.toHaveProperty("likesCount");
    });
}); 