import React, { useCallback, useEffect, useRef, useState } from "react";
import { getQuestionHistoryWithPagination } from "../background/questionHistory.js";
import { BackgroundActions } from "../constants.js";
import "../css/options.css";
import { HistoryItem as HistoryItemType } from "../types.js";
import { HistoryItem } from "./components/HistoryItem";

const PAGE_SIZE = 15;

const LoadingState: React.FC = () => (
    <div className="loading">{chrome.i18n.getMessage("loading")}</div>
);

const EmptyState: React.FC = () => (
    <div className="no-history">{chrome.i18n.getMessage("noHistory")}</div>
);

const LoadingMoreIndicator: React.FC = () => (
    <div className="loading-more">{chrome.i18n.getMessage("loading")}</div>
);

const HistoryPage: React.FC = () => {
    const [history, setHistory] = useState<HistoryItemType[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const observer = useRef<IntersectionObserver | null>(null);
    const lastItemRef = useRef<HTMLDivElement>(null);

    const loadHistory = useCallback(async () => {
        try {
            const { items, hasMore: more } = await getQuestionHistoryWithPagination(PAGE_SIZE);
            setHistory(items);
            setHasMore(more);
        } catch (error) {
            console.error("Failed to load history:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMore) return;

        try {
            setLoadingMore(true);
            const lastItem = history[history.length - 1];
            const { items, hasMore: more } = await getQuestionHistoryWithPagination(
                PAGE_SIZE,
                Date.parse(lastItem.timestamp)
            );
            setHistory(prev => [...prev, ...items]);
            setHasMore(more);
        } catch (error) {
            console.error("Failed to load more history:", error);
        } finally {
            setLoadingMore(false);
        }
    }, [history, hasMore, loadingMore]);

    useEffect(() => {
        loadHistory();
        document.title = `${chrome.i18n.getMessage("history")} - ${chrome.i18n.getMessage(
            "shortExtensionName"
        )}`;

        // Listen for messages from background script
        const messageListener = (message: any) => {
            if (message.action === BackgroundActions.HISTORY_CHANGED) {
                loadHistory();
            }
        };

        chrome.runtime.onMessage.addListener(messageListener);

        return () => {
            chrome.runtime.onMessage.removeListener(messageListener);
        };
    }, [loadHistory]);

    useEffect(() => {
        if (loading || loadingMore) return;

        observer.current = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loadingMore) {
                    loadMore();
                }
            },
            { threshold: 0.5 }
        );

        if (lastItemRef.current) {
            observer.current.observe(lastItemRef.current);
        }

        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, [history, hasMore, loadingMore, loadMore]);

    if (loading) {
        return <LoadingState />;
    }

    if (history.length === 0) {
        return <EmptyState />;
    }

    return (
        <div className="container">
            <h2>{chrome.i18n.getMessage("history")}</h2>
            <div className="history-list">
                {history.map((item, index) => (
                    <HistoryItem
                        key={index}
                        item={item}
                        isLastItem={index === history.length - 1}
                        lastItemRef={lastItemRef}
                    />
                ))}
                {loadingMore && <LoadingMoreIndicator />}
            </div>
        </div>
    );
};

export default HistoryPage;
