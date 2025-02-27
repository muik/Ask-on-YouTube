import puppeteer from "puppeteer";
import { waitAndClick } from "./helpers.js";

const EXTENSION_PATH = "./dist";

describe("Question dialog Test", () => {
    let browser;

    beforeEach(async () => {
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                `--disable-extensions-except=${EXTENSION_PATH}`,
                `--load-extension=${EXTENSION_PATH}`,
            ],
        });
    });

    afterEach(async () => {
        if (browser) {
            await browser.close();
            browser = null;
        }
    });

    it("should send transcript to chatgpt", async () => {
        const page = await browser.newPage();
        await page.setViewport({ width: 1024, height: 768 });
        await page.goto("https://www.youtube.com/watch?v=kSgIRBvxiDo");

        const askButtonSelector =
            "#ytq-detail-related-above .question-input-container button";
        await waitAndClick(page, askButtonSelector);

        const newTarget = await browser.waitForTarget(
            (target) => target.url().startsWith("https://chatgpt.com/"),
            { timeout: 3000 }
        );
        expect(newTarget.url()).toContain("https://chatgpt.com/");

        // await page.waitForSelector("#prompt-textarea", { timeout: 5000 });
    });
});
