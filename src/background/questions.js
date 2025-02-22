import { QuestionOptionKeys, StorageKeys } from "../constants.js";
import { Errors } from "../errors.js";
import { handleError } from "./handlers.js";
import { getFavoriteQuestions, getRecentQuestions } from "./questionHistory.js";
import { getSuggestedQuestions } from "./suggestQuestions.js";

export function getLastQuestions(request, sendResponse, settings) {
    request.option =
        settings[StorageKeys.LAST_QUESTION_OPTION] ||
        Object.values(QuestionOptionKeys)[0];

    getQuestionsRequest(request, settings)
        .then((result) => {
            return {
                option: request.option,
                ...result,
            };
        })
        .then(sendResponse)
        .catch(handleError(sendResponse));

    return true;
}

export function getQuestions(request, sendResponse, settings) {
    getQuestionsRequest(request, settings)
        .then(sendResponse)
        .catch(handleError(sendResponse));

    updateLastQuestionOption(request.option, settings);

    return true;
}

function getQuestionsRequest(request, settings) {
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
                language: chrome.i18n.getUILanguage(),
            });
            break;
        default:
            throw {
                code: Errors.INVALID_REQUEST.code,
                message: "No option provided.",
            };
    }

    return getQuestionsRequest;
}

function updateLastQuestionOption(option, settings) {
    if (settings[StorageKeys.LAST_QUESTION_OPTION] === option) {
        return;
    }

    if (!Object.values(QuestionOptionKeys).includes(option)) {
        console.error("Invalid question option:", option);
        throw Errors.INVALID_REQUEST;
    }

    settings[StorageKeys.LAST_QUESTION_OPTION] = option;
    chrome.storage.sync.set(
        { [StorageKeys.LAST_QUESTION_OPTION]: option },
        () => {
            console.debug("Last question option updated:", option);
        }
    );
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
