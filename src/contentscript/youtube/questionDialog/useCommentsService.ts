import { useEffect, useState, useRef } from "react";
import { ObserverManager } from "../../observer";
import {
    scrollForLoadingComments,
    validateTotalCommentsCount,
} from "../elements/comments";
import { watchCommentsExpanded } from "../elements/comments/observe";
import { traverseCommentElements } from "../elements/comments/traverse";
import { loadTotalCommentsHeadCount } from "../elements/comments/header";
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

    // Stable refs that don't trigger re-renders
    const observerManagerRef = useRef<ObserverManager>(new ObserverManager());
    const abortControllerRef = useRef<AbortController | null>(null);
    const cursorThreadRef = useRef<Element | null>(null);
    const startTimeRef = useRef<number | null>(null);

    // Cleanup effect
    useEffect(() => {
        return () => {
            observerManagerRef.current.cleanupAll();
            abortControllerRef.current?.abort();
        };
    }, []);

    // Load head comments count
    useEffect(() => {
        if (isEnabled) {
            loadTotalCommentsHeadCount(setHeadCommentsCount, observerManagerRef.current);
        }
    }, [isEnabled]);

    // Handle comments checked state
    useEffect(() => {
        if (!isCommentsChecked) {
            handleStopLoadingComments();
        }
    }, [isCommentsChecked]);

    // Debug timing effect
    useEffect(() => {
        if (!isCommentsChecked) {
            return;
        }
        if (!isAllCommentsLoaded) {
            startTimeRef.current = Date.now();
        } else if (startTimeRef.current) {
            const endTime = Date.now();
            const duration = endTime - startTimeRef.current;
            startTimeRef.current = null;
            console.debug("comments loading duration (seconds)", duration / 1000);
        }
    }, [isCommentsChecked, isAllCommentsLoaded]);

    // when comments are checked, scroll to the comments element
    useEffect(() => {
        if (!isCommentsChecked || commentsCount) {
            // when there are already comments, do not load more comments automatically
            return;
        }
        if (headCommentsCount === undefined) {
            setIsCommentsLoading(true);
            abortControllerRef.current = new AbortController();
            scrollForLoadingComments();
            return;
        }
        if (headCommentsCount === 0) {
            setIsAllCommentsLoaded(true);
            return;
        }

        // if the abort controller is aborted, after the head comments are loaded, stop
        if (abortControllerRef.current && abortControllerRef.current.signal.aborted) {
            abortControllerRef.current = null;
            console.debug("abortControllerRef.current.signal.aborted");
            return;
        }

        handleLoadMoreComments();
    }, [isCommentsChecked, headCommentsCount]);

    // Handle expanded comments
    useEffect(() => {
        const controller = abortControllerRef.current;
        if (!isCommentsExpanded || !controller || controller.signal.aborted) {
            return;
        }

        const processComments = async () => {
            const result = await traverseCommentElements(cursorThreadRef.current);
            cursorThreadRef.current = result.newCursorThread;
            
            // Update state
            setComments(prevComments => [...prevComments, ...result.newComments]);
            setCommentsCount(prevCount => prevCount + result.newCommentsCount);
            setIsAllCommentsLoaded(result.isAllCommentsLoaded);

            if (!result.isAllCommentsLoaded && controller && !controller.signal.aborted) {
                watchCommentsExpanded(
                    observerManagerRef.current,
                    setIsCommentsExpanded,
                    controller.signal
                );
            } else {
                setIsCommentsLoading(false);
            }
        };

        processComments();
    }, [isCommentsExpanded]);

    // Validate comments count
    useEffect(() => {
        if (isAllCommentsLoaded) {
            // for debugging purposes
            validateTotalCommentsCount();
        }
    }, [isAllCommentsLoaded]);

    const handleLoadMoreComments = () => {
        abortControllerRef.current = new AbortController();
        setIsCommentsLoading(true);
        setIsCommentsExpanded(true);
        pauseVideoPlayer();
    };

    const handleStopLoadingComments = () => {
        abortControllerRef.current?.abort();
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
