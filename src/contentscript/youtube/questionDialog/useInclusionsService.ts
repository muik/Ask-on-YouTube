import { useCallback, useEffect, useState } from "react";
import { VideoInfo, InclusionsState } from "../../../types";
import { getVideoIdFromUrl } from "../utils";

export interface UseInclusionsServiceReturn {
    isEnabled: boolean;
    inclusions: InclusionsState;
    setInclusion: (key: keyof InclusionsState, value: boolean) => void;
    toggleInclusion: (key: keyof InclusionsState) => void;
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
    }, [videoInfo.id]);

    return {
        isEnabled,
        inclusions,
        setInclusion,
        toggleInclusion,
    };
}
