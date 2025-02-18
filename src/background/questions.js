import { handleError, settings } from "../background.js";
import { QuestionOptionKeys, StorageKeys } from "../constants.js";
import { Errors } from "../errors.js";
import { LRUCache } from "./lruCache.js";
import { getFavoriteQuestions, getRecentQuestions } from "./questionHistory.js";
import { getSuggestedQuestions } from "./suggestQuestions.js";

const questionCache = new LRUCache(10);

export function getQuestions(request, sendResponse) {
    if (!request.option) {
        request.option =
            settings[StorageKeys.LAST_QUESTION_OPTION] ||
            Object.keys(QuestionOptionKeys)[0];
    }

    let getQuestionsRequest;

    switch (request.option) {
        case QuestionOptionKeys.RECENTS:
            getQuestionsRequest = getRecentQuestions();
            break;
        case QuestionOptionKeys.FAVORITES:
            getQuestionsRequest = getFavoriteQuestions();
            break;
        case QuestionOptionKeys.SUGGESTIONS:
            getQuestionsRequest = getSuggestedQuestions({
                videoInfo: request.videoInfo,
                apiKey: settings[StorageKeys.GEMINI_API_KEY],
                questionCache,
                language: chrome.i18n.getUILanguage(),
            });
            break;
        default:
            sendResponse({
                error: {
                    code: Errors.INVALID_REQUEST.code,
                    message: "No option provided.",
                },
            });
            return;
    }

    getQuestionsRequest
        .then((result) => {
            return {
                option: request.option,
                ...result,
            };
        })
        .then(sendResponse)
        .catch(handleError(sendResponse));

    updateLastQuestionOption(request.option);
    return true;
}
export function updateLastQuestionOption(option) {
    if (settings[StorageKeys.LAST_QUESTION_OPTION] === option) {
        return;
    }

    if (!Object.values(QuestionOptionKeys).includes(option)) {
        console.error("Invalid question option:", option);
        throw Errors.INVALID_REQUEST;
    }

    settings[StorageKeys.LAST_QUESTION_OPTION] = option;
    chrome.storage.sync.set({ [StorageKeys.LAST_QUESTION_OPTION]: option });
}
