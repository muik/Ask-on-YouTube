import React from "react";
import { VideoInfo } from "../../../types";
import { useInclusionsService } from "./useInclusionsService";
interface InclusionsProps {
    videoInfo: VideoInfo;
    onInclusionsChange?: (inclusions: { transcript: boolean; comments: boolean }) => void;
}

export const Inclusions: React.FC<InclusionsProps> = ({ videoInfo, onInclusionsChange }) => {
    const {
        isEnabled,
        inclusions,
        toggleInclusion,
        isAllCommentsLoaded,
        totalCommentsCount,
        commentsCount,
        handleLoadMoreComments,
    } = useInclusionsService(videoInfo, { transcript: true, comments: false }, onInclusionsChange);

    if (!isEnabled) {
        return <></>;
    }

    return (
        <div>
            <label>
                <input
                    type="checkbox"
                    checked={inclusions.transcript}
                    onChange={() => toggleInclusion("transcript")}
                />
                <span>Transcript</span>
            </label>
            <div className="flex items-center justify-between">
                <label>
                    <input
                        type="checkbox"
                        checked={inclusions.comments}
                        onChange={() => toggleInclusion("comments")}
                    />
                    <span>
                        Comments{" "}
                        {totalCommentsCount !== undefined &&
                            `(${commentsCount} / ${totalCommentsCount})`}
                    </span>
                </label>
                {inclusions.comments && isAllCommentsLoaded === false && (
                    <button onClick={handleLoadMoreComments}>Load More</button>
                )}
            </div>
        </div>
    );
};
