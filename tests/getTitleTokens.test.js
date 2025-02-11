import { getTitleTokens } from "../src/contentscript/youtube/questionDialog/titleToken.js";

describe("getTitleTokens", () => {
    it("should return an array of tokens for a given input string", () => {
        const input =
            "This Man Makes 3,000+ Bagels by Hand Every Day | On the Job / Priya Krishna | NYT Cooking";
        const expectedOutput = [
            {
                text: "This Man Makes 3,000+ Bagels by Hand Every Day",
                type: "inputable",
            },
            {
                text: " | ",
                type: "separator",
            },
            {
                text: "On the Job / Priya Krishna | NYT Cooking",
                type: "inputable",
            },
        ];
        expect(getTitleTokens(input)).toEqual(expectedOutput);
    });

    it("should handle empty separators correctly", () => {
        const input = `'딥시크 충격'에 터져나오는 탄식‥반전 카드는? (2025.02.09/뉴스데스크/MBC)`;
        const expectedOutput = [
            {
                text: `'딥시크 충격'에 터져나오는 탄식‥반전 카드는?`,
                type: "inputable",
            },
            {
                text: " ",
                type: "separator",
            },
            {
                text: "(2025.02.09/뉴스데스크/MBC)",
                type: "inputable",
            },
        ];
        expect(getTitleTokens(input)).toEqual(expectedOutput);
    });

    it("should return an empty array for an empty input string", () => {
        const input = "";
        const expectedOutput = [];
        expect(getTitleTokens(input)).toEqual(expectedOutput);
    });

    it("should return an empty array for a null input", () => {
        const input = null;
        const expectedOutput = [];
        expect(getTitleTokens(input)).toEqual(expectedOutput);
    });
});
