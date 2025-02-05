import puppeteer from "puppeteer";
import { getElementAttr, getElementText, waitAndClick } from "./helpers";

const EXTENSION_PATH = "./dist";

describe("Question dialog Test", () => {
    let browser;

    beforeEach(async () => {
        browser = await puppeteer.launch({
            headless: false,
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

    const runCommonTestFlow = async (page, moreOptionButtonSelector) => {
        // Common interaction flow
        await waitAndClick(page, moreOptionButtonSelector);

        const extraOptionsSelector =
            "tp-yt-iron-dropdown.ytd-popup-container:not([aria-hidden='true']) #extra-options";
        await page.waitForSelector(extraOptionsSelector, { timeout: 2000 });

        const questionButtonSelector = ".option-item[target-value=question]";
        await waitAndClick(page, questionButtonSelector);

        const questionDialogSelector = "ytd-popup-container #dialog-container";
        await page.waitForSelector(questionDialogSelector, { timeout: 2000 });

        // Wait for spinner and contents
        const spinnerSelector = `${questionDialogSelector} #spinner`;
        await page.waitForSelector(`${spinnerSelector}:not([hidden])`, {
            timeout: 2000,
        });
        await page.waitForSelector(`${spinnerSelector}[hidden]`, {
            timeout: 3000,
        });

        const contentsSelector = `${questionDialogSelector} #contents`;
        await page.waitForSelector(contentsSelector, {
            timeout: 2000,
            hidden: false,
        });

        // Validate dialog contents
        const dialogTitle = await getElementText(
            page,
            questionDialogSelector,
            "#contents .title"
        );
        expect(dialogTitle).not.toBe("");
        expect(dialogTitle.length).toBeGreaterThan(0);

        const thumbnailUrl = await getElementAttr(
            page,
            questionDialogSelector,
            "#contents img.thumbnail"
        );
        expect(thumbnailUrl).toMatch(/^https:\/\/i\.ytimg\.com\/vi\//);

        // Cleanup
        await waitAndClick(page, `${questionDialogSelector} #close-button`);
        await page.waitForSelector(questionDialogSelector, {
            timeout: 2000,
            hidden: true,
        });
    };

    const moreOptionButtonTypes = [
        {
            selector:
                "#actions-inner #button-shape>button div.yt-spec-touch-feedback-shape__fill",
            name: "main",
        },
        {
            selector: "ytd-compact-video-renderer yt-icon-button button#button",
            name: "video-list",
        },
    ];

    moreOptionButtonTypes.forEach((type) => {
        it(`Question dialog renders correctly for ${type.name}`, async () => {
            const page = await browser.newPage();
            await page.setViewport({ width: 1024, height: 768 });
            await page.goto("https://www.youtube.com/watch?v=_CcYSnoZytk", {
                waitUntil: ["networkidle0", "domcontentloaded"],
            });

            const title = await page.title();
            expect(title).toContain("YouTube");

            await runCommonTestFlow(page, type.selector);
        });
    });
});
