import { QuestionOptionKeys, StorageKeys } from "../constants.js";
import { Errors } from "../errors.js";

const settingsKeys = [
    StorageKeys.GEMINI_API_KEY,
    StorageKeys.LAST_QUESTION_OPTION,
];
const settings = { notLoaded: true };

export async function loadSettings() {
    if (!settings.notLoaded) {
        return settings;
    }

    const result = await chrome.storage.sync.get(settingsKeys);

    Object.keys(result).forEach((key) => {
        settings[key] = result[key];
    });

    // remove notLoaded flag
    delete settings.notLoaded;

    console.debug("Settings loaded:", settings);

    return settings;
}

export function updateSettings(changes) {
    Object.keys(changes).forEach((key) => {
        if (settingsKeys.includes(key)) {
            settings[key] = changes[key].newValue;
        }
    });

    console.debug("Settings updated:", settings);
}

export async function getApiKey() {
    const settings = await loadSettings();
    return settings[StorageKeys.GEMINI_API_KEY];
}

export async function setLastQuestionOption(option) {
    if (!Object.values(QuestionOptionKeys).includes(option)) {
        console.error("Invalid question option:", option);
        throw Errors.INVALID_REQUEST;
    }

    await chrome.storage.sync.set({
        [StorageKeys.LAST_QUESTION_OPTION]: option,
    });
    console.debug("Last question option updated:", option);
}

export async function getLastQuestionOption() {
    const settings = await loadSettings();
    return (
        settings[StorageKeys.LAST_QUESTION_OPTION] ||
        Object.values(QuestionOptionKeys)[0]
    );
}
