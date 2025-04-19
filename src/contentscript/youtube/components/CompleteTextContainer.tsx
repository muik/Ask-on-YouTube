interface CompleteTextContainerProps {
    currentText: string;
    completedText: string;
}

export const CompleteTextContainer = ({
    currentText,
    completedText,
}: CompleteTextContainerProps) => {
    return (
        <div>
            <span className="typed-text">{currentText}</span>
            <span className="suggestion-text">{completedText.substring(currentText.length)}</span>
            <span className="ytq-auto-complete-tab-hint"> [Tab]</span>
        </div>
    );
};
