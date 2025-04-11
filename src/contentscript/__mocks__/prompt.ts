import { PromptResponse } from "../../types/chatgpt";

// Mock prompt handling
export const mockHandlePromptResponse = jest
    .fn()
    .mockImplementation((_response: PromptResponse) => {
        // Mock implementation of prompt handling
        return Promise.resolve();
    });

// Mock prompt utilities
export const mockPromptUtils = {
    handlePromptResponse: mockHandlePromptResponse,
};
