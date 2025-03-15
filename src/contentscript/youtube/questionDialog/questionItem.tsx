import React from 'react';

interface QuestionItemProps {
    question: string;
    onQuestionClick: () => void;
    onRequestClick: () => void;
}

const QuestionItem: React.FC<QuestionItemProps> = ({ question, onQuestionClick, onRequestClick }) => {
    return (
        <li>
            <span className="question" onClick={onQuestionClick}>
                {question}
            </span>
            <button className="request" onClick={onRequestClick}>
                &gt;
            </button>
        </li>
    );
};

export default QuestionItem; 