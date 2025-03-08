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
        await page.goto(`chrome-extension://${EXTENSION_ID}/settings.html`);
        const title: string = await page.title();

        const language: string = await page.evaluate(() => {
            return navigator.language;
        });

        if (language.startsWith("ko")) {
            expect(title).toContain("설정 - Ask on YouTube");
        } else {
            expect(title).toContain("Settings - Ask on YouTube");
        }
    });
});
