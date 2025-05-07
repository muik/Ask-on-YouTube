interface Config {
    /** Maximum number of questions to display below the input box in the question dialog */
    MAX_QUESTIONS_COUNT: number;

    /** Maximum number of questions to store in history
     * Used for calculating favorite questions
     * Larger history provides more accurate favorites but increases load/save time
     */
    MAX_HISTORY_SIZE: number;

    /** Number of historical questions to include in the prompt for suggestions
     * Larger history uses more tokens
     */
    MAX_HISTORY_SIZE_IN_PROMPT: number;

    /** Referral code for the extension */
    REF_CODE: string;

    /** Inclusions for the question dialog */
    INCLUSIONS_ENABLED: boolean;
}

const Config: Config = {
    MAX_QUESTIONS_COUNT: 5,
    MAX_HISTORY_SIZE: 500,
    MAX_HISTORY_SIZE_IN_PROMPT: 10,
    REF_CODE: "ytq",
    INCLUSIONS_ENABLED: true,
};

export default Config; 