import { showToastMessage } from "./contentscript/youtube/toast.js";

export const Errors = {
    EXTENSION_CONTEXT_INVALIDATED:
        "The Chrome extension has been updated. Please reload this page to use it.",
};

export function handleSendMessageError(error) {
    if (error.message === "Extension context invalidated.") {
        showToastMessage(Errors.EXTENSION_CONTEXT_INVALIDATED);
        return true;
    }
    return false;
}
