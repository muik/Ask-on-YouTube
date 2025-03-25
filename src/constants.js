export const BackgroundActions = {
    GET_QUESTIONS: "getQuestions",
    SET_PROMPT: "setPrompt",
    GET_PROMPT: "getPrompt",
    OPEN_SETTINGS_PAGE: "openSettingsPage",
    GET_DEFAULT_QUESTION: "getDefaultQuestion",
    GET_LAST_QUESTION_OPTION: "getLastQuestionOption",
    GET_QUESTION_MENU_USED_BEFORE: "getQuestionMenuUsedBefore",
    SET_QUESTION_MENU_USED_BEFORE: "setQuestionMenuUsedBefore",
    GET_QUESTION_COMPLETE: "getQuestionComplete",
    GET_CAPTION: "getCaption",
    GET_QUESTION_COMPLETE_AVAILABLE: "getQuestionCompleteAvailable",
    SET_ANSWER: "setAnswer",
};

export const StorageKeys = {
    GEMINI_API_KEY: "geminiAPIKey",
    LAST_QUESTION_OPTION: "lastQuestionOption",
    QUESTION_HISTORY: "questionHistory",
    QUESTION_MENU_USED_BEFORE: "questionMenuUsedBefore",
};

export const QuestionOptionKeys = {
    FAVORITES: "favorites",
    RECENTS: "recents",
    SUGGESTIONS: "suggestions",
};

export const Targets = {
    CHATGPT: "chatgpt",
    GEMINI: "gemini",
};
