import { QuestionMarkIcon } from "../components/SimpleQuestionForm";
import { onExtraOptionClick } from "./elements";
import { useQuestionMenuUseMark } from "./useQuestionMenuUseMark";

const questionText = chrome.i18n.getMessage("questionButtonText");
const shortcutTooltip = chrome.i18n.getMessage("questionShortcutTooltip");

export function QuestionOptionMenu() {
    const { questionMenuUsedBefore, markAsUsed } = useQuestionMenuUseMark();

    return (
        <div
            className="vertical-menu option-item"
            target-value="question"
            onClick={e => {
                onExtraOptionClick(e);
                markAsUsed();
            }}
        >
            <div className="icon">
                <QuestionMarkIcon />
            </div>
            <span className="text">{questionText}</span>
            <span className="shortcut" title={shortcutTooltip}>
                q
            </span>
            {questionMenuUsedBefore === false && <div className="use-mark" />}
        </div>
    );
}
