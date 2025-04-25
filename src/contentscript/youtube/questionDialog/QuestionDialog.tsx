import { useEffect, useState } from "react";
import { VideoInfo as VideoInfoType } from "../../../types";
import { CloseButton } from "./CloseButton";
import { getContainerElement } from "./container";
import { hideQuestionDialog } from "./dialogManager";
import { Inclusions } from "./Inclusions";
import { repositionDialog } from "./positionManager";
import { QuestionDialogHeader } from "./QuestionDialogHeader";
import { QuestionForm } from "./QuestionForm";
import { QuestionSuggestions } from "./QuestionSuggestions";
import { VideoInfo } from "./VideoInfo";
import { useInclusionsService } from "./useInclusionsService";
import { useCommentsService } from "./useCommentsService";

export function QuestionDialog({ initialVideoInfo }: { initialVideoInfo: VideoInfoType }) {
    const [videoInfo] = useState(initialVideoInfo);
    const inclusionsService = useInclusionsService(videoInfo, {
        transcript: true,
        comments: false,
    });
    const commentsService = useCommentsService(
        inclusionsService.isEnabled,
        inclusionsService.inclusions.comments
    );

    const onEscapeKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
            hideQuestionDialog();
        }
    };
    const onResize = () => {
        repositionDialog(getContainerElement());
    };

    useEffect(() => {
        window.addEventListener("keydown", onEscapeKeyDown);
        window.addEventListener("resize", onResize);

        repositionDialog(getContainerElement());

        return () => {
            window.removeEventListener("keydown", onEscapeKeyDown);
            window.removeEventListener("resize", onResize);
        };
    }, []);

    return (
        <ytd-unified-share-panel-renderer className="style-scope ytd-popup-container">
            <CloseButton />
            <QuestionDialogHeader />
            <div id="contents" className="style-scope ytd-unified-share-panel-renderer">
                <VideoInfo videoInfo={videoInfo} />
                <Inclusions
                    inclusionsService={inclusionsService}
                    commentsService={commentsService}
                />
                <QuestionForm
                    videoInfo={videoInfo}
                    sharedFormData={{
                        inclusions: inclusionsService.inclusions,
                        comments: commentsService.comments,
                    }}
                    isCommentsLoading={commentsService.isCommentsLoading}
                />
                <QuestionSuggestions videoInfo={videoInfo} />
            </div>
        </ytd-unified-share-panel-renderer>
    );
}
