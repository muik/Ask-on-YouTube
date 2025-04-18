import { PromptData } from "../../types";
import { promptDivider } from "./messages";
import { getTranscriptPrompt, getVideoInfoPrompt } from "./transcript";

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
    const { prompt, transcript } = getPromptTextWithTranscript(promptData);

    setPromptText(promptTextarea, prompt);

    const attachFilename = chrome.i18n.getMessage("attachFilename");
    attachTextAsFile(promptTextarea, transcript, attachFilename);
}

function getPromptTextWithTranscript(promptData: PromptData): {
    prompt: string;
    transcript: string;
} {
    const videoInfoPrompt = getVideoInfoPrompt(promptData);
    const transcriptPrompt = getTranscriptPrompt(promptData);

    return {
        prompt: `${promptData.question}
${promptDivider}
${videoInfoPrompt}`,
        transcript: transcriptPrompt,
    };
} 