"use strict";
import { transcriptCache } from "../background.js";
import { config } from "../contentscript/config.js";
import { validateVideoInfo } from "../data.js";
import { Errors } from "../errors.js";
import {
    getChatGPTCustomPrompt,
    getGeminiCustomPrompt,
    loadTranscript,
} from "./prompt.js";
import { getDefaultQuestion } from "./questionHistory.js";

export async function setPrompt({ videoInfo, target, question }) {
    validateVideoInfo(videoInfo);

    if (target === "chatgpt") {
        const transcript = await getTranscriptCached(videoInfo.id);
        if (!transcript) {
            return {
                error: Errors.TRANSCRIPT_NOT_FOUND,
            };
        }

        if (!question) {
            question = await getDefaultQuestion();
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
        const transcript = await getTranscriptCached(videoInfo.id);
        if (!question) {
            question = await getDefaultQuestion();
        }

        const prompt = await getGeminiCustomPrompt(
            videoInfo,
            transcript,
            question
        );

        return {
            prompt: prompt,
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

async function getTranscriptCached(videoId) {
    if (transcriptCache.has(videoId)) {
        const transcript = transcriptCache.get(videoId);
        console.debug(`Using cached transcript for video ID: ${videoId}`);
        return transcript;
    }
    const transcript = await loadTranscript(videoId);
    transcriptCache.put(videoId, transcript);
    console.debug(`Cached transcript for video ID: ${videoId}`);
    return transcript;
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
