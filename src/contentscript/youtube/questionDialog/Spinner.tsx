import Config from "../../../config";

export function Spinner() {
    const SPINNER_HEIGHT = 37 * Config.MAX_QUESTIONS_COUNT;

    return (
        <div
            id="spinner"
            className="style-scope ytd-unified-share-panel-renderer"
            style={{ height: `${SPINNER_HEIGHT}px` }}
        >
            <tp-yt-paper-spinner
                className="style-scope ytd-unified-share-panel-renderer"
                aria-label="loading"
                active=""
            >
                <div id="spinnerContainer" className="active style-scope tp-yt-paper-spinner">
                    {[1, 2, 3, 4].map(layer => (
                        <div
                            key={layer}
                            className={`spinner-layer layer-${layer} style-scope tp-yt-paper-spinner`}
                        >
                            <div className="circle-clipper left style-scope tp-yt-paper-spinner">
                                <div className="circle style-scope tp-yt-paper-spinner" />
                            </div>
                            <div className="circle-clipper right style-scope tp-yt-paper-spinner">
                                <div className="circle style-scope tp-yt-paper-spinner" />
                            </div>
                        </div>
                    ))}
                </div>
            </tp-yt-paper-spinner>
        </div>
    );
} 