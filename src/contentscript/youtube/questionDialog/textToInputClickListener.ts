import { containerId } from "./container";

export function textToInputClickListener(e: React.MouseEvent<HTMLElement>) {
    e.preventDefault();

    const target = e.target as HTMLElement;
    const text = target.textContent?.replace(/\n/g, " ").replace("  ", ", ").trim();

    if (text) {
        const containerElement = target.closest(`#${containerId}`);
        const inputElement = containerElement?.querySelector(
            "textarea.question-input"
        ) as HTMLTextAreaElement | null;
        if (inputElement) {
            inputElement.value = text;

            // focus on the input field, and move the cursor to the end of the text
            inputElement.focus();
            inputElement.setSelectionRange(text.length, text.length);
            inputElement.dispatchEvent(new CustomEvent("input"));
        }
    }
}
