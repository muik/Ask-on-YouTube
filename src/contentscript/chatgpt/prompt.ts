import { PromptData } from "../../types";
import { waitForElm } from "../utils.js";
import { isAnswerUrlObserving, observeAnswerUrl, stopAnswerUrlObserver } from "./answer";
import { getMessage, promptDivider } from "./messages";
import { setPromptText, setPromptWithTranscript } from "./promptInteractions";
import { getCodeBlockedText, getVideoInfoPrompt } from "./prompt-formatter";
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
    const promptTextarea = document.querySelector<HTMLTextAreaElement>(SELECTORS.PROMPT_TEXTAREA);
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

function getPromptText(promptData: PromptData): string {
    const videoInfoPrompt = getVideoInfoPrompt(promptData);
    const items = [promptData.question, promptDivider, videoInfoPrompt];
    const message = getMessage(promptData.langCode);

    if (promptData.transcript != null) {
        const transcriptPrompt = getCodeBlockedText({
            title: message.transcript,
            text: promptData.transcript,
        });
        items.push(transcriptPrompt);
    }

    if (promptData.commentsText != null) {
        const commentsPrompt = getCodeBlockedText({
            title: message.comments,
            text: promptData.commentsText,
        });
        items.push(commentsPrompt);
    }

    return items.join("\n");
}
