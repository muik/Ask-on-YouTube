import { loadTranscript } from "../src/background/prompt.js";

describe("loadTranscript", () => {
    it("should return a transcript", async () => {
        const videoId = "kSgIRBvxiDo";
        const result = await loadTranscript(videoId);
        expect(result).toBeDefined();
        expect(typeof result).toBe("string");
    });
});
