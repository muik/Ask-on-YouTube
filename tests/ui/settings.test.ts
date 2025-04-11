/// <reference types="jest" />
import puppeteer, { Browser, Page } from "puppeteer";

const EXTENSION_PATH = "./dist";
const EXTENSION_ID = "gdcabhbeojofokajoomgoclohimfnfjb";

describe("Settings page Test", () => {
    let browser: Browser | undefined;

    beforeEach(async () => {
        browser = await puppeteer.launch({
            args: [
                `--disable-extensions-except=${EXTENSION_PATH}`,
                `--load-extension=${EXTENSION_PATH}`,
            ],
        });
    });

    afterEach(async () => {
        if (browser) {
            await browser.close();
            browser = undefined;
        }
    });

    it("Settings page renders correctly", async () => {
        if (!browser) {
            throw new Error("Browser is not initialized");
        }
        const page: Page = await browser.newPage();
        await page.goto(`chrome-extension://${EXTENSION_ID}/index.html#/settings`);
        
        const language: string = await page.evaluate(() => {
            return navigator.language;
        });

        if (language.startsWith("ko")) {
            await page.waitForFunction(
                () => document.title.includes("설정 - YouTube 질문하기"),
                { timeout: 200 }
            );
            const title = await page.evaluate(() => document.title);
            expect(title).toContain("설정 - YouTube 질문하기");
        } else {
            await page.waitForFunction(
                () => document.title.includes("Settings - Ask on YouTube"),
                { timeout: 200 }
            );
            const title = await page.evaluate(() => document.title);
            expect(title).toContain("Settings - Ask on YouTube");
        }
    });
});
