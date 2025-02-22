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

export function getVideoThumbnailUrl(videoInfo) {
    if (!videoInfo) {
        throw new Error("No videoInfo received.");
    }
    if (videoInfo.thumbnail) {
        return videoInfo.thumbnail;
    }
    return `https://i.ytimg.com/vi/${videoInfo.id}/hqdefault.jpg`;
}
