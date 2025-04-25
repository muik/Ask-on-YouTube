import React from "react";
import { UseInclusionsServiceReturn } from "./useInclusionsService";
import { UseCommentsServiceReturn } from "./useCommentsService";

interface InclusionsProps {
    inclusionsService: UseInclusionsServiceReturn;
    commentsService: UseCommentsServiceReturn;
}

export const Inclusions: React.FC<InclusionsProps> = ({ inclusionsService, commentsService }) => {
    if (!inclusionsService.isEnabled) {
        return <></>;
    }

    return (
        <div>
            <label>
                <input
                    type="checkbox"
                    checked={inclusionsService.inclusions.transcript}
                    onChange={() => inclusionsService.toggleInclusion("transcript")}
                />
                <span>Transcript</span>
            </label>
            <div className="flex items-center justify-between">
                <label>
                    <input
                        type="checkbox"
                        checked={inclusionsService.inclusions.comments}
                        disabled={commentsService.totalCommentsCount === 0}
                        onChange={() => inclusionsService.toggleInclusion("comments")}
                    />
                    <span>
                        Comments{" "}
                        {getCommentsCountText(
                            commentsService.totalCommentsCount,
                            commentsService.commentsCount,
                            commentsService.isAllCommentsLoaded,
                            inclusionsService.inclusions.comments
                        )}
                    </span>
                </label>
                {inclusionsService.inclusions.comments &&
                    commentsService.isAllCommentsLoaded === false &&
                    (commentsService.isCommentsLoading ? (
                        <button onClick={commentsService.handleStopLoadingComments}>
                            Stop Loading
                        </button>
                    ) : (
                        <button onClick={commentsService.handleLoadMoreComments}>Load More</button>
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
