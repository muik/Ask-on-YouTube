import Config from "../config";
import { BackgroundActions, Targets } from "../constants";
import { PromptData } from "../types";
import { handlePromptResponse } from "./chatgpt/prompt";

interface BackgroundMessage {
    action: BackgroundActions;
    target: Targets;
}

interface PromptResponse {
    promptData: PromptData;
}

window.onload = async (): Promise<void> => {
    // If opened by the extension, insert the prompt
    if (
        window.location.hostname !== "chatgpt.com" ||
        window.location.search !== `?ref=${Config.REF_CODE}`
    ) {
        return;
    }

    try {
        // get prompt from background.js
        const response = await chrome.runtime.sendMessage<BackgroundMessage, PromptResponse>({
            action: BackgroundActions.GET_PROMPT,
            target: Targets.CHATGPT,
        });

        handlePromptResponse(response);
    } catch (error: unknown) {
        console.error("Error getting prompt", error);
    }
};
