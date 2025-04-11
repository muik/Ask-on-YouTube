import React from "react";

const Footer: React.FC = () => {
    return (
        <div className="footer">
            <a href="https://muik.github.io/Ask-on-YouTube/pages/privacy.html">
                {chrome.i18n.getMessage("privacy")}
            </a>
            <a
                href={`mailto:ytq.extension@gmail.com?subject=[Ask%20on%20YouTube]%20${encodeURIComponent(
                    chrome.i18n.getMessage("feedback")
                )}`}
                rel="noreferrer"
            >
                {chrome.i18n.getMessage("feedback")}
            </a>
            <a href="https://github.com/muik/Ask-on-YouTube" rel="noreferrer">
                GitHub
            </a>
            <span
                className="version"
                title={`${chrome.i18n.getMessage("shortExtensionName")} v${
                    chrome.runtime.getManifest().version
                }`}
            >
                v{chrome.runtime.getManifest().version}
            </span>
        </div>
    );
};

export default Footer;
