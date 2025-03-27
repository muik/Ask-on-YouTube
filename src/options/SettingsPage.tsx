import React, { useEffect, useState } from "react";
import { StorageKeys } from "../constants.js";
import "../css/options.css";

const GeminiDescription: React.FC = () => {
    return (
        <p className="description">
            {chrome.i18n.getMessage("geminiAPIDescription").split("<a")[0]}
            <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
            >
                Get API Key
            </a>
            {" for free!"}
        </p>
    );
};

const SettingsPage: React.FC = () => {
    const [geminiAPIKey, setGeminiAPIKey] = useState<string>("");
    const [statusMessage, setStatusMessage] = useState<string>("");
    const [isScreenshotOpen, setIsScreenshotOpen] = useState<boolean>(false);
    const [showApiKey, setShowApiKey] = useState<boolean>(false);

    useEffect(() => {
        setMessages();
        loadSavedSettings();
    }, []);

    const loadSavedSettings = () => {
        chrome.storage.sync.get([StorageKeys.GEMINI_API_KEY], (result) => {
            setGeminiAPIKey(result.geminiAPIKey || "");
        });
    };

    const setMessages = () => {
        document.title = `${chrome.i18n.getMessage(
            "settings"
        )} - ${chrome.i18n.getMessage("shortExtensionName")}`;
    };

    const debounce = <T extends (...args: any[]) => void>(
        func: T,
        delay: number
    ): ((...args: Parameters<T>) => void) => {
        let timeout: NodeJS.Timeout;
        return (...args: Parameters<T>) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    };

    const saveSetting = (key: string, value: string) => {
        chrome.storage.sync.set({ [key]: value }, () => {
            setStatusMessage(chrome.i18n.getMessage("saved"));
            setTimeout(() => setStatusMessage(""), 2000);
        });
    };

    const debouncedSaveSetting = debounce(saveSetting, 500);

    const handleGeminiAPIKeyChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = e.target.value;
        setGeminiAPIKey(value);
        debouncedSaveSetting(StorageKeys.GEMINI_API_KEY, value);
    };

    return (
        <div className="container">
            <h2>{chrome.i18n.getMessage("settings")}</h2>

            <h3>Gemini API</h3>
            <GeminiDescription />
            <div>
                <div className="inline-label-input">
                    <label htmlFor="geminiAPIKey">API Key</label>
                    <div className="input-with-button">
                        <input
                            type={showApiKey ? "text" : "password"}
                            id="geminiAPIKey"
                            value={geminiAPIKey}
                            onChange={handleGeminiAPIKeyChange}
                            placeholder={chrome.i18n.getMessage(
                                "geminiAPIKeyPlaceholder"
                            )}
                        />
                        <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="show-hide-button"
                            aria-label={showApiKey ? chrome.i18n.getMessage("hideAPIKey") : chrome.i18n.getMessage("showAPIKey")}
                        >
                            {showApiKey ? chrome.i18n.getMessage("hide") : chrome.i18n.getMessage("show")}
                        </button>
                    </div>
                </div>
                <div
                    className={`status-message ${
                        statusMessage ? "visible" : ""
                    }`}
                >
                    {statusMessage}
                </div>
            </div>
            <div
                className="screenshot-container"
                data-opened={isScreenshotOpen}
            >
                <div
                    className="screenshot-title"
                    onClick={() => setIsScreenshotOpen(!isScreenshotOpen)}
                >
                    <span
                        className={`toggle-icon ${
                            isScreenshotOpen ? "opened" : "closed"
                        }`}
                    >
                        {isScreenshotOpen ? "▼" : "▶"}
                    </span>
                    <span className="text">
                        {chrome.i18n.getMessage("exampleScreenshot")}
                    </span>
                </div>
                <div 
                    className="screenshots-wrapper"
                >
                    <img
                        src="../images/settings/question-dialog-zoom.png"
                        alt="Example question dialog screenshot"
                    />
                    <img
                        src="../images/settings/dialog-suggestions-zoom.png"
                        alt="Example suggestions screenshot"
                    />
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
