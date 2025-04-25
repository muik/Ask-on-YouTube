import { getNumberFromText } from "../number";

describe("getNumberFromText", () => {
    it("should extract number from Korean text with commas", () => {
        expect(getNumberFromText("\n      댓글 1,452개\n    ")).toBe(1452);
    });

    it("should extract number from English text with commas", () => {
        expect(getNumberFromText("Comments: 1,234")).toBe(1234);
    });

    it("should extract number from text with multiple numbers", () => {
        expect(getNumberFromText("123abc456")).toBe(123456);
    });

    it("should handle text with no numbers", () => {
        expect(getNumberFromText("No numbers here")).toBe(0);
    });

    it("should handle empty string", () => {
        expect(getNumberFromText("")).toBe(0);
    });

    it("should handle text with only commas", () => {
        expect(getNumberFromText(",,,")).toBe(0);
    });

    it("should handle text with special characters", () => {
        expect(getNumberFromText("!@#$%^&*()123")).toBe(123);
    });
}); 