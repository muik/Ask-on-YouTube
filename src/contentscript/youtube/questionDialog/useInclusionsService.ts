import { useCallback, useEffect, useState } from "react";
import { VideoInfo } from "../../../types";
import { ObserverManager } from "../../observer";
import {
    Comment,
    loadTotalCommentsCount,
    scrollForLoadingComments,
    scrollForMoreComments,
    scrollToBottomOfCommentsContainer,
    traverseCommentElements,
    watchReplyCommentsLoaded,
} from "../elements/comments";
import { getVideoIdFromUrl } from "../utils";

export interface InclusionsState {
    transcript: boolean;
    comments: boolean;
}

interface UseInclusionsServiceReturn {
    isEnabled: boolean;
    isAllCommentsLoaded: boolean | undefined;
    totalCommentsCount: number | undefined;
    commentsCount: number;
    inclusions: InclusionsState;
    setInclusion: (key: keyof InclusionsState, value: boolean) => void;
    toggleInclusion: (key: keyof InclusionsState) => void;
    handleLoadMoreComments: () => void;
}

/**
 * Custom hook to manage inclusions state and functionality
 * @param initialInclusions - Initial state for inclusions
 * @param onInclusionsChange - Optional callback when inclusions change
 * @returns Object containing inclusions state and methods to modify it
 */
export function useInclusionsService(
    videoInfo: VideoInfo,
    initialInclusions: InclusionsState = { transcript: true, comments: true },
    onInclusionsChange?: (inclusions: InclusionsState) => void
): UseInclusionsServiceReturn {
    const [isEnabled, setIsEnabled] = useState(false);
    const [inclusions, setInclusions] = useState<InclusionsState>(initialInclusions);
    const [totalCommentsCount, setTotalCommentsCount] = useState<number | undefined>(undefined);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isAllCommentsLoaded, setIsAllCommentsLoaded] = useState<boolean | undefined>(undefined);
    const [commentsCount, setCommentsCount] = useState(0);
    const [isCommentsLoading, setIsCommentsLoading] = useState<boolean | undefined>(undefined);
    const [isReplyCommentsLoading, setIsReplyCommentsLoading] = useState<boolean | undefined>(
        undefined
    );

    const setInclusion = useCallback(
        (key: keyof InclusionsState, value: boolean) => {
            const newInclusions = {
                ...inclusions,
                [key]: value,
            };
            setInclusions(newInclusions);
            onInclusionsChange?.(newInclusions);
        },
        [inclusions, onInclusionsChange]
    );

    const toggleInclusion = useCallback(
        (key: keyof InclusionsState) => {
            setInclusion(key, !inclusions[key]);
        },
        [inclusions, setInclusion]
    );

    const observerManager = new ObserverManager();

    useEffect(() => {
        return () => {
            observerManager.cleanupAll();
        };
    }, []);

    useEffect(() => {
        // check if the current page is a youtube video page
        const isVideoPage = window.location.pathname.includes("/watch");
        if (!isVideoPage) {
            setIsEnabled(false);
            return;
        }

        // get video id from url
        const videoId = getVideoIdFromUrl(window.location.href);
        setIsEnabled(videoInfo.id === videoId);
    }, []);

    useEffect(() => {
        if (!isEnabled) {
            return;
        }

        loadTotalCommentsCount(setTotalCommentsCount, observerManager);
    }, [isEnabled]);

    // when comments are enabled, scroll to the comments element
    useEffect(() => {
        if (inclusions.comments) {
            if (totalCommentsCount === undefined) {
                scrollForLoadingComments();
            }
        }
    }, [inclusions.comments]);

    const [postponedThread, setPostponedThread] = useState<Element | null>(null);

    // when the total comments count changes, get the comments
    useEffect(() => {
        if (totalCommentsCount === undefined) {
            return;
        }
        if (totalCommentsCount === 0) {
            setIsAllCommentsLoaded(true);
            return;
        }

        const { newPostponedThread, newCommentsCount, newComments } = traverseCommentElements(null);
        console.debug(
            "first traverseCommentElements",
            newPostponedThread,
            newCommentsCount,
            newComments
        );
        setPostponedThread(newPostponedThread);
        setComments(comments => [...comments, ...newComments]);
        setCommentsCount(count => count + newCommentsCount);

        watchReplyCommentsLoaded(observerManager, setIsCommentsLoading);
        // setComments(getComments());
        // setIsAllCommentsLoaded(getIsAllCommentsLoaded());
        // watchCommentsLoaded(
        //     observerManager,
        //     setComments,
        //     setIsAllCommentsLoaded,
        //     setIsCommentsLoading
        // );
    }, [totalCommentsCount]);

    useEffect(() => {
        // setCommentsCount(comments.length);
    }, [comments]);

    useEffect(() => {
        // TODO
        if (isCommentsLoading === false) {
            // expandReplyComments();
            // scrollToBottomOfCommentsContainer();
            // scrollUntilReplyCommentsLoaded(observerManager, setIsReplyCommentsLoading);
            const { newPostponedThread, newCommentsCount, newComments } =
                traverseCommentElements(postponedThread);
            console.debug(
                "next traverseCommentElements",
                newPostponedThread,
                newCommentsCount,
                newComments
            );
            setPostponedThread(newPostponedThread);
            setComments(comments => [...comments, ...newComments]);
            setCommentsCount(count => count + newCommentsCount);

            if (newPostponedThread) {
                watchReplyCommentsLoaded(observerManager, setIsCommentsLoading);
            } else {
                scrollToBottomOfCommentsContainer();
            }
        }
    }, [isCommentsLoading]);

    useEffect(() => {
        console.debug("isReplyCommentsLoading", isReplyCommentsLoading);
    }, [isReplyCommentsLoading]);

    const handleLoadMoreComments = () => {
        scrollForMoreComments();
    };

    return {
        isEnabled,
        isAllCommentsLoaded,
        totalCommentsCount,
        commentsCount,
        inclusions,
        setInclusion,
        toggleInclusion,
        handleLoadMoreComments,
    };
}
