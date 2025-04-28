import { useEffect, useState } from "react";
import { VideoInfo } from "src/types";
import { BackgroundActions, QuestionOptionKeys } from "../../../constants";
import { Errors, Info } from "../../../errors";
import { getYouTubeLanguageCode } from "../questionView";
import {
    addCaptionLoadChangedListener,
    isCaptionResolved,
    removeCaptionLoadChangedListener,
    setCaption,
} from "./caption.js";
import { getContainerElement } from "./container";
import { QuestionList } from "./QuestionList";
import { QuestionOptions } from "./QuestionOptions";
import { Spinner } from "./Spinner";

interface QuestionSuggestionsProps {
    videoInfo: VideoInfo;
}

let requestQuestionsPendingListener: any = null;

function clearRequestQuestionsPendingListener() {
    if (requestQuestionsPendingListener) {
        removeCaptionLoadChangedListener(requestQuestionsPendingListener);
        requestQuestionsPendingListener = null;
    }
}

export function QuestionSuggestions({ videoInfo }: QuestionSuggestionsProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [questions, setQuestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<{ type?: string; message: string } | null>(null);

    async function loadLastQuestionOption() {
        try {
            setIsLoading(true);
            setError(null);

            const response = await chrome.runtime.sendMessage({
                action: BackgroundActions.GET_LAST_QUESTION_OPTION,
            });

            if (chrome.runtime.lastError) {
                console.error("requestLastQuestionOption lastError:", chrome.runtime.lastError);
                throw Errors.UNKNOWN_ERROR;
            }

            if (response.error) {
                if (!response.error.code) {
                    console.error("requestLastQuestionOption Error:", response);
                }
                throw response.error;
            }

            if (!response.option) {
                console.error("requestLastQuestionOption Error: no option", response);
                throw Errors.INVALID_RESPONSE;
            }

            setSelectedOption(response.option);
        } catch (error: any) {
            setError(error);
            setIsLoading(false);
        }
    }

    function loadQuestions(option: string, abortSignal: AbortSignal) {
        setIsLoading(true);
        setError(null);
        setQuestions([]);
        requestQuestions(option, abortSignal, videoInfo);
    }

    async function requestQuestions(
        option: string,
        abortSignal: AbortSignal,
        videoInfo: VideoInfo
    ) {
        clearRequestQuestionsPendingListener();

        try {
            validateQuestionOption(option);

            if (option === QuestionOptionKeys.SUGGESTIONS) {
                if (!isCaptionResolved()) {
                    requestQuestionsPendingListener = (event: any) => {
                        if (event.isResolved) {
                            requestQuestions(option, abortSignal, videoInfo);
                        }
                    };
                    addCaptionLoadChangedListener(requestQuestionsPendingListener);
                    return;
                }
            }

            const response = await chrome.runtime.sendMessage({
                action: BackgroundActions.GET_QUESTIONS,
                option,
                videoInfo,
                langCode: getYouTubeLanguageCode(),
            });

            if (abortSignal.aborted) {
                // stop, when the abort signal is aborted
                return;
            }

            handleQuestionsResponse(response, setQuestions, setError, selectedOption, videoInfo);
        } catch (error: any) {
            setRequestQuestionsError(error, setError);
        } finally {
            if (!abortSignal.aborted && !requestQuestionsPendingListener) {
                setIsLoading(false);
            }
        }
    }

    let loadQuestionsAbortController: AbortController | null = null;

    useEffect(() => {
        const containerElement = getContainerElement();
        if (!containerElement) {
            return;
        }
        if (!selectedOption) {
            loadLastQuestionOption();
        } else {
            if (loadQuestionsAbortController) {
                loadQuestionsAbortController.abort();
            }
            loadQuestionsAbortController = new AbortController();
            loadQuestions(selectedOption, loadQuestionsAbortController.signal);
        }
        return () => {
            if (loadQuestionsAbortController) {
                loadQuestionsAbortController.abort();
            }
        };
    }, [selectedOption]);

    useEffect(() => {
        return () => {
            clearRequestQuestionsPendingListener();
        };
    }, []);

    return (
        <div className="question-suggestions">
            <QuestionOptions
                selectedOption={selectedOption}
                setSelectedOption={setSelectedOption}
            />
            <QuestionList questions={questions} />
            <p
                id="question-suggestions-error"
                className="message"
                {...(error ? { type: error.type || "error" } : {})}
                dangerouslySetInnerHTML={{ __html: error?.message || '' }}
            />
            {isLoading && <Spinner />}
        </div>
    );
}

function validateQuestionOption(option: string) {
    if (Object.values(QuestionOptionKeys).includes(option as QuestionOptionKeys) === false) {
        console.error("Invalid question option:", option);
        throw Errors.INVALID_REQUEST;
    }
}

function handleQuestionsResponse(
    response: {
        questions?: string[];
        caption?: string;
        error?: { code?: string; message: string };
    },
    setQuestions: (questions: string[]) => void,
    setError: (error: { type?: string; message: string } | null) => void,
    selectedOption: string | null,
    videoInfo: VideoInfo
) {
    if (handleQuestionsResponseError(response, setError)) {
        return;
    }

    if (!response.questions || response.questions.length === 0) {
        if (selectedOption === QuestionOptionKeys.RECENTS) {
            setQuestionsError(Info.NO_RECENT_QUESTIONS, setError);
        } else {
            console.error("questions response:", response);
            setQuestionsError(Errors.INVALID_RESPONSE, setError);
        }
        return;
    }

    if (response.caption) {
        setCaption(response.caption, videoInfo);
    }
    setQuestions(response.questions);
}

function setRequestQuestionsError(
    error: { code?: string; message: string },
    setError: (error: { type?: string; message: string } | null) => void
) {
    if (error.message === "Extension context invalidated.") {
        setQuestionsError(Errors.EXTENSION_CONTEXT_INVALIDATED, setError);
    } else {
        setQuestionsError(error, setError);
    }
}

function handleQuestionsResponseError(
    response: { error?: { code?: string; message: string } },
    setError: (error: { type?: string; message: string } | null) => void
) {
    if (chrome.runtime.lastError || response.error) {
        const error = chrome.runtime.lastError || response.error;
        setQuestionsError(error as { code?: string; message: string }, setError);
        return true;
    }
    return false;
}

function setQuestionsError(
    error: { code?: string; message: string } | null,
    setError: (error: { type?: string; message: string } | null) => void
) {
    if (!error) {
        setError(null);
        return;
    }

    const info = Info[error.code as keyof typeof Info];
    if (info) {
        setError({ type: "info", message: info.message });
        return;
    }

    let type = "error";
    const knownError = Errors[error.code as keyof typeof Errors];
    if (knownError) {
        if (knownError.code === "GEMINI_API_KEY_NOT_SET") {
            type = "info";
        }
        setError({ type, message: knownError.message });
    } else {
        console.error(error);
        setError({ type: "error", message: error.message });
    }
}
