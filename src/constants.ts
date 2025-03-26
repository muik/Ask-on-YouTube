/** Actions that can be performed by the background script */
export enum BackgroundActions {
    GET_QUESTIONS = "getQuestions",
    SET_PROMPT = "setPrompt",
    GET_PROMPT = "getPrompt",
    OPEN_SETTINGS_PAGE = "openSettingsPage",
    GET_DEFAULT_QUESTION = "getDefaultQuestion",
    GET_LAST_QUESTION_OPTION = "getLastQuestionOption",
    GET_QUESTION_MENU_USED_BEFORE = "getQuestionMenuUsedBefore",
    SET_QUESTION_MENU_USED_BEFORE = "setQuestionMenuUsedBefore",
    GET_QUESTION_COMPLETE = "getQuestionComplete",
    GET_CAPTION = "getCaption",
    GET_QUESTION_COMPLETE_AVAILABLE = "getQuestionCompleteAvailable",
    SET_ANSWER = "setAnswer",
    HISTORY_CHANGED = "historyChanged",
}

/** Keys used for Chrome storage */
export enum StorageKeys {
    GEMINI_API_KEY = "geminiAPIKey",
    LAST_QUESTION_OPTION = "lastQuestionOption",
    QUESTION_MENU_USED_BEFORE = "questionMenuUsedBefore",
}

/** Keys for different question options */
export enum QuestionOptionKeys {
    FAVORITES = "favorites",
    RECENTS = "recents",
    SUGGESTIONS = "suggestions",
}

/** Available AI targets for question processing */
export enum Targets {
    CHATGPT = "chatgpt",
    GEMINI = "gemini",
} 