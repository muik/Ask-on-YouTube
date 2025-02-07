import { requestGemini } from "../src/background/geminiApi";

describe("Gemini API Real Request", () => {
    it("should return a response from the Gemini API", async () => {
        const prompt = "Hello, how are you?";

        try {
            const response = await requestGemini(prompt);
            console.log("Response:", response);
            expect(response).toBeDefined();
            expect(typeof response).toBe("string");
        } catch (error) {
            console.error("Error:", error);
            throw new Error("Failed to get a response from the Gemini API");
        }
    }, 2000); // Set a timeout of 10 seconds for this test
});
