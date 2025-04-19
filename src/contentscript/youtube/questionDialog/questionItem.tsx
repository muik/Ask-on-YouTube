import React from "react";
import { textToInputClickListener } from "./textToInputClickListener";

interface QuestionItemProps {
    question: string;
}

const QuestionItem: React.FC<QuestionItemProps> = ({ question }) => {
    return (
        <li>
            <span className="question" onClick={handleQuestionItemClick}>
                {question}
            </span>
            <button className="option" onClick={handleQuestionOptionClick}>
                <UpLeftSvg />
            </button>
        </li>
    );
};

// up left svg icon
const UpLeftSvg = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14">
            <path d="M3.278 2.758h.457l.442-.001h.276l.864-.001.998-.001.771-.001.461-.001h.809l.064-.001c.13.001.219.024.33.093a.57.57 0 0 1 .174.364.6.6 0 0 1-.12.32.58.58 0 0 1-.416.141l-.108.001h-.118l-.124.001-.338.002-.353.002-.669.004-.762.004-1.568.009.043.043 2.805 2.802.06.06.97.968.994.993.614.613.421.42.243.243.222.222.081.08.109.109.061.061c.109.124.116.23.113.391a.44.44 0 0 1-.118.267c-.136.109-.245.122-.417.124-.212-.041-.365-.242-.51-.388l-.082-.082-.225-.226-.243-.243-.421-.422-.609-.609-.988-.989-.959-.961-.06-.06-.297-.297-2.464-2.464v.065l-.005 1.571-.002.76-.002.662-.001.35-.001.33v.121c.001.218-.001.386-.125.571a.55.55 0 0 1-.438.137.57.57 0 0 1-.328-.246c-.034-.101-.031-.195-.031-.301V8.3l-.001-.227-.001-.163-.001-.442v-.276l-.001-.863q0-.499-.002-.997l-.001-.77-.001-.46v-.433l-.001-.159v-.217l-.001-.064a.46.46 0 0 1 .124-.329c.14-.124.224-.141.407-.141" />
        </svg>
    );
};

function handleQuestionItemClick(e: React.MouseEvent<HTMLSpanElement>) {
    e.preventDefault();

    const target = e.target as HTMLElement;
    if (!target) {
        return;
    }

    // set question input value
    (target.closest("li")?.querySelector("button.option") as HTMLButtonElement)?.click();

    // request question
    (
        target
            .closest("#contents")
            ?.querySelector(".question-input-container .question-button") as HTMLButtonElement
    )?.click();
}

function handleQuestionOptionClick(e: React.MouseEvent<HTMLButtonElement>) {
    const questionElement = (e.target as HTMLElement).closest("li")?.querySelector("span.question");
    if (!questionElement) {
        return;
    }

    const newEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
    });
    Object.defineProperty(newEvent, "target", {
        value: questionElement,
    });
    textToInputClickListener(newEvent as unknown as MouseEvent);
}

export default QuestionItem;
