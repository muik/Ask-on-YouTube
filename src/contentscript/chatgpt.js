"use strict";

import Config from "../config.js";
import { BackgroundActions, Targets } from "../constants.js";
import { waitForElm } from "./utils.js";

const promptDivider = "------------";
const sendButtonSelector = "button[data-testid=send-button]";

const messages = {
    en: {
        transcript: "Transcript",
        title: "Title",
        caption: "Subtitle",
        transcriptPagingFormat: "Transcript (page {pageIndex} of {pagesCount})",
    },
    ko: {
        transcript: "자막",
        title: "제목",
        caption: "부제목",
        transcriptPagingFormat: "자막 ({pageIndex} / {pagesCount} 페이지)",
    },
};

window.onload = async () => {
    // If opened by the extension, insert the prompt
    if (
        window.location.hostname !== "chatgpt.com" ||
        window.location.search !== `?ref=${Config.REF_CODE}`
    ) {
        return;
    }

    try {
        // get prompt from background.js
        chrome.runtime.sendMessage(
            { action: BackgroundActions.GET_PROMPT, target: Targets.CHATGPT },
            onGetPrompt
        );
        if (chrome.runtime.lastError) {
            console.error("Error getting prompt - lastError:", chrome.runtime.lastError);
        }
    } catch (error) {
        console.error("Error getting prompt", error);
    }
};

function onGetPrompt(response) {
    console.debug("onGetPrompt", response);
    const promptData = response.promptData;
    if (!promptData) {
        console.debug("No prompt data received");
        return;
    }

    waitForElm("#prompt-textarea").then((promptTextarea) => {
        const prompt = getPromptText(promptData);
        setPromptText(promptTextarea, prompt);

        // wait for the send button to be enabled
        setTimeout(() => {
            const sendButton = document.querySelector(sendButtonSelector);
            if (!sendButton.hasAttribute("disabled")) {
                console.debug("sendButton clicked");
                sendButton.click();
                return;
            }
            console.debug("sendButton disabled", sendButton);

            if (isNotLogin()) {
                const message = chrome.i18n.getMessage("chatgptLoginRequired");
                setPromptText(promptTextarea, message);
                return;
            }

            setTimeout(() => {
                setPromptAnotherOptions(promptTextarea, promptData);
            }, 500);
        }, 300);
    });
}

function setPromptAnotherOptions(promptTextarea, promptData) {
    const attachButton = document.querySelector(
        "#composer-background div.h-8 > button"
    );
    if (attachButton?.hasAttribute("disabled")) {
        console.debug("attachButton disabled");

        const sendButton = document.querySelector(sendButtonSelector);
        if (sendButton.hasAttribute("disabled")) {
            setPromptPaging(promptTextarea, promptData);
        }
        return;
    }

    console.debug("waiting for attachButton");
    const attachButtonSelector = "#composer-background span.flex > button";
    waitForElm(attachButtonSelector).then((attachButton) => {
        if (attachButton.hasAttribute("disabled")) {
            console.debug("attachButton disabled", attachButton);
            setPromptPaging(promptTextarea, promptData);
        } else {
            console.debug("attachButton enabled");
            setPromptWithTranscript(promptTextarea, promptData);
        }
    });
}

function isNotLogin() {
    return (
        document.querySelector('button[data-testid="login-button"]') ||
        document.querySelector('button[data-testid="mobile-login-button"]')
    );
}

function setPromptWithTranscript(promptTextarea, promptData) {
    const { prompt, transcript } = getPromptTextWithTranscript(promptData);

    setPromptText(promptTextarea, prompt);

    setTimeout(() => {
        const attachFilename = chrome.i18n.getMessage("attachFilename");
        attachTextAsFile(promptTextarea, transcript, attachFilename);
        setTimeout(() => {
            // wait for upload to finish
            waitForElm(`${sendButtonSelector}:not([disabled])`).then(
                (sendButton) => {
                    sendButton.click();
                }
            );
        }, 100);
    }, 500);
}

function setPromptPaging(
    promptTextarea,
    promptData,
    pagesCount = 2,
    pageIndex = 1
) {
    const transcript = promptData.transcript;
    const totalLength = transcript.length;
    const pageSize = Math.floor(totalLength / pagesCount);
    const transcriptPage = transcript.slice(
        (pageIndex - 1) * pageSize,
        pageIndex * pageSize
    );
    const message = messages[promptData.langCode] || messages.en;
    const pagingText = message.transcriptPagingFormat
        .replace("{pageIndex}", pageIndex)
        .replace("{pagesCount}", pagesCount);

    const transcriptPrompt = `${pagingText}: \`\`\`
${transcriptPage}
\`\`\`
`;

    let promptText;
    if (pageIndex < pagesCount) {
        const question = chrome.i18n.getMessage("chatgptMorePages");
        promptText = `${question}
${promptDivider}
${transcriptPrompt}
`;
    } else {
        const videoInfoPrompt = getVideoInfoPrompt(
            promptData.videoInfo,
            promptData.langCode
        );
        const question = promptData.question;
        promptText = `${question}
${promptDivider}
${transcriptPrompt}
${videoInfoPrompt}
`;
    }

    setPromptText(promptTextarea, promptText);

    setTimeout(() => {
        waitForElm(sendButtonSelector).then((sendButton) => {
            if (sendButton.hasAttribute("disabled")) {
                if (pageIndex === 1 && pagesCount < 4) {
                    setPromptPaging(
                        promptTextarea,
                        promptData,
                        pagesCount + 1,
                        1
                    );
                }
                return;
            }
            sendButton.click();

            if (pageIndex < pagesCount) {
                setPromptPaging(
                    promptTextarea,
                    promptData,
                    pagesCount,
                    pageIndex + 1
                );
            }
        });
    }, 1);
}

function setPromptText(textarea, text) {
    const lines = text.split("\n");
    const promptHtml = `<p>${lines.join("</p><p>")}</p>`;
    textarea.innerHTML = promptHtml;
}

function attachTextAsFile(dropZone, text, filename) {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File([text], filename, { type: "text/plain" }));

    const event = new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
        dataTransfer: dataTransfer,
    });

    dropZone.dispatchEvent(event);
}

function getPromptText({ videoInfo, transcript, question, langCode }) {
    const message = messages[langCode] || messages.en;
    const videoInfoPrompt = getVideoInfoPrompt(videoInfo, langCode);
    const transcriptRevised = transcript.trim();

    return `${question}
${promptDivider}
${videoInfoPrompt}
${message.transcript}: \`\`\`
${transcriptRevised}
\`\`\``;
}

function getPromptTextWithTranscript({
    videoInfo,
    transcript,
    question,
    langCode,
}) {
    const message = messages[langCode] || messages.en;
    const videoInfoPrompt = getVideoInfoPrompt(videoInfo, langCode);
    const transcriptRevised = transcript.trim();

    return {
        prompt: `${question}
${promptDivider}
${videoInfoPrompt}`,
        transcript: `${message.transcript}: \`\`\`
${transcriptRevised}
\`\`\`
`,
    };
}

function getVideoInfoPrompt(videoInfo, langCode) {
    const message = messages[langCode] || messages.en;
    const title = videoInfo.title.trim();
    const captionInline = videoInfo.caption
        ? `${message.caption}: \`${videoInfo.caption
              .replace(/`/g, "\\`")
              .replace(/\n/g, " ")
              .replace("  ", ", ")
              .trim()}\`\n`
        : "";

    return `${message.title}: ${title}
${captionInline}URL: https://www.youtube.com/watch?v=${videoInfo.id}`;
}
