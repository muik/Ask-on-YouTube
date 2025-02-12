import { requestOCR } from "../src/background/gcloudVisionApi.js";
import {
    getHistoryText,
    requestSuggestedQuestions,
} from "../src/background/suggestQuestions.js";

const items = [
    {
        videoInfo: {
            id: "UC5wjXks2eA",
            title:
                "커다란 집에서 의미없이 돈만 쓰는 삶에 질려버린 미국 부자가 " +
                "해발 2,200미터 축구장 33개 10만 평 산을 통째로 사면 생기는 일｜" +
                "시에라 미국 자연인｜숲이 그린 집｜#골라듄다큐",
            thumbnail: "https://i.ytimg.com/vi/UC5wjXks2eA/hqdefault.jpg",
            caption:
                "TV로 보는\n골라듄다큐\n삶이 공허해진 미국 부자가\n10만 평 산맥을 사면 생기는 일",
        },
        question: "여기서 말하는 미국 부자가 산맥을 사서 어떤 일이 생기나요?",
    },
    {
        videoInfo: {
            id: "JaPrTKncIYs",
            title: "관세폭탄에도 끄떡없는 '죽음의 마약'?...트럼프가 질색하는 펜타닐, 어떻게 미국에 유입되나 봤더니 / 딥빽 / 비디오머그",
            thumbnail: "https://i.ytimg.com/vi/JaPrTKncIYs/hqdefault.jpg",
            caption: "트럼프가 질색하는 '죽음의 마약' 어떻게 유입되나 봤더니",
        },
        question: "펜타닐이 미국에 어떻게 유입이 되나요?",
    },
    {
        videoInfo: {
            id: "D0wq-V95mZI",
            title: `그린란드 미국 땅 되면 "한국이 도울 수도?"..."이건 설득도 필요 없어!" 트럼프와 첫 논의했던 최측근 '섬뜩 경고' (트럼프 NOW) / SBS`,
            thumbnail: "https://i.ytimg.com/vi/D0wq-V95mZI/hqdefault.jpg",
            caption: `그린란드 매입? '다 방법이 있다!' '섬뜩 경고'하며.."한국 도움을?"`,
        },
        question:
            "그린란드 매입에 다 방법이 있다고? 한국은 어떤 도움이 될 수 있나? 섬뜩 경고는 무엇인가?",
    },
];

describe("Gemini API Real Request", () => {
    it("no caption", async () => {
        const videoInfo = {
            id: "6b4SAuzK9Ak",
            title: "New Sourdough Bread Mixing After BIG Change",
        };
        const response = await requestSuggestedQuestions(videoInfo);

        await checkResponse(response);

        // caption is empty string
        expect(response.caption).toBe("");
    });

    it("request suggested questions with default", async () => {
        const item = items[2];
        const videoInfo = item.videoInfo;
        const response = await requestSuggestedQuestions(videoInfo, {
            history: items.slice(0, 2),
        });

        await checkResponse(response);
    });

    it("request suggested questions with system instruction", async () => {
        const systemInstruction = `You are an AI assistant that helps users quickly gauge what a YouTube video is about before watching. Based on the video’s title, thumbnail, and the user’s question history, you will:

1. **Suggest 1 to 3 pre-viewing questions in Korean** that:
  * Directly relate to the video’s content as implied by the title and thumbnail.
  * Spark curiosity or pinpoint key information users might want before watching.
  * Sound natural and reflect the user’s past interests.
2. **Provide the "caption"**: the exact text from the thumbnail (or \`null\` if there is no text).

Your goal is to help users decide if the video is relevant to them and quickly understand what it covers—before they invest time in viewing.`;

        const item = items[2];
        const videoInfo = item.videoInfo;
        const response = await requestSuggestedQuestions(videoInfo, {
            history: items.slice(0, 2),
            systemInstruction,
        });

        await checkResponse(response);
    });

    it("request suggested questions with ocr", async () => {
        const systemInstruction = `You are an AI assistant designed to help users quickly **discover what they are curious about or get desired information** from YouTube videos **before watching them**. You will suggest questions based on the video's title and thumbnail to help users **easily and quickly ask questions to satisfy their curiosity or find necessary information**.

Your response should include the following:
* **\`"questions"\`: An array of strings, each representing a question in Korean. You should suggest between 1 and 3 questions. These questions should be:
    * **Relevant:** Directly related to the content implied by the video title and thumbnail.
    * **Insightful for pre-viewing:** Help users quickly grasp the main topic, purpose, or key takeaways of the video *before* watching.
    * **Targeted for curiosity/information:** Address what a user might be curious about or what specific information they might want to know quickly.
    * **Naturally phrased:** Sound like questions a user would actually ask when trying to quickly understand a video's content *before watching*.
    * **Referenced by the user's question history**: Consider the user's past questions to suggest questions aligned with their likely pre-viewing interests and information needs.`;

        const schema = {
            type: "object",
            properties: {
                questions: { type: "array", items: { type: "string" } },
            },
            required: ["questions"],
        };

        const item = items[2];
        const videoInfo = item.videoInfo;
        const history = items.slice(0, 2);

        const startTime = Date.now();
        const caption = await requestOCR(videoInfo.thumbnail);
        console.log("ocr request time sec:", (Date.now() - startTime) / 1000);
        console.log("caption:", caption);

        const historyInline = getHistoryText(history);
        const promptText = `A YouTube video's the title: \`${videoInfo.title}\` and the caption of it's thumbnail image: \`${caption}\`.

Your task is to analyze the provided YouTube video title, thumbnail image caption, and the user's recent question history. Based on this information, you should suggest questions that a user might naturally ask to **quickly understand what the video is about, determine if it's relevant to their interests, or extract specific information without having to watch the entire video.**

The user's recent question history:
${historyInline}`;

        const response = await requestSuggestedQuestions(videoInfo, {
            history,
            promptText,
            imageUrl: null,
            systemInstruction,
            responseSchema: schema,
        });
        console.log("total request time sec:", (Date.now() - startTime) / 1000);
        console.log("response:", response);

        expect(response.questions).toBeDefined();

        const questions = response.questions;
        expect(questions.length).toBeGreaterThan(0);
        expect(questions.length).toBeLessThanOrEqual(3);

        expect(response.caption).not.toBeDefined();
    });
});

async function checkResponse(response) {
    console.log("response:", response);

    expect(response.questions).toBeDefined();

    const questions = response.questions;
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.length).toBeLessThanOrEqual(3);

    expect(response.caption).toBeDefined();
    expect(typeof response.caption).toBe("string");
}
