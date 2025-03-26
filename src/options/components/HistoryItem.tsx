import { formatDistanceToNow } from "date-fns";
import { enUS, ko } from "date-fns/locale";
import { Clock } from "lucide-react";
import React, { useMemo } from "react";
import { getVideoThumbnailUrl } from "../../data.js";
import { HistoryItem as HistoryItemType } from "../../types.js";

const getLocale = () => {
    const language = chrome.i18n.getUILanguage();
    return language.startsWith("ko") ? ko : enUS;
};

interface HistoryItemProps {
    item: HistoryItemType;
    isLastItem: boolean;
    lastItemRef: React.RefObject<HTMLDivElement | null>;
}

export const HistoryItem: React.FC<HistoryItemProps> = React.memo(
    ({ item, isLastItem, lastItemRef }) => {
        const locale = useMemo(() => getLocale(), []);
        const formattedDate = useMemo(
            () =>
                formatDistanceToNow(new Date(item.timestamp), {
                    addSuffix: true,
                    locale,
                }),
            [item.timestamp, locale]
        );

        return (
            <div className="history-item" ref={isLastItem ? lastItemRef : undefined}>
                <div className="history-video">
                    <a
                        href={`https://www.youtube.com/watch?v=${item.videoInfo.id}`}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <div className="video-info">
                            <img
                                src={getVideoThumbnailUrl(item.videoInfo)}
                                alt={item.videoInfo.title}
                                className="history-thumbnail"
                            />
                            <div className="text-container">
                                <div className="title">{item.videoInfo.title}</div>
                            </div>
                        </div>
                    </a>
                </div>
                <div className="history-question">{item.question}</div>
                <div className="history-footer">
                    <div className="history-timestamp">
                        <Clock className="icon" size={16} strokeWidth={1.5} />
                        {formattedDate}
                    </div>
                    {item.answerUrl && (
                        <button
                            onClick={() => window.open(item.answerUrl, "_blank")}
                            className="answer-button"
                        >
                            {chrome.i18n.getMessage("viewAnswer")}
                        </button>
                    )}
                </div>
            </div>
        );
    }
);
