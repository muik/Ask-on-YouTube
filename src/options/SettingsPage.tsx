import React, { useEffect, useState } from "react";
import { StorageKeys } from "../constants.js";
import "../css/settings.css";

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
        updateTheme();

        // Listen for changes in system theme
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleThemeChange = (e: MediaQueryListEvent) => {
            document.body.classList.toggle("dark-mode", e.matches);
        };

        mediaQuery.addEventListener("change", handleThemeChange);
        document.body.classList.toggle("dark-mode", mediaQuery.matches);

        return () =>
            mediaQuery.removeEventListener("change", handleThemeChange);
    }, []);

    const loadSavedSettings = () => {
        chrome.storage.sync.get([StorageKeys.GEMINI_API_KEY], (result) => {
            setGeminiAPIKey(result.geminiAPIKey || "");
        });
    };

    const updateTheme = () => {
        const isDark = window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;
        document.body.classList.toggle("dark-mode", isDark);
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
            <h1>
                <img src="../images/icon48.png" alt="Logo" />
                <span>{chrome.i18n.getMessage("shortExtensionName")}</span>
            </h1>
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
            <div className="footer">
                <a href="https://muik.github.io/Ask-on-YouTube/pages/privacy.html">{chrome.i18n.getMessage("privacy")}</a>
                <a
                    href={`mailto:muikor+ytq@gmail.com?subject=[Ask%20on%20YouTube]%20${encodeURIComponent(chrome.i18n.getMessage("feedback"))}`}
                    target="_blank"
                    rel="noreferrer"
                >
                    {chrome.i18n.getMessage("feedback")}
                </a>
                <a 
                    href="https://github.com/muik/Ask-on-YouTube" 
                    target="_blank"
                    rel="noreferrer"
                >
                    GitHub
                </a>
                <span 
                    className="version" 
                    title={`${chrome.i18n.getMessage("shortExtensionName")} v${chrome.runtime.getManifest().version}`}
                >
                    v{chrome.runtime.getManifest().version}
                </span>
            </div>
        </div>
    );
};

export default SettingsPage;
