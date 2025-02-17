"use strict";
import { transcriptCache } from "../background.js";
import { config } from "../contentscript/config.js";
import { Errors } from "../errors.js";
import { getChatGPTCustomPrompt, loadTranscript } from "./prompt.js";

export async function setPrompt({ videoInfo, target, question }) {
    if (target === "chatgpt") {
        let transcript;
        if (transcriptCache.has(videoInfo.id)) {
            transcript = transcriptCache.get(videoInfo.id);
            console.debug(
                `Using cached transcript for video ID: ${videoInfo.id}`
            );
        } else {
            transcript = await loadTranscript(videoInfo.id);
            transcriptCache.put(videoInfo.id, transcript);
            console.debug(`Cached transcript for video ID: ${videoInfo.id}`);
        }

        if (!transcript) {
            return {
                error: {
                    code: Errors.TRANSCRIPT_NOT_FOUND.code,
                    message: Errors.TRANSCRIPT_NOT_FOUND.message,
                },
            };
        }

        if (!question) {
            console.error("No question provided", { videoInfo, target });
            return {
                error: Errors.INVALID_REQUEST,
            };
        }

        const prompt = await getChatGPTCustomPrompt(
            videoInfo,
            transcript,
            question
        );
        return {
            prompt: prompt,
            response: { targetUrl: getTargetUrl(target) },
        };
    } else if (target === "gemini") {
        if (!question) {
            console.error("No question provided", { videoInfo, target });
            return {
                error: Errors.INVALID_REQUEST,
            };
        }

        return {
            prompt: question,
            response: { targetUrl: getTargetUrl(target) },
        };
    } else {
        console.error("Invalid target:", target);
        return {
            error: {
                code: "INVALID_TARGET",
                message: "Invalid target.",
            },
        };
    }
}

function getTargetUrl(target) {
    let url;
    if (target === "chatgpt") {
        url = "https://chatgpt.com/";
    } else if (target === "gemini") {
        url = "https://gemini.google.com/app";
    } else {
        throw new Error("Invalid target", { code: "INVALID_TARGET" });
    }
    return `${url}?ref=${config["refCode"]}`;
}
