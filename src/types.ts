export interface VideoInfo {
    id: string;
    title: string;
    caption: string;
}

export interface HistoryItem {
    videoInfo: VideoInfo;
    question: string;
    timestamp: string;
} 