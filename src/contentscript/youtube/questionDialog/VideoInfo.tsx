import { useEffect, useRef } from "react";
import { getVideoThumbnailUrl } from "../../../data.js";
import { VideoInfo as VideoInfoType } from "../../../types";
import { loadCaption, loadCaptionError } from "./caption.js";
import { textToInputClickListener } from "./textToInputClickListener";
import { getTitleTokens, setTitleToken } from "./titleToken.js";

export function VideoInfo({ videoInfo }: { videoInfo: VideoInfoType }) {
    const titleElementRef = useRef<HTMLDivElement>(null);
    const thumbnailElementRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (!titleElementRef.current || !videoInfo) {
            return;
        }

        const titleTokens = getTitleTokens(videoInfo.title);
        titleTokens.forEach(setTitleToken(titleElementRef.current));
    }, [titleElementRef, videoInfo]);

    useEffect(() => {
        if (!thumbnailElementRef.current || !videoInfo) {
            return;
        }

        thumbnailElementRef.current.setAttribute("src", getVideoThumbnailUrl(videoInfo));
    }, [thumbnailElementRef, videoInfo]);

    return (
        <div className="video-info">
            <img
                ref={thumbnailElementRef}
                className="thumbnail"
                crossOrigin="anonymous"
                onLoad={loadCaption}
                onError={loadCaptionError}
            />
            <div className="text-container">
                <div ref={titleElementRef} className="title" />
                <span className="caption inputable" onClick={textToInputClickListener} />
            </div>
        </div>
    );
}
