import { VideoInfo } from "../types";
import { Targets, BackgroundActions } from "../constants";
import { SharedQuestionFormData } from "../types";

export interface SetPromptRequest extends SharedQuestionFormData {
    action: BackgroundActions.SET_PROMPT;
    target: Targets;
    videoInfo: VideoInfo;
    question: string;
    langCode: string;
    type?: string; // placeholder
}

export interface SetPromptResponse {
    targetUrl?: string;
    error?: {
        code?: string;
        message: string;
    };
}
