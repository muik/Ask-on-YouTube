// Mock messages for testing
const mockMessages = {
    en: {
        defaultQuestion1: { message: "What is this video about?" },
        defaultQuestion2: { message: "Can you explain the main points?" },
        defaultQuestion3: { message: "What are the key takeaways?" }
    },
    ja: {
        defaultQuestion1: { message: "この動画は何についてですか？" },
        defaultQuestion2: { message: "主なポイントを説明してください。" },
        defaultQuestion3: { message: "重要なポイントは何ですか？" }
    }
};

// Mock fetch function for message loading
global.fetch = jest.fn().mockImplementation((url: string) => {
    const matches = url.match(/\/_locales\/(\w+)\/messages\.json$/);
    if (!matches) {
        return Promise.reject(new Error(`Invalid URL: ${url}`));
    }

    const lang = matches[1];
    const messages = mockMessages[lang as keyof typeof mockMessages];

    if (!messages) {
        return Promise.resolve({
            status: 404,
            ok: false
        });
    }

    return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(messages)
    });
}); 