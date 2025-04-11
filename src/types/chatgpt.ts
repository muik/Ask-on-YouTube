import { BackgroundActions, Targets } from "../constants";
import { PromptData } from "../types";

export interface BackgroundMessage {
    action: BackgroundActions;
    target: Targets;
}

export interface PromptResponse {
    promptData: PromptData;
} 