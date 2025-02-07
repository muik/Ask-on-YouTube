import { jest } from "@jest/globals";
import { requestOCR } from "../src/background/gcloudVisionApi";

// Mock the global fetch function
beforeAll(() => {
    global.fetch = jest.fn();
    global.process.env.GOOGLE_CLOUD_API_KEY = "test-api-key";
});

describe("requestOCR", () => {
    beforeEach(() => {
        // Clear mock data before each test
        fetch.mockClear();
    });

    it("should successfully process an image and return text", async () => {
        // Mock successful API response
        const mockResponse = {
            responses: [
                {
                    textAnnotations: [
                        {
                            description: "Sample detected text",
                        },
                    ],
                },
            ],
        };

        fetch.mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            })
        );

        const result = await requestOCR("http://example.com/image.jpg");

        // Check if fetch was called with correct parameters
        expect(fetch).toHaveBeenCalledWith(
            `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_API_KEY}`,
            expect.objectContaining({
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: expect.any(String),
            })
        );

        // Verify the returned text
        expect(result).toBe("Sample detected text");
    });

    it("should handle empty response from API", async () => {
        // Mock API response with no text detected
        const mockResponse = {
            responses: [{}],
        };

        fetch.mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            })
        );

        const result = await requestOCR("https://example.com/image.jpg");
        expect(result).toBe("");
    });

    it("should throw error when API request fails", async () => {
        fetch.mockImplementationOnce(() =>
            Promise.resolve({
                ok: false,
                status: 400,
                statusText: "Bad Request",
                json: () =>
                    Promise.resolve({
                        error: {
                            code: 400,
                            message: "Bad Request",
                            status: "INVALID_ARGUMENT",
                        },
                    }),
            })
        );

        await expect(
            requestOCR("https://example.com/image.jpg")
        ).rejects.toThrow(
            "Image annotate request Error: INVALID_ARGUMENT(400) - Bad Request"
        );
    });

    it("should throw error when network request fails", async () => {
        const networkError = new Error("Network error");
        fetch.mockImplementationOnce(() => Promise.reject(networkError));

        await expect(
            requestOCR("https://example.com/image.jpg")
        ).rejects.toThrow("Network error");
    });
});
