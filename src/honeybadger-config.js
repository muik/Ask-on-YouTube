// Honeybadger configuration
const config = {
    apiKey: "hbp_3jSfbmWLloU7jlmLHm6IiD9JebrjGz4wnmUY",
    environment: process.env.NODE_ENV || "production",
    revision: chrome.runtime.getManifest().version,
    debug: process.env.NODE_ENV === "development",
    reportData: true, // Send request data to Honeybadger
    enableUncaught: true, // Report uncaught exceptions
    enableUnhandledRejection: true, // Report unhandled promise rejections
    breadcrumbsEnabled: true, // Enable breadcrumbs for better debugging
};

export default config;
