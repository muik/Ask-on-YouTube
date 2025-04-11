import Config from "../config";
import { BackgroundActions, Targets } from "../constants";
import { BackgroundMessage, PromptResponse } from "../types/chatgpt";
import { handlePromptResponse } from "./chatgpt/prompt";

const isChatGPTExtensionPage = (): boolean => {
    return (
        window.location.hostname === "chatgpt.com" &&
        window.location.search === `?ref=${Config.REF_CODE}`
    );
};

const getPromptFromBackground = async (): Promise<PromptResponse> => {
    const message: BackgroundMessage = {
        action: BackgroundActions.GET_PROMPT,
        target: Targets.CHATGPT,
    };
    return chrome.runtime.sendMessage<BackgroundMessage, PromptResponse>(message);
};

const initializeChatGPT = async (): Promise<void> => {
    if (!isChatGPTExtensionPage()) {
        return;
    }

    try {
        const response = await getPromptFromBackground();
        handlePromptResponse(response);
    } catch (error: unknown) {
        console.error("Error getting prompt", error);
        // TODO: Add proper error handling and user feedback
    }
};

window.onload = initializeChatGPT;
