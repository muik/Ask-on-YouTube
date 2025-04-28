/**
 * Extracts the video ID from the URL.
 * the URL is like https://www.youtube.com/watch?v=VIDEO_ID
 * or https://www.youtube.com/shorts/VIDEO_ID
 * @param url - The URL.
 * @returns The video ID. If null, this is not the correct type of element and other options need to be considered.
 */
export function getVideoIdFromUrl(url: string): string | null {
    const urlObj = new URL(url);
    if (urlObj.searchParams.has("v")) {
        return urlObj.searchParams.get("v");
    }
    if (urlObj.pathname.startsWith("/shorts/")) {
        return urlObj.pathname.split("/")[2];
    }
    return null;
}

/**
 * Pauses the video player of the video page.
 */
export function pauseVideoPlayer(): void {
    const videoPlayer = document.querySelector<HTMLVideoElement>("video.html5-main-video[src]");
    if (videoPlayer) {
        videoPlayer.pause();
    }
}
