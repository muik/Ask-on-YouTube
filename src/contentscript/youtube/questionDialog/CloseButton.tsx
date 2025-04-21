import { hideQuestionDialog } from "./dialogManager";

export function CloseButton() {
    return (
        <yt-icon-button
            id="close-button"
            className="style-scope ytd-unified-share-panel-renderer"
            role="button"
            aria-label="Cancel"
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
        </yt-icon-button>
    );
}
