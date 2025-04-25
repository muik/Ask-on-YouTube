import { useEffect, useState } from "react";
import { ObserverManager } from "../../observer";
import {
    scrollForLoadingComments,
    validateTotalCommentsCount,
    watchCommentsExpanded,
} from "../elements/comments";
import { traverseCommentElements } from "../elements/traverse-comments";
import { loadTotalCommentsHeadCount } from "../elements/commentsHeadCount";
import { Comment } from "../../../types";
import { pauseVideoPlayer } from "../utils";

export interface UseCommentsServiceReturn {
    isAllCommentsLoaded: boolean;
    totalCommentsCount: number | undefined;
    commentsCount: number;
    handleLoadMoreComments: () => void;
    handleStopLoadingComments: () => void;
    isCommentsLoading: boolean;
    comments: Comment[];
}

export function useCommentsService(
    isEnabled: boolean,
    isCommentsChecked: boolean
): UseCommentsServiceReturn {
    const [headCommentsCount, setHeadCommentsCount] = useState<number | undefined>(undefined);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentsCount, setCommentsCount] = useState(0);
    const [isAllCommentsLoaded, setIsAllCommentsLoaded] = useState<boolean>(false);
    const [isCommentsExpanded, setIsCommentsExpanded] = useState<boolean>(false);
    const [isCommentsLoading, setIsCommentsLoading] = useState<boolean>(false);
    const [cursorThread, setCursorThread] = useState<Element | null>(null);
    const [abortController, setAbortController] = useState<AbortController | null>(null);
    const [startTime, setStartTime] = useState<number | null>(null);

    const observerManager = new ObserverManager();

    useEffect(() => {
        return () => {
            observerManager.cleanupAll();
            abortController?.abort();
        };
    }, []);

    useEffect(() => {
        if (isEnabled) {
            loadTotalCommentsHeadCount(setHeadCommentsCount, observerManager);
        }
    }, [isEnabled]);

    useEffect(() => {
        if (isCommentsChecked) {
            if (!isAllCommentsLoaded) {
                // set start time
                const startTime = Date.now();
                setStartTime(startTime);
            } else if (startTime) {
                // set end time
                const endTime = Date.now();
                const duration = endTime - startTime;
                console.debug("comments loading duration (seconds)", duration / 1000);
            }
        }
    }, [isCommentsChecked, isAllCommentsLoaded]);

    // when comments are enabled, scroll to the comments element
    useEffect(() => {
        if (!isCommentsChecked || commentsCount) {
            // when there are already comments, do not load more comments automatically
            return;
        }
        if (headCommentsCount === undefined) {
            setIsCommentsLoading(true);
            scrollForLoadingComments();
            return;
        }
        if (headCommentsCount === 0) {
            setIsAllCommentsLoaded(true);
            return;
        }

        setIsCommentsLoading(true);
        const abortController = new AbortController();
        setAbortController(abortController);

        const { newCursorThread, newCommentsCount, newComments, isAllCommentsLoaded } =
            traverseCommentElements(cursorThread);
        console.debug(
            "first traverseCommentElements",
            newCursorThread,
            newCommentsCount,
            newComments,
            isAllCommentsLoaded
        );

        setCursorThread(newCursorThread);
        setComments(comments => [...comments, ...newComments]);
        setCommentsCount(count => count + newCommentsCount);
        setIsAllCommentsLoaded(isAllCommentsLoaded);

        if (!isAllCommentsLoaded && !abortController.signal.aborted) {
            watchCommentsExpanded(observerManager, setIsCommentsExpanded, abortController.signal);
            pauseVideoPlayer();
        } else {
            setIsCommentsLoading(false);
        }
    }, [isCommentsChecked, headCommentsCount]);

    useEffect(() => {
        console.debug("isCommentsExpanded", isCommentsExpanded);
        if (isCommentsExpanded && abortController && !abortController.signal.aborted) {
            const { newCursorThread, newCommentsCount, newComments, isAllCommentsLoaded } =
                traverseCommentElements(cursorThread);
            console.debug(
                "next traverseCommentElements",
                newCursorThread,
                newCommentsCount,
                newComments,
                isAllCommentsLoaded
            );
            setCursorThread(newCursorThread);
            setComments(comments => [...comments, ...newComments]);
            setCommentsCount(count => count + newCommentsCount);
            setIsAllCommentsLoaded(isAllCommentsLoaded);

            if (!isAllCommentsLoaded && !abortController.signal.aborted) {
                watchCommentsExpanded(
                    observerManager,
                    setIsCommentsExpanded,
                    abortController.signal
                );
            } else {
                setIsCommentsLoading(false);
            }
        }
    }, [isCommentsExpanded, abortController]);

    useEffect(() => {
        if (isAllCommentsLoaded) {
            validateTotalCommentsCount();
        }
    }, [isAllCommentsLoaded]);

    const handleLoadMoreComments = () => {
        const abortController = new AbortController();
        setAbortController(abortController);
        setIsCommentsExpanded(true);
        setIsCommentsLoading(true);
    };

    const handleStopLoadingComments = () => {
        abortController?.abort();
        setIsCommentsExpanded(false);
        setIsCommentsLoading(false);
    };

    return {
        isAllCommentsLoaded,
        totalCommentsCount: headCommentsCount,
        commentsCount,
        handleLoadMoreComments,
        handleStopLoadingComments,
        isCommentsLoading,
        comments,
    };
}
