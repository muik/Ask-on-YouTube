"use strict";
import { settings, transcriptCache } from "../background.js";
import { config } from "../contentscript/config.js";
import {
    getChatGPTCustomPrompt,
    getChatGPTPrompt,
    getGeminiPrompt,
    loadTranscript,
} from "./prompt.js";

export async function handleSetPromptRequest(request) {
    if (!request.videoInfo) {
        console.error("No video info received.");
        return { error: { message: "No video info received." } };
    }

    const videoInfo = request.videoInfo;

    if (request.target === "chatgpt") {
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
                    code: "TRANSCRIPT_NOT_FOUND",
                    message: "Transcript not found.",
                },
            };
        }

        let prompt;
        if (request.prompt) {
            prompt = await getChatGPTCustomPrompt(
                videoInfo,
                transcript,
                request.prompt
            );
        } else {
            prompt = await getChatGPTPrompt(videoInfo, transcript, settings);
        }
        return {
            prompt: prompt,
            response: { targetUrl: getTargetUrl(request.target) },
        };
    } else if (request.target === "gemini") {
        const prompt = await getGeminiPrompt(videoInfo.id, settings);
        return {
            prompt: prompt,
            response: { targetUrl: getTargetUrl(request.target) },
        };
    } else {
        console.error("Invalid target:", request.target);
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
