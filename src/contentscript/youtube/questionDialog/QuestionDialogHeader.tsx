export function QuestionDialogHeader() {
    const questionDialogTitle = chrome.i18n.getMessage("questionDialogTitle");

    return (
        <yt-share-panel-header-renderer
            id="share-panel-header"
            className="style-scope ytd-unified-share-panel-renderer"
        >
            <div id="title-bar" className="style-scope yt-share-panel-header-renderer">
                <div id="title" className="style-scope yt-share-panel-header-renderer">
                    <yt-share-panel-title-v15-renderer className="style-scope yt-share-panel-header-renderer">
                        <h2 id="title" className="style-scope yt-share-panel-title-v15-renderer">
                            {questionDialogTitle}
                        </h2>
                    </yt-share-panel-title-v15-renderer>
                </div>
            </div>
        </yt-share-panel-header-renderer>
    );
}
