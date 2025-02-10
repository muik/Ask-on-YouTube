export function validateVideoInfo(videoInfo) {
    if (!videoInfo) {
        throw new Error("No videoInfo received.");
    }
    if (!videoInfo.id) {
        throw new Error("No videoId received.");
    }
    if (!videoInfo.title) {
        throw new Error("No videoTitle received.");
    }
}
