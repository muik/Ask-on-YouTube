import { StorageKeys } from "../constants.js";
import { handleError } from "./handlers.js";

export function getQuestionMenuUsedBefore(sendResponse) {
    chrome.storage.sync
        .get(StorageKeys.QUESTION_MENU_USED_BEFORE)
        .then((result) => {
            sendResponse({
                usedBefore:
                    result[StorageKeys.QUESTION_MENU_USED_BEFORE] || false,
            });
        })
        .catch(handleError(sendResponse));

    return true;
}

export function setQuestionMenuUsedBefore(sendResponse) {
    chrome.storage.sync
        .set({
            [StorageKeys.QUESTION_MENU_USED_BEFORE]: true,
        })
        .then(() => {
            sendResponse({ success: true });
        })
        .catch(handleError(sendResponse));

    return true;
}
