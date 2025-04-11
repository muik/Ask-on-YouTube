import { PromptData } from "../../types";
import { waitForElm } from "../utils.js";
import { isAnswerUrlObserving, observeAnswerUrl, stopAnswerUrlObserver } from "./answer";
import { promptDivider } from "./messages";
import { setPromptText, setPromptWithTranscript } from "./promptInteractions";
import { getTranscriptPrompt, getVideoInfoPrompt } from "./transcript";
import { getNewChatButton, hasErrorResponseArticle, isNotLogin, SELECTORS } from "./ui";

export function handlePromptResponse(response: { promptData: PromptData }): void {
    const promptData = response.promptData;
    if (!promptData) {
        console.debug("No prompt data received");
        return;
    }

    // wait for page rewrite
    setTimeout(() => {
        waitForElm(SELECTORS.PROMPT_TEXTAREA).then(promptTextarea => {
            const prompt = getPromptText(promptData);
            setPromptText(promptTextarea, prompt);

            waitForElm(SELECTORS.SEND_BUTTON).then(sendButton => {
                if (sendButton.hasAttribute("disabled")) {
                    console.debug(
                        "send button is disabled. maybe prompt is too long, try to attach transcript"
                    );
                    tryAttachTranscript(promptData);
                    return;
                }

                (sendButton as HTMLElement).click();
                observeAnswerUrl(promptData);

                // when speech button turn means that the response is finished
                waitForElm(SELECTORS.SPEECH_BUTTON).then(() => {
                    if (isAnswerUrlObserving()) {
                        stopAnswerUrlObserver();

                        if (!hasErrorResponseArticle()) {
                            console.debug("Unexpected error response article not found");
                            return;
                        }

                        tryAttachTranscript(promptData);
                    }
                });
            });
        });
    }, 100);
}

function tryAttachTranscript(promptData: PromptData): void {
    const promptTextarea = document.querySelector<HTMLTextAreaElement>(
        SELECTORS.PROMPT_TEXTAREA
    );
    if (!promptTextarea) {
        console.debug("promptTextarea not found");
        return;
    }

    if (isNotLogin()) {
        const message = chrome.i18n.getMessage("chatgptLoginRequired");
        setPromptText(promptTextarea, message);
        return;
    }

    const createNewChatButton = getNewChatButton();
    if (!createNewChatButton) {
        console.debug("createNewChatButton not found");
        return;
    }

    (createNewChatButton as HTMLElement).click();

    setTimeout(() => {
        const promptTextarea = document.querySelector<HTMLTextAreaElement>(
            SELECTORS.PROMPT_TEXTAREA
        );
        if (!promptTextarea) {
            console.debug("promptTextarea not found on new chat");
            return;
        }

        setPromptWithTranscript(promptTextarea, promptData);

        setTimeout(() => {
            waitForElm(SELECTORS.SEND_BUTTON_NOT_DISABLED).then(sendButton => {
                (sendButton as HTMLElement).click();
                observeAnswerUrl(promptData);

                waitForElm(SELECTORS.SPEECH_BUTTON).then(() => {
                    if (isAnswerUrlObserving()) {
                        console.debug("handlePermanentUrl failed");
                        stopAnswerUrlObserver();
                    }
                });
            });
        }, 100);
    }, 100);
}

function getPromptText({ videoInfo, transcript, question, langCode }: PromptData): string {
    const videoInfoPrompt = getVideoInfoPrompt(videoInfo, langCode);
    const transcriptPrompt = getTranscriptPrompt(transcript, langCode);

    return `${question}
${promptDivider}
${videoInfoPrompt}
${transcriptPrompt}`;
}
