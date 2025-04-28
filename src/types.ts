export interface VideoInfo {
    id: string;
    title: string;
    caption?: string | null;
    thumbnail?: string | null;
}

export interface HistoryItem {
    videoInfo: VideoInfo;
    question: string;
    timestamp: string;
    answerUrl?: string;
}

/**
 * Prompt data for setting it from background to chatgpt content script.
 */
export interface PromptData {
    videoInfo: VideoInfo;
    transcript: string | null;
    description: string | null;
    question: string;
    langCode: string;
    commentsText?: string;
}

interface BaseComment {
    author: string;
    publishedTime: string; // ex: "1 day ago"
    text: string;
    likesCount?: number;
}

export interface Comment extends BaseComment {
    repliesCount?: number;
    replies?: BaseComment[];
}

export interface InclusionsState {
    transcript: boolean;
    comments: boolean;
}

export interface SharedQuestionFormData {
    inclusions: InclusionsState;
    comments?: Comment[];
}
