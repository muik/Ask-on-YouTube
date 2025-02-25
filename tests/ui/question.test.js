import puppeteer from "puppeteer";
import { getElementAttr, getElementText, waitAndClick } from "./helpers";

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

    const runCommonTestFlow = async (page, moreOptionButtonSelector) => {
        // Common interaction flow
        await waitAndClick(page, moreOptionButtonSelector);

        const extraOptionsSelector =
            "tp-yt-iron-dropdown.ytd-popup-container:not([aria-hidden='true']) .ytq-extra-options";
        await page.waitForSelector(extraOptionsSelector, { timeout: 2000 });

        const questionButtonSelector = ".option-item[target-value=question]";
        await waitAndClick(page, questionButtonSelector);

        const questionDialogSelector = "ytd-popup-container #dialog-container";
        await page.waitForSelector(questionDialogSelector, { timeout: 2000 });

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

    it("Input question on ChatGPT from simple question form correctly", async () => {
        const page = await browser.newPage();
        await page.setViewport({ width: 1024, height: 768 });
        await page.goto("https://www.youtube.com/watch?v=kSgIRBvxiDo");

        await waitAndClick(
            page,
            "#ytq-detail-related-above .question-input-container button"
        );

        const newTarget = await browser.waitForTarget(
            (target) => target.url().startsWith("https://chatgpt.com/"),
            { timeout: 5000 }
        );
        expect(newTarget.url()).toContain("https://chatgpt.com/");

        // works on headless false
        // const newPage = await newTarget.page();
        // await newPage.setViewport({ width: 1024, height: 768 });
        // await newPage.waitForSelector("title", { timeout: 5000 });
        // expect(await newPage.title()).toContain("ChatGPT");
    });

    it("Input question on ChatGPT from question dialog correctly", async () => {
        const page = await browser.newPage();
        await page.setViewport({ width: 1024, height: 768 });
        await page.goto("https://www.youtube.com/watch?v=kSgIRBvxiDo");

        const moreOptionButtonSelector = moreOptionButtonTypes[0].selector;
        await waitAndClick(page, moreOptionButtonSelector);

        const extraOptionsSelector =
            "tp-yt-iron-dropdown.ytd-popup-container:not([aria-hidden='true']) .ytq-extra-options";
        await page.waitForSelector(extraOptionsSelector, { timeout: 2000 });

        const questionButtonSelector = ".option-item[target-value=question]";
        await waitAndClick(page, questionButtonSelector);

        const questionDialogSelector = "ytd-popup-container #dialog-container";
        await page.waitForSelector(questionDialogSelector, { timeout: 2000 });

        await waitAndClick(page, "#dialog-container button.question-button");

        const newTarget = await browser.waitForTarget(
            (target) => target.url().startsWith("https://chatgpt.com/"),
            { timeout: 5000 }
        );
        expect(newTarget.url()).toContain("https://chatgpt.com/");

        // works on headless false
        // const newPage = await newTarget.page();
        // await newPage.setViewport({ width: 1024, height: 768 });
        // await newPage.waitForSelector("title", { timeout: 5000 });
        // expect(await newPage.title()).toContain("ChatGPT");
    });
});
