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