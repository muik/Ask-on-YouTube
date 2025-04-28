import { PromptData } from "../../types";
import { getMessage, promptDivider } from "./messages";
import { getCodeBlockedText, getVideoInfoPrompt } from "./prompt-formatter";

export function setPromptText(textarea: HTMLTextAreaElement, text: string): void {
    const lines = text.split("\n");
    const promptHtml = `<p>${lines.join("</p><p>")}</p>`;
    textarea.innerHTML = promptHtml;
}

function attachTextAsFile(dropZone: HTMLTextAreaElement, text: string, filename: string): void {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File([text], filename, { type: "text/plain" }));

    const event = new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
        dataTransfer: dataTransfer,
    });

    dropZone.dispatchEvent(event);
}

export function setPromptWithTranscript(
    promptTextarea: HTMLTextAreaElement,
    promptData: PromptData
): void {
    const { prompt, transcript, comments } = getPromptTextWithAttachments(promptData);

    setPromptText(promptTextarea, prompt);

    if (transcript) {
        const attachFilename = chrome.i18n.getMessage("attachFilename");
        attachTextAsFile(promptTextarea, transcript, attachFilename);
    }

    if (comments) {
        const attachFilename = chrome.i18n.getMessage("attachCommentsFilename");
        attachTextAsFile(promptTextarea, comments, attachFilename);
    }
}

function getPromptTextWithAttachments(promptData: PromptData): {
    prompt: string;
    transcript: string | null;
    comments: string | null;
} {
    const videoInfoPrompt = getVideoInfoPrompt(promptData);
    const message = getMessage(promptData.langCode);
    const transcriptPrompt = promptData.transcript
        ? getCodeBlockedText({
              title: message.transcript,
              text: promptData.transcript,
          })
        : null;
    const commentsTextPrompt = promptData.commentsText
        ? getCodeBlockedText({
              title: message.comments,
              text: promptData.commentsText,
          })
        : null;

    return {
        prompt: `${promptData.question}
${promptDivider}
${videoInfoPrompt}`,
        transcript: transcriptPrompt,
        comments: commentsTextPrompt,
    };
}
