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

export function QuestionDialog({ initialVideoInfo }: { initialVideoInfo: VideoInfoType }) {
    const [videoInfo] = useState(initialVideoInfo);

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
                <Inclusions videoInfo={videoInfo} />
                <QuestionForm videoInfo={videoInfo} />
                <QuestionSuggestions videoInfo={videoInfo} />
            </div>
        </ytd-unified-share-panel-renderer>
    );
}
