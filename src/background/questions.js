import { QuestionOptionKeys } from "../constants.js";
import { Errors } from "../errors.js";
import { handleError } from "./handlers.js";
import { getFavoriteQuestions, getRecentQuestions } from "./questionHistory.js";
import {
    getApiKey,
    loadLastQuestionOption,
    setLastQuestionOption,
} from "./settingsLoader.js";
import { getSuggestedQuestions } from "./suggestQuestions.js";

export function getLastQuestionOption(sendResponse) {
    loadLastQuestionOption()
        .then((option) => {
            sendResponse({ option });
        })
        .catch(handleError(sendResponse));

    return true;
}

export function getQuestions(request, sendResponse) {
    requestQuestions(request)
        .then(sendResponse)
        .catch(handleError(sendResponse));

    setLastQuestionOption(request.option);

    return true;
}

function requestQuestions(request) {
    let getQuestionsRequest;

    switch (request.option) {
        case QuestionOptionKeys.RECENTS:
            getQuestionsRequest = getRecentQuestions();
            break;
        case QuestionOptionKeys.FAVORITES:
            getQuestionsRequest = getFavoriteQuestions();
            break;
        case QuestionOptionKeys.SUGGESTIONS:
            getQuestionsRequest = getApiKey().then((apiKey) =>
                getSuggestedQuestions({
                    videoInfo: request.videoInfo,
                    apiKey,
                    language: chrome.i18n.getUILanguage(),
                })
            );
            break;
        default:
            console.error("Invalid question option:", request.option);
            throw Errors.INVALID_REQUEST;
    }

    return getQuestionsRequest;
}

export function getDefaultQuestion(sendResponse) {
    getFavoriteQuestions()
        .then((result) => {
            return {
                question: result.questions[0],
            };
        })
        .then(sendResponse)
        .catch(handleError(sendResponse));

    return true;
}
