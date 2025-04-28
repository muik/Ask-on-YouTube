import React from "react";
import { UseInclusionsServiceReturn } from "./useInclusionsService";
import { UseCommentsServiceReturn } from "./useCommentsService";
import Config from "../../../config";

interface InclusionsProps {
    inclusionsService: UseInclusionsServiceReturn;
    commentsService: UseCommentsServiceReturn;
}

export const Inclusions: React.FC<InclusionsProps> = ({ inclusionsService, commentsService }) => {
    if (!Config.INCLUSIONS_ENABLED || !inclusionsService.isEnabled) {
        return <></>;
    }

    return (
        <div className="inclusions">
            <label>
                <input
                    type="checkbox"
                    checked={inclusionsService.inclusions.transcript}
                    onChange={() => inclusionsService.toggleInclusion("transcript")}
                />
                <span>{chrome.i18n.getMessage("transcriptLabelName")}</span>
            </label>
            <label>
                <input
                    type="checkbox"
                    checked={inclusionsService.inclusions.comments}
                    disabled={commentsService.totalCommentsCount === 0}
                    onChange={() => inclusionsService.toggleInclusion("comments")}
                />
                <span>
                    {chrome.i18n.getMessage("commentsLabelName")}{" "}
                    <span className="comments-count">
                        {getCommentsCountText(
                            commentsService.totalCommentsCount,
                            commentsService.commentsCount,
                            commentsService.isAllCommentsLoaded,
                            inclusionsService.inclusions.comments
                        )}
                    </span>
                </span>
            </label>
            {inclusionsService.inclusions.comments &&
                commentsService.isAllCommentsLoaded === false &&
                (commentsService.isCommentsLoading ? (
                    <button onClick={commentsService.handleStopLoadingComments}>
                        {chrome.i18n.getMessage("stopLoadingButtonName")}
                    </button>
                ) : (
                    <button onClick={commentsService.handleLoadMoreComments}>
                        {chrome.i18n.getMessage("loadMoreButtonName")}
                    </button>
                ))}
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
