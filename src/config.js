export const Config = {
    // Maximum number of questions to display below the input box in the question dialog
    MAX_QUESTIONS_COUNT: 5,

    // Maximum number of questions to store in history
    // Used for calculating favorite questions
    // Larger history provides more accurate favorites but increases load/save time
    MAX_HISTORY_SIZE: 30,

    // Number of historical questions to include in the prompt for suggestions
    // Larger history uses more tokens
    MAX_HISTORY_SIZE_IN_PROMPT: 10,
};
