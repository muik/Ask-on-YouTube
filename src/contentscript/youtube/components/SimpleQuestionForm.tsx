import { useEffect, useRef, useState } from "react";
import { Errors } from "../../../errors.js";
import { showQuestionDialog } from "../questionView.js";
import { loadDefaultQuestion, onRequestButtonClick } from "../simpleQuestion";
import { getVideoInfoFromVideoDetail } from "../videoInfo.js";

interface SimpleQuestionFormProps {}

const requestButtonName = chrome.i18n.getMessage("requestButtonName");
const requestingButtonName = chrome.i18n.getMessage("requestingButtonName");

export const containerId = "ytq-simple-question";

export function SimpleQuestionForm({}: SimpleQuestionFormProps) {
    const [error, setError] = useState<{ message: string; type?: string; code?: string } | null>(
        null
    );
    const [isRequesting, setIsRequesting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDisabled, setIsDisabled] = useState(false);

    const onFocus = (event: React.FocusEvent<HTMLInputElement>) => {
        event.preventDefault();

        const videoInfo = getVideoInfoFromVideoDetail();
        try {
            showQuestionDialog(videoInfo);
        } catch (error: any) {
            if (error.code in Errors) {
                setError(error);
            } else {
                console.error("showQuestionDialog error:", error);
                setError(Errors.UNKNOWN_ERROR);
            }
        }

        // unfocus the input element
        const inputElement = event.target as HTMLInputElement;
        inputElement.blur();
    };

    useEffect(() => {
        if (inputRef.current) {
            const abortController = new AbortController();
            loadDefaultQuestion(inputRef.current, setError, abortController.signal);
            return () => abortController.abort();
        }
    }, []);

    useEffect(() => {
        if (isRequesting) {
            setIsDisabled(true);
        } else if (error?.code === Errors.EXTENSION_CONTEXT_INVALIDATED.code) {
            setIsDisabled(true);
        } else {
            setIsDisabled(false);
        }
    }, [isRequesting, error]);

    return (
        <div id={containerId} className="ytq-form">
            <div className="question-input-container">
                <input
                    ref={inputRef}
                    type="text"
                    className="question-input"
                    value=""
                    onFocus={onFocus}
                    {...(isDisabled && { disabled: true })}
                />
                <button
                    className="question-button"
                    onClick={e => onRequestButtonClick(e, setIsRequesting, setError)}
                    {...(isDisabled && { disabled: true })}
                >
                    <QuestionMarkIcon />
                    <span className="default-text">{requestButtonName}</span>
                    <span className="loading-text">
                        {isRequesting ? requestingButtonName : requestButtonName}
                    </span>
                </button>
            </div>
            <p
                id="question-input-error"
                className="message"
                {...(error && { type: error.type || "error" })}
            >
                {error?.message}
            </p>
        </div>
    );
}

export function QuestionMarkIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14">
            <path d="m6.667-.005.074-.001.237-.001h.081c.396.001.781.013 1.171.089l.074.013c1.627.294 3.182 1.213 4.192 2.53l.063.077c.97 1.209 1.456 2.748 1.45 4.288v.076c-.006 1.544-.507 3.126-1.526 4.309a.8.8 0 0 0-.095.192l.061.06.571.565.294.291.283.28.108.107.15.15.046.045a1 1 0 0 1 .099.116c-.001.122-.101.195-.182.277l-.047.047-.099.099-.15.152-.095.096-.045.046c-.043.042-.043.042-.12.102-.119-.002-.19-.096-.268-.176l-.047-.047-.152-.154-.106-.107-.279-.281-.285-.286-.557-.562a1 1 0 0 0-.304.188c-.829.668-1.852 1.099-2.89 1.311l-.079.016a6.7 6.7 0 0 1-1.298.107h-.074a6 6 0 0 1-1.123-.09l-.074-.013a7.1 7.1 0 0 1-2.059-.724l-.066-.034a5 5 0 0 1-.755-.486l-.048-.036a8 8 0 0 1-.69-.593l-.046-.045a6 6 0 0 1-.558-.613l-.064-.08C.76 10.44.32 9.422.101 8.355l-.012-.06A6.7 6.7 0 0 1-.008 7.01v-.084c.001-.401.01-.791.09-1.184l.017-.084A7.3 7.3 0 0 1 .684 3.91l.027-.057a6.8 6.8 0 0 1 1.942-2.377l.045-.034a8 8 0 0 1 .858-.568l.056-.032C4.518.321 5.617 0 6.667-.005M2.834 2.821c-.147.142-.273.3-.401.46l-.054.066c-.606.735-.977 1.607-1.176 2.532l-.015.067c-.198.935-.095 1.987.206 2.886l.024.07c.176.515.417 1.022.742 1.461l.064.087c.137.184.284.354.441.521a4 4 0 0 1 .141.161c.086.102.183.183.284.27l.076.067c1.2 1.06 2.774 1.5 4.353 1.41 1.166-.092 2.296-.576 3.199-1.313a.6.6 0 0 0-.13-.191l-.046-.046-.051-.05-.053-.053-.175-.174-.121-.121-.319-.318-.326-.325-.639-.637a.9.9 0 0 1 .209-.27l.045-.045.144-.143.098-.097.242-.238a.6.6 0 0 1 .191.13l.046.046.05.051.053.053.174.175.121.121.318.319.325.326.636.639c.113-.038.156-.116.222-.208l.04-.056c.134-.188.253-.382.367-.584l.031-.054c.656-1.151.902-2.608.626-3.91l-.014-.07a5.8 5.8 0 0 0-1.452-2.813 4 4 0 0 1-.152-.174c-.089-.105-.192-.191-.296-.278l-.067-.06a5.9 5.9 0 0 0-1.984-1.117l-.06-.021C6.657.668 4.435 1.351 2.835 2.82" />
        </svg>
    );
}

export function getQuestionMarkSvg() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><path d="m6.667-.005.074-.001.237-.001h.081c.396.001.781.013 1.171.089l.074.013c1.627.294 3.182 1.213 4.192 2.53l.063.077c.97 1.209 1.456 2.748 1.45 4.288v.076c-.006 1.544-.507 3.126-1.526 4.309a.8.8 0 0 0-.095.192l.061.06.571.565.294.291.283.28.108.107.15.15.046.045a1 1 0 0 1 .099.116c-.001.122-.101.195-.182.277l-.047.047-.099.099-.15.152-.095.096-.045.046c-.043.042-.043.042-.12.102-.119-.002-.19-.096-.268-.176l-.047-.047-.152-.154-.106-.107-.279-.281-.285-.286-.557-.562a1 1 0 0 0-.304.188c-.829.668-1.852 1.099-2.89 1.311l-.079.016a6.7 6.7 0 0 1-1.298.107h-.074a6 6 0 0 1-1.123-.09l-.074-.013a7.1 7.1 0 0 1-2.059-.724l-.066-.034a5 5 0 0 1-.755-.486l-.048-.036a8 8 0 0 1-.69-.593l-.046-.045a6 6 0 0 1-.558-.613l-.064-.08C.76 10.44.32 9.422.101 8.355l-.012-.06A6.7 6.7 0 0 1-.008 7.01v-.084c.001-.401.01-.791.09-1.184l.017-.084A7.3 7.3 0 0 1 .684 3.91l.027-.057a6.8 6.8 0 0 1 1.942-2.377l.045-.034a8 8 0 0 1 .858-.568l.056-.032C4.518.321 5.617 0 6.667-.005M2.834 2.821c-.147.142-.273.3-.401.46l-.054.066c-.606.735-.977 1.607-1.176 2.532l-.015.067c-.198.935-.095 1.987.206 2.886l.024.07c.176.515.417 1.022.742 1.461l.064.087c.137.184.284.354.441.521a4 4 0 0 1 .141.161c.086.102.183.183.284.27l.076.067c1.2 1.06 2.774 1.5 4.353 1.41 1.166-.092 2.296-.576 3.199-1.313a.6.6 0 0 0-.13-.191l-.046-.046-.051-.05-.053-.053-.175-.174-.121-.121-.319-.318-.326-.325-.639-.637a.9.9 0 0 1 .209-.27l.045-.045.144-.143.098-.097.242-.238a.6.6 0 0 1 .191.13l.046.046.05.051.053.053.174.175.121.121.318.319.325.326.636.639c.113-.038.156-.116.222-.208l.04-.056c.134-.188.253-.382.367-.584l.031-.054c.656-1.151.902-2.608.626-3.91l-.014-.07a5.8 5.8 0 0 0-1.452-2.813 4 4 0 0 1-.152-.174c-.089-.105-.192-.191-.296-.278l-.067-.06a5.9 5.9 0 0 0-1.984-1.117l-.06-.021C6.657.668 4.435 1.351 2.835 2.82"/></svg>`;
}

export function findSimpleQuestionInputShown() {
    const container = document.querySelector<HTMLElement>(`#${containerId}`);
    if (!container || container.style.display === "none") {
        return null;
    }
    return container.querySelector(".question-input-container input[type='text']");
}
