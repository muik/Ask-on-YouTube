const Config = {
    // Maximum number of questions to display below the input box in the question dialog
    MAX_QUESTIONS_COUNT: 5,

    // Maximum number of questions to store in history
    // Used for calculating favorite questions
    // Larger history provides more accurate favorites but increases load/save time
    MAX_HISTORY_SIZE: 30,

    // Number of historical questions to include in the prompt for suggestions
    // Larger history uses more tokens
    MAX_HISTORY_SIZE_IN_PROMPT: 10,

    // Referral code for the extension
    REF_CODE: "ytq",
};

// Honeybadger configuration
export const honeybadgerConfig = {
    apiKey: "hbp_3jSfbmWLloU7jlmLHm6IiD9JebrjGz4wnmUY",
    environment: process.env.NODE_ENV || "production",
    revision: chrome.runtime.getManifest().version,
    debug: process.env.NODE_ENV === "development",
    reportData: true, // Send request data to Honeybadger
    enableUncaught: true, // Report uncaught exceptions
    enableUnhandledRejection: true, // Report unhandled promise rejections
    breadcrumbsEnabled: true, // Enable breadcrumbs for better debugging
};

export default Config;
