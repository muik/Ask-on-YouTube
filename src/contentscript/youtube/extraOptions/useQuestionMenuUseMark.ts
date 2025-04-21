import { useEffect, useState } from "react";
import { BackgroundActions } from "../../../constants";

// Shared cache at module level
let sharedCache: boolean | undefined = undefined;

export function useQuestionMenuUseMark() {
    const [questionMenuUsedBefore, setQuestionMenuUsedBefore] = useState<boolean | undefined>(
        undefined
    );
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchQuestionMenuUsedBefore() {
            // Check shared cache first
            if (sharedCache !== undefined) {
                setQuestionMenuUsedBefore(sharedCache);
                setIsLoading(false);
                return;
            }

            try {
                const response = await chrome.runtime.sendMessage({
                    action: BackgroundActions.GET_QUESTION_MENU_USED_BEFORE,
                });
                const value = response.usedBefore;
                setQuestionMenuUsedBefore(value);
                // Update shared cache
                sharedCache = value;
            } catch (error) {
                if (error instanceof Error && error.message === "Extension context invalidated.") {
                    // ignore the error
                    return;
                }
                setError(error instanceof Error ? error : new Error("Unknown error occurred"));
            } finally {
                setIsLoading(false);
            }
        }

        fetchQuestionMenuUsedBefore();
    }, []);

    const markAsUsed = async () => {
        try {
            const response = await chrome.runtime.sendMessage({
                action: BackgroundActions.SET_QUESTION_MENU_USED_BEFORE,
            });
            if (!response.success) {
                throw new Error("Failed to mark question menu as used");
            }
            const newValue = true;
            setQuestionMenuUsedBefore(newValue);
            // Update shared cache
            sharedCache = newValue;
        } catch (error) {
            setError(error instanceof Error ? error : new Error("Unknown error occurred"));
        }
    };

    return {
        questionMenuUsedBefore,
        isLoading,
        error,
        markAsUsed,
    };
}
