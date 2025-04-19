import { useEffect, useRef, useState } from "react";
import { VideoInfo as VideoInfoType } from "../../../types";
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
import { onRequestButtonClick } from "./requestHandler.js";

// Debounce delay in milliseconds
const DEBOUNCE_DELAY = 200;

export function QuestionForm({ videoInfo }: { videoInfo: VideoInfoType }) {
    const requestButtonName = chrome.i18n.getMessage("requestButtonName");
    const requestingButtonName = chrome.i18n.getMessage("requestingButtonName");
    const inputElementRef = useRef<HTMLTextAreaElement>(null);
    const errorMessageRef = useRef<HTMLParagraphElement>(null);
    const autoCompleteTextRef = useRef<HTMLDivElement>(null);

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
        const inputElement = inputElementRef.current;
        if (!inputElement) {
            return;
        }
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
            debouncedInputHandler(e);
        }
    };

    useEffect(() => {
        if (autoCompleteData && inputElementRef.current && autoCompleteTextRef.current) {
            inputElementRef.current.style.height = autoCompleteTextRef.current.scrollHeight + "px";
        }
    }, [autoCompleteData, inputElementRef.current, autoCompleteTextRef.current]);

    useEffect(() => {
        if (inputElementRef.current) {
            adjustInputHeight(inputElementRef.current);

            // cursor focus on the input field
            const focusTimeout = setTimeout(() => {
                inputElementRef.current?.focus();
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
                        if (!inputElementRef.current || !autoCompleteTextRef.current) {
                            return;
                        }
                        handleKeyDown(
                            e,
                            inputElementRef.current,
                            setAutoCompleteData,
                            autoCompleteData
                        );
                    }}
                    onInput={onInput}
                    placeholder={placeholder}
                    {...(isRequesting ? { disabled: true } : {})}
                />
                <button
                    className="question-button"
                    onClick={e =>
                        onRequestButtonClick(
                            e,
                            setIsRequesting,
                            setError,
                            videoInfo,
                            inputElementRef.current
                        )
                    }
                    {...(isRequesting ? { disabled: true } : {})}
                >
                    <span className="default-text">{requestButtonName}</span>
                    <span className="loading-text">{requestingButtonName}</span>
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
