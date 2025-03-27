import { render } from "preact";
import React from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import HistoryPage from "./HistoryPage";
import Layout from "./Layout";
import SettingsPage from "./SettingsPage";

const container = document.getElementById("root");
if (!container) {
    throw new Error("Root element not found");
}
render(
    <React.StrictMode>
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Layout>
                <Routes>
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/" element={<Navigate to="/history" replace />} />
                </Routes>
            </Layout>
        </HashRouter>
    </React.StrictMode>,
    container
);
