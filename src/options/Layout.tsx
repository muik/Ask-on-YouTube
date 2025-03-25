import { History, Settings } from "lucide-react";
import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../css/settings.css";
import Footer from "./Footer";

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();

    return (
        <div className="app-layout">
            <div className="top-bar">
                <div className="app-name">
                    <img src="../images/icon48.png" alt="Logo" />
                    <span>{chrome.i18n.getMessage("shortExtensionName")}</span>
                </div>
            </div>
            <div className="content-wrapper">
                <div className="left-panel">
                    <nav className="nav-menu">
                        <Link
                            to="/settings"
                            className={`nav-item ${
                                location.pathname === "/settings" ? "active" : ""
                            }`}
                        >
                            <Settings size={18} strokeWidth={1.5} />
                            <span>{chrome.i18n.getMessage("settings")}</span>
                        </Link>
                        <Link
                            to="/history"
                            className={`nav-item ${
                                location.pathname === "/history" ? "active" : ""
                            }`}
                        >
                            <History size={18} strokeWidth={1.5} />
                            <span>{chrome.i18n.getMessage("history")}</span>
                        </Link>
                    </nav>
                    <Footer />
                </div>
                <div className="main-content">{children}</div>
            </div>
        </div>
    );
};

export default Layout; 