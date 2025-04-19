import { QuestionOptionKeys } from "../../../constants";

interface QuestionOptionsProps {
    selectedOption: string | null;
    setSelectedOption: (option: string) => void;
}

export function QuestionOptions({ selectedOption, setSelectedOption }: QuestionOptionsProps) {
    const options = [
        {
            label: chrome.i18n.getMessage("favorites"),
            key: QuestionOptionKeys.FAVORITES,
        },
        {
            label: chrome.i18n.getMessage("suggestions"),
            key: QuestionOptionKeys.SUGGESTIONS,
        },
        {
            label: chrome.i18n.getMessage("recents"),
            key: QuestionOptionKeys.RECENTS,
        },
    ];

    return (
        <div className="question-options">
            {options.map(option => (
                <span
                    className={`title ${selectedOption === option.key ? "active" : ""}`}
                    data-option={option.key}
                    onClick={() => setSelectedOption(option.key)}
                >
                    {option.label}
                </span>
            ))}
        </div>
    );
}