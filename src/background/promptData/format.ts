export function formatInlineText(text: string): string {
    return text.replace(/\n/g, " ").replace(/\s\s+/g, " ");
}
