import puppeteer from "puppeteer";
import { waitAndClick } from "./helpers";

const EXTENSION_PATH = "./dist";

describe("Ask Test", () => {
    let browser;

    beforeEach(async () => {
        browser = await puppeteer.launch({
            headless: false,
            args: [
                `--disable-extensions-except=${EXTENSION_PATH}`,
                `--load-extension=${EXTENSION_PATH}`,
                "--no-sandbox",
                "--disable-setuid-sandbox",
            ],
        });
    });

    afterEach(async () => {
        if (browser) {
            await browser.close();
            browser = null;
        }
    });

    const openYouTubeAndClickMoreOptions = async (page) => {
        await page.setViewport({ width: 1024, height: 768 });
        await page.goto("https://www.youtube.com/watch?v=kSgIRBvxiDo", {
            waitUntil: ["networkidle0", "domcontentloaded"],
        });

        expect(await page.title()).toContain("YouTube");

        const moreOptionButtonSelector =
            "#actions-inner #button-shape>button div.yt-spec-touch-feedback-shape__fill";
        await waitAndClick(page, moreOptionButtonSelector);

        const extraOptionsSelector =
            "tp-yt-iron-dropdown.ytd-popup-container:not([aria-hidden='true']) #extra-options";
        await page.waitForSelector(extraOptionsSelector, { timeout: 2000 });
    };

    const testOptionNavigation = async (
        optionValue,
        expectedUrl,
        expectedTitle
    ) => {
        const page = await browser.newPage();
        await openYouTubeAndClickMoreOptions(page);

        const optionButtonSelector = `.option-item[target-value=${optionValue}]`;
        await waitAndClick(page, optionButtonSelector);

        const newTarget = await browser.waitForTarget(
            (target) => target.url().startsWith(expectedUrl),
            { timeout: 5000 }
        );

        expect(newTarget.url()).toContain(expectedUrl);
        const newPage = await newTarget.page();
        await newPage.setViewport({ width: 1024, height: 768 });
        await newPage.waitForSelector("title", { timeout: 5000 });
        expect(await newPage.title()).toContain(expectedTitle);
    };

    it("Ask to ChatGPT", async () => {
        await testOptionNavigation(
            "chatgpt",
            "https://chatgpt.com/",
            "ChatGPT"
        );
    });

    it("Ask to Gemini", async () => {
        await testOptionNavigation(
            "gemini",
            "https://gemini.google.com/app",
            "Gemini"
        );
    });
});
