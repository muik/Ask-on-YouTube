export interface Messages {
    transcript: string;
    title: string;
    caption: string;
    description: string;
    transcriptPagingFormat: string;
    comments: string;
}

export const promptDivider = "------------";

export const messages: Record<string, Messages> = {
    en: {
        transcript: "Transcript",
        title: "Title",
        caption: "Subtitle",
        description: "Description",
        transcriptPagingFormat: "Transcript (page {pageIndex} of {pagesCount})",
        comments: "Comments",
    },
    ko: {
        transcript: "자막",
        title: "제목",
        caption: "부제목",
        description: "설명(더보기)",
        transcriptPagingFormat: "자막 ({pageIndex} / {pagesCount} 페이지)",
        comments: "댓글",
    },
};

export function getMessage(langCode: string): Messages {
    return messages[langCode] || messages.en;
}
