import QuestionItem from "./questionItem";

interface QuestionListProps {
    questions: string[];
}

export function QuestionList({ questions }: QuestionListProps) {
    return (
        <ul className="suggestions">
            {questions.map((question, index) => (
                <QuestionItem key={index} question={question} />
            ))}
        </ul>
    );
}
