import React from "react";
import { VideoInfo } from "../../../types";
import { useInclusionsService } from "./useInclusionsService";
import { useCommentsService } from "./useCommentsService";

interface InclusionsProps {
    videoInfo: VideoInfo;
    onInclusionsChange?: (inclusions: { transcript: boolean; comments: boolean }) => void;
}

export const Inclusions: React.FC<InclusionsProps> = ({ videoInfo, onInclusionsChange }) => {
    const { isEnabled, inclusions, toggleInclusion } = useInclusionsService(
        videoInfo,
        { transcript: true, comments: false },
        onInclusionsChange
    );

    const {
        isAllCommentsLoaded,
        totalCommentsCount,
        commentsCount,
        handleLoadMoreComments,
        handleStopLoadingComments,
        isCommentsLoading,
    } = useCommentsService(isEnabled, inclusions.comments);

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
                        disabled={totalCommentsCount === 0}
                        onChange={() => toggleInclusion("comments")}
                    />
                    <span>
                        Comments{" "}
                        {getCommentsCountText(
                            totalCommentsCount,
                            commentsCount,
                            isAllCommentsLoaded,
                            inclusions.comments
                        )}
                    </span>
                </label>
                {inclusions.comments &&
                    isAllCommentsLoaded === false &&
                    (isCommentsLoading ? (
                        <button onClick={handleStopLoadingComments}>Stop Loading</button>
                    ) : (
                        <button onClick={handleLoadMoreComments}>Load More</button>
                    ))}
            </div>
        </div>
    );
};

function getCommentsCountText(
    totalCommentsCount: number | undefined,
    commentsCount: number,
    isAllCommentsLoaded: boolean,
    isCommentsChecked: boolean
): string {
    if (totalCommentsCount === undefined || totalCommentsCount === 0) {
        return "";
    }
    if (!isCommentsChecked && !commentsCount) {
        return `(${totalCommentsCount.toLocaleString()})`;
    }
    if (isAllCommentsLoaded || commentsCount >= totalCommentsCount) {
        return `(${commentsCount.toLocaleString()})`;
    }
    return `(${commentsCount.toLocaleString()} / ${totalCommentsCount.toLocaleString()})`;
}
