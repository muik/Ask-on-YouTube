import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import HistoryPage from "./HistoryPage";
import Layout from "./Layout";
import SettingsPage from "./SettingsPage";

const container = document.getElementById("root");
if (!container) {
    throw new Error("Root element not found");
}
const root = createRoot(container);
root.render(
    <React.StrictMode>
        <HashRouter>
            <Layout>
                <Routes>
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/" element={<Navigate to="/settings" replace />} />
                </Routes>
            </Layout>
        </HashRouter>
    </React.StrictMode>
);
