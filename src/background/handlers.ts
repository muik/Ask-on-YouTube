"use strict";
import { Errors } from "../errors";

interface ErrorWithCode extends Error {
    code?: string;
}

type SendResponse = (response: { error: typeof Errors[keyof typeof Errors] | ErrorWithCode }) => void;

/**
 * Handle error
 * @param {SendResponse} sendResponse - The send response function
 * @returns {(error: ErrorWithCode) => void} - The error handler function
 */
export function handleError(sendResponse: SendResponse): (error: ErrorWithCode) => void {
    return (error: ErrorWithCode) => {
        // If there is no error code, it is not a defined error to send to users.
        if (!error.code) {
            console.error("Unknown error:", error);
            sendResponse({
                error: Errors.UNKNOWN_ERROR,
            });
            return;
        }

        sendResponse({
            error: error,
        });
    };
} 