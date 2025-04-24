import { useEffect, useState } from "react";
import { ObserverManager } from "../../observer";
import {
    scrollForLoadingComments,
    traverseCommentElements,
    validateTotalCommentsCount,
    watchCommentsExpanded,
} from "../elements/comments";
import { loadTotalCommentsHeadCount } from "../elements/commentsHeadCount";
import { Comment } from "../../../types";

interface UseCommentsServiceReturn {
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

    // when comments are enabled, scroll to the comments element
    useEffect(() => {
        if (!isCommentsChecked || commentsCount) {
            // when there are already comments, do not load more comments automatically
            return;
        }
        if (headCommentsCount === undefined) {
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
            isAllCommentsLoaded,
            abortController.signal.aborted
        );
        setCursorThread(newCursorThread);
        setComments(comments => [...comments, ...newComments]);
        setCommentsCount(count => count + newCommentsCount);
        setIsAllCommentsLoaded(isAllCommentsLoaded);

        if (!isAllCommentsLoaded && !abortController.signal.aborted) {
            watchCommentsExpanded(observerManager, setIsCommentsExpanded, abortController.signal);
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
                isAllCommentsLoaded,
                abortController.signal.aborted
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
