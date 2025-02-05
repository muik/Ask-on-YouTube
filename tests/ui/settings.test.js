import puppeteer from "puppeteer";

const EXTENSION_PATH = "./dist";
const EXTENSION_ID = "ggjafkbkebneofgnochpcefafnekbgkn";

describe("Settings page Test", () => {
    let browser;

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
            browser = null;
        }
    });

    it("Settings page renders correctly", async () => {
        const page = await browser.newPage();
        await page.goto(`chrome-extension://${EXTENSION_ID}/settings.html`);
        const title = await page.title();
        expect(title).toContain("Extension Settings");
    });
});
