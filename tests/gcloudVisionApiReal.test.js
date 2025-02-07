import { requestOCR } from "../src/background/gcloudVisionApi";

const IMAGE_URL = "https://i.ytimg.com/vi/UC5wjXks2eA/hqdefault.jpg";
const EXPECTED_TEXT = `TV로 보는
\`골라둔다큐!
삶이 공허해진 미국 부자가
10만 평 산맥을 사면 생기는 일`;

describe("requestOCR with real API", () => {
    beforeAll(() => {
        // Set the real API key if needed for local testing
        // process.env.GOOGLE_CLOUD_API_KEY = "your-api-key";
    });

    it("should successfully process an image and return text", async () => {
        // Skip test if no API key is available
        if (!process.env.GOOGLE_CLOUD_API_KEY) {
            console.log('Skipping real API test - no API key available');
            return;
        }

        try {
            const result = await requestOCR(IMAGE_URL);
            expect(result).toBe(EXPECTED_TEXT);
        } catch (error) {
            console.error("Error during real API request:", error);
            // Log additional error details if available
            if (error.response) {
                const errorDetails = await error.response.json();
                console.error("Error details:", errorDetails);
            }
            throw error;
        }
    });
});
