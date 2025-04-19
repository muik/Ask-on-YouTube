import { useEffect, useState } from "react";
import { VideoInfo as VideoInfoType } from "../../../types";
import { getContainerElement } from "./container";
import { hideQuestionDialog } from "./dialogManager";
import { repositionDialog } from "./positionManager";
import { QuestionForm } from "./QuestionForm";
import { QuestionSuggestions } from "./QuestionSuggestions";
import { VideoInfo } from "./VideoInfo";

export function QuestionDialog({ initialVideoInfo }: { initialVideoInfo: VideoInfoType }) {
    const questionDialogTitle = chrome.i18n.getMessage("questionDialogTitle");
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
        <ytd-unified-share-panel-renderer
            className="style-scope ytd-popup-container"
            tabIndex={-1}
            links-only="true"
            can-post=""
        >
            <yt-icon-button
                id="close-button"
                className="style-scope ytd-unified-share-panel-renderer"
                role="button"
                aria-label="취소"
                onClick={hideQuestionDialog}
            >
                <button id="button" className="style-scope yt-icon-button" aria-label="취소">
                    <yt-icon icon="close" className="style-scope ytd-unified-share-panel-renderer">
                        <span className="yt-icon-shape style-scope yt-icon yt-spec-icon-shape">
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    display: "block",
                                    fill: "currentcolor",
                                }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    enableBackground="new 0 0 24 24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    width="24"
                                    focusable="false"
                                    aria-hidden="true"
                                    style={{
                                        pointerEvents: "none",
                                        display: "inherit",
                                        width: "100%",
                                        height: "100%",
                                    }}
                                >
                                    <path d="m12.71 12 8.15 8.15-.71.71L12 12.71l-8.15 8.15-.71-.71L11.29 12 3.15 3.85l.71-.71L12 11.29l8.15-8.15.71.71L12.71 12z" />
                                </svg>
                            </div>
                        </span>
                    </yt-icon>
                </button>
                <yt-interaction id="interaction" className="circular style-scope yt-icon-button">
                    <div className="stroke style-scope yt-interaction" />
                    <div className="fill style-scope yt-interaction" />
                </yt-interaction>
            </yt-icon-button>
            <yt-share-panel-header-renderer
                id="share-panel-header"
                className="style-scope ytd-unified-share-panel-renderer"
            >
                <div id="title-bar" className="style-scope yt-share-panel-header-renderer">
                    <div id="title" className="style-scope yt-share-panel-header-renderer">
                        <yt-share-panel-title-v15-renderer className="style-scope yt-share-panel-header-renderer">
                            <h2
                                id="title"
                                className="style-scope yt-share-panel-title-v15-renderer"
                            >
                                {questionDialogTitle}
                            </h2>
                        </yt-share-panel-title-v15-renderer>
                    </div>
                </div>
            </yt-share-panel-header-renderer>
            <div id="contents" className="style-scope ytd-unified-share-panel-renderer">
                <VideoInfo videoInfo={videoInfo} />
                <div id="inclusion-container" />
                <QuestionForm videoInfo={videoInfo} />
                <QuestionSuggestions videoInfo={videoInfo} />
            </div>
        </ytd-unified-share-panel-renderer>
    );
}
