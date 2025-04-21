import { useEffect, useRef, useState } from "react";
import { getVideoThumbnailUrl } from "../../../data.js";
import { VideoInfo as VideoInfoType } from "../../../types";
import { useGeminiService } from "../geminiService.js";
import {
    CaptionStatus,
    loadCaption,
    loadCaptionError,
    setCaptionStatus,
    setCaptionUnavailable,
} from "./caption.js";
import { textToInputClickListener } from "./textToInputClickListener";
import { getTitleTokens, setTitleToken } from "./titleToken.js";

export function VideoInfo({ videoInfo }: { videoInfo: VideoInfoType }) {
    const titleElementRef = useRef<HTMLDivElement>(null);
    const thumbnailElementRef = useRef<HTMLImageElement>(null);
    const captionElementRef = useRef<HTMLSpanElement>(null);
    const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
    const {
        isNotLoaded: isGeminiServiceNotLoaded,
        isServiceUnavailable: isGeminiServiceUnavailable,
    } = useGeminiService();

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

    useEffect(() => {
        if (!thumbnailLoaded) {
            return;
        }

        const captionElement = captionElementRef.current;

        if (isGeminiServiceNotLoaded) {
            setCaptionStatus(captionElement, CaptionStatus.PENDING);
            return;
        } else if (isGeminiServiceUnavailable) {
            setCaptionUnavailable();
            return;
        }

        loadCaption(thumbnailElementRef.current, videoInfo);
    }, [isGeminiServiceNotLoaded, isGeminiServiceUnavailable, thumbnailLoaded]);

    return (
        <div className="video-info">
            <img
                ref={thumbnailElementRef}
                className="thumbnail"
                crossOrigin="anonymous"
                onLoad={() => setThumbnailLoaded(true)}
                onError={loadCaptionError}
            />
            <div className="text-container">
                <div ref={titleElementRef} className="title" />
                <span
                    ref={captionElementRef}
                    className="caption inputable"
                    onClick={textToInputClickListener}
                />
            </div>
        </div>
    );
}
