"use strict";
import { Errors } from "../errors.js";

export function handleError(sendResponse) {
    return (error) => {
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
