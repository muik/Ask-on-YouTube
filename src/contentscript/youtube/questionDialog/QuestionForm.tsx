import { useEffect, useRef, useState } from "react";
import { SharedQuestionFormData, VideoInfo as VideoInfoType } from "../../../types";
import {
    adjustInputHeight,
    cancelPendingRequest,
    cleanupSuggestion,
    debounce,
    handleInputChange,
    handleKeyDown,
} from "../autoComplete";
import { CompleteTextContainer } from "../components/CompleteTextContainer";
import { useGeminiService } from "../geminiService";
import { loadDefaultQuestion } from "./loadDefaultQuestion";
import { onRequestButtonClick } from "./requestHandler";

// Debounce delay in milliseconds
const DEBOUNCE_DELAY = 200;

export function QuestionForm({
    videoInfo,
    sharedFormData,
    isCommentsLoading,
}: {
    videoInfo: VideoInfoType;
    sharedFormData: SharedQuestionFormData;
    isCommentsLoading: boolean;
}) {
    const requestButtonName = chrome.i18n.getMessage("requestButtonName");
    const requestingButtonName = chrome.i18n.getMessage("requestingButtonName");
    const inputElementRef = useRef<HTMLTextAreaElement>(null);
    const errorMessageRef = useRef<HTMLParagraphElement>(null);
    const autoCompleteTextRef = useRef<HTMLDivElement>(null);
    const requestButtonRef = useRef<HTMLButtonElement>(null);

    const [error, setError] = useState<{ message: string; type?: string } | null>(null);
    const [placeholder, setPlaceholder] = useState<string>("");
    const [isRequesting, setIsRequesting] = useState<boolean>(false);
    const [autoCompleteData, setAutoCompleteData] = useState<{
        currentText: string;
        completedText: string;
    } | null>(null);
    const { isServiceAvailable: isGeminiServiceAvailable } = useGeminiService();

    // Create debounced handler for input changes
    const debouncedInputHandler = debounce(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) =>
            !isRequesting && handleInputChange(e, setAutoCompleteData, videoInfo, setError),
        DEBOUNCE_DELAY
    );
    const onInput = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const inputElement = e.target as HTMLTextAreaElement;

        if (autoCompleteData) {
            cancelPendingRequest();

            const questionStart = inputElement.value;
            const completedText = autoCompleteData.completedText;
            if (questionStart && completedText && isQuestionStart(completedText, questionStart)) {
                setAutoCompleteData({
                    currentText: questionStart,
                    completedText: completedText,
                });
                return;
            } else {
                // if user doesn't follow the suggestion, clear the suggestion immediately
                cleanupSuggestion(inputElement, setAutoCompleteData);
            }
        }

        if (!(e instanceof CustomEvent) && isGeminiServiceAvailable) {
            cancelPendingRequest();
            debouncedInputHandler(e);
        }

        adjustInputHeight(inputElement);
    };

    useEffect(() => {
        const inputElement = inputElementRef.current;
        if (inputElement) {
            adjustInputHeight(inputElement);

            // cursor focus on the input field
            const focusTimeout = setTimeout(() => {
                inputElement.focus();
            }, 100);

            return () => {
                clearTimeout(focusTimeout);
            };
        }
    }, []);

    useEffect(() => {
        const abortController = new AbortController();
        loadDefaultQuestion(setPlaceholder, setError, abortController.signal);
        return () => {
            abortController.abort();
        };
    }, []);

    useEffect(() => {
        if (placeholder) {
            const inputElement = inputElementRef.current;
            if (inputElement && inputElement.textContent?.length === 0) {
                adjustInputHeight(inputElement);
            }
        }
    }, [placeholder]);

    useEffect(() => {
        if (isRequesting) {
            const inputElement = inputElementRef.current;
            if (inputElement) {
                adjustInputHeight(inputElement);
            }
        }
    }, [isRequesting]);

    useEffect(() => {
        const inputElement = inputElementRef.current;
        if (!inputElement) {
            return;
        }

        const autoCompleteText = autoCompleteTextRef.current;
        if (autoCompleteData && autoCompleteText) {
            inputElement.style.height = autoCompleteText.scrollHeight + "px";
        }
    }, [autoCompleteData, inputElementRef.current, autoCompleteTextRef.current]);

    function getInputWidth() {
        const inputElement = inputElementRef.current;
        if (!inputElement) {
            return 0;
        }
        const computedStyle = window.getComputedStyle(inputElement);
        return (
            inputElement.getBoundingClientRect().width -
            parseFloat(computedStyle.paddingLeft) -
            parseFloat(computedStyle.paddingRight) +
            "px"
        );
    }

    return (
        <div className="ytq-form">
            <div className="question-input-container">
                <textarea
                    ref={inputElementRef}
                    className="question-input"
                    rows={1}
                    onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                        const inputElement = e.target as HTMLTextAreaElement;

                        if (!autoCompleteData && e.key === "Enter") {
                            requestButtonRef.current?.click();
                            return;
                        }

                        handleKeyDown(e, inputElement, setAutoCompleteData, autoCompleteData);
                    }}
                    onInput={onInput}
                    placeholder={placeholder}
                    {...(isRequesting ? { disabled: true } : {})}
                />
                <button
                    ref={requestButtonRef}
                    className="question-button"
                    onClick={() => {
                        if (!inputElementRef.current) {
                            return;
                        }
                        onRequestButtonClick(
                            setIsRequesting,
                            setError,
                            videoInfo,
                            inputElementRef.current,
                            sharedFormData
                        );
                    }}
                    {...(isRequesting || isCommentsLoading ? { disabled: true } : {})}
                >
                    <span className="default-text">{requestButtonName}</span>
                    <span className="loading-text">
                        {isCommentsLoading && !isRequesting
                            ? requestButtonName
                            : requestingButtonName}
                    </span>
                </button>
                {autoCompleteData && (
                    <div
                        ref={autoCompleteTextRef}
                        className="question-auto-complete-text"
                        style={{
                            width: getInputWidth(),
                        }}
                    >
                        <CompleteTextContainer
                            currentText={autoCompleteData.currentText}
                            completedText={autoCompleteData.completedText}
                        />
                    </div>
                )}
            </div>
            <p
                ref={errorMessageRef}
                id="question-input-error"
                className="message"
                {...(error ? { type: error.type || "error" } : {})}
            >
                {error?.message}
            </p>
        </div>
    );
}

function normalizeText(text: string): string {
    return text.toLowerCase();
}

function isQuestionStart(completedText: string, questionStart: string): boolean {
    return normalizeText(completedText).startsWith(normalizeText(questionStart));
}
