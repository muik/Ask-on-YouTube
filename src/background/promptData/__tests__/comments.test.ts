import { getCommentsPromptText } from "../comments";
import { Comment } from "../../../types";
import { formatInlineText } from "../format";

describe("getCommentsPromptText", () => {
    it("should return empty string when comments is undefined", () => {
        expect(getCommentsPromptText(undefined)).toBe("");
    });

    it("should return 'No comments' when comments array is empty", () => {
        expect(getCommentsPromptText([])).toBe("No comments");
    });

    it("should format a single comment without likes", () => {
        const comments: Comment[] = [
            {
                author: "User1",
                text: "Great video!",
                publishedTime: "1 day ago",
                likesCount: undefined,
                replies: [],
            },
        ];

        const expected = `- User1: "Great video!"`;

        expect(getCommentsPromptText(comments)).toBe(expected);
    });

    it("should format a single comment with likes", () => {
        const comments: Comment[] = [
            {
                author: "User1",
                text: "Great video!",
                publishedTime: "1 day ago",
                likesCount: 42,
                replies: [],
            },
        ];

        const expected = `- User1: "Great video!", 42 likes`;

        expect(getCommentsPromptText(comments)).toBe(expected);
    });

    it("should format comments with replies", () => {
        const comments: Comment[] = [
            {
                author: "User1",
                text: "Great video!",
                publishedTime: "1 day ago",
                likesCount: 42,
                replies: [
                    {
                        author: "User2",
                        text: "Thanks!",
                        publishedTime: "1 day ago",
                        likesCount: 10,
                    },
                    {
                        author: "User3",
                        text: "I agree!",
                        publishedTime: "1 day ago",
                        likesCount: 5,
                    },
                ],
            },
        ];

        const expected = `- User1: "Great video!", 42 likes
  - 2 Replies:
    - User2: "Thanks!", 10 likes
    - User3: "I agree!", 5 likes`;

        expect(getCommentsPromptText(comments)).toBe(expected);
    });

    it("should format multiple top-level comments with and without replies", () => {
        const comments: Comment[] = [
            {
                author: "User1",
                text: "First comment",
                publishedTime: "1 day ago",
                likesCount: 10,
                replies: [
                    {
                        author: "User2",
                        text: "Reply to first",
                        publishedTime: "1 day ago",
                        likesCount: 2,
                    },
                ],
            },
            {
                author: "User3",
                text: "Second comment",
                publishedTime: "1 day ago",
                likesCount: undefined,
                replies: [],
            },
        ];

        const expected = `- User1: "First comment", 10 likes
  - 1 Replies:
    - User2: "Reply to first", 2 likes
- User3: "Second comment"`;

        expect(getCommentsPromptText(comments)).toBe(expected);
    });

    it("should format text by replacing newlines with spaces", () => {
        const comments: Comment[] = [
            {
                author: "User1",
                text: "First line\nSecond line",
                publishedTime: "1 day ago",
                likesCount: undefined,
                replies: [],
            },
        ];

        const expected = `- User1: "First line Second line"`;

        expect(getCommentsPromptText(comments)).toBe(expected);
    });

    it("should format text by replacing multiple spaces with single space", () => {
        const comments: Comment[] = [
            {
                author: "User1",
                text: "Too    many    spaces",
                publishedTime: "1 day ago",
                likesCount: undefined,
                replies: [],
            },
        ];

        const expected = `- User1: "Too many spaces"`;

        expect(getCommentsPromptText(comments)).toBe(expected);
    });

    it("should handle both newlines and multiple spaces in text", () => {
        const comments: Comment[] = [
            {
                author: "User1",
                text: "First line\nSecond    line\nThird  line",
                publishedTime: "1 day ago",
                likesCount: undefined,
                replies: [],
            },
        ];

        const expected = `- User1: "First line Second line Third line"`;

        expect(getCommentsPromptText(comments)).toBe(expected);
    });
});

describe("formatInlineText", () => {
    it("should replace newlines with spaces", () => {
        const text = "First line\nSecond line";
        const expected = "First line Second line";
        expect(formatInlineText(text)).toBe(expected);
    });

    it("should replace multiple spaces with single space", () => {
        const text = "Too    many    spaces";
        const expected = "Too many spaces";
        expect(formatInlineText(text)).toBe(expected);
    });

    it("should handle both newlines and multiple spaces in text", () => {
        const text = "First line\nSecond    line\nThird  line";
        const expected = "First line Second line Third line";
        expect(formatInlineText(text)).toBe(expected);
    });
});
