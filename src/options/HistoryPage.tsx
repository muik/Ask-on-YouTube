import { formatDistanceToNow } from "date-fns";
import { enUS, ko } from "date-fns/locale";
import { Clock } from "lucide-react";
import React, { useEffect, useState } from "react";
import { getQuestionHistory } from "../background/questionHistory.js";
import "../css/settings.css";
import { getVideoThumbnailUrl } from "../data.js";
import { HistoryItem } from "../types.js";

const HistoryPage: React.FC = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
        setMessages();
    }, []);

    const loadHistory = async () => {
        try {
            const historyItems = await getQuestionHistory();
            setHistory(historyItems.reverse());
        } catch (error) {
            console.error("Failed to load history:", error);
        } finally {
            setLoading(false);
        }
    };

    const setMessages = () => {
        document.title = `${chrome.i18n.getMessage(
            "history"
        )} - ${chrome.i18n.getMessage("shortExtensionName")}`;
    };

    const getLocale = () => {
        const language = chrome.i18n.getUILanguage();
        return language.startsWith("ko") ? ko : enUS;
    };

    if (loading) {
        return (
            <div className="loading">
                {chrome.i18n.getMessage("loading")}
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="no-history">
                {chrome.i18n.getMessage("noHistory")}
            </div>
        );
    }

    return (
        <div className="container">
            <h2>{chrome.i18n.getMessage("history")}</h2>
            <div className="history-list">
                {history.map((item, index) => (
                    <div key={index} className="history-item">
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
                        <div className="history-question">
                            {item.question}
                        </div>
                        <div className="history-timestamp">
                            <Clock className="icon" size={16} strokeWidth={1.5} />
                            {formatDistanceToNow(new Date(item.timestamp), {
                                addSuffix: true,
                                locale: getLocale(),
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HistoryPage; 