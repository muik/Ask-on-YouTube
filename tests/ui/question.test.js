import puppeteer from "puppeteer";
import { getElementAttr, getElementText, waitAndClick } from "./helpers";

const EXTENSION_PATH = "./dist";

describe("Question dialog Test", () => {
    let browser;
    let page;

    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                `--disable-extensions-except=${EXTENSION_PATH}`,
                `--load-extension=${EXTENSION_PATH}`,
            ],
        });

        closeWelcomePage(browser);
    });

    afterAll(async () => {
        if (browser) {
            await browser.close();
            browser = null;
        }
    });

    beforeEach(async () => {
        page = await browser.newPage();
        await page.setViewport({ width: 800, height: 600 });

        // Optimize page load by not waiting for non-essential resources
        await page.setDefaultNavigationTimeout(10000);
        await page.setDefaultTimeout(5000);
    });

    afterEach(async () => {
        if (page) {
            await page.close();
        }
    });

    it("Question menu use mark is shown when first time", async () => {
        await page.goto("https://www.youtube.com/watch?v=kSgIRBvxiDo");
        const moreOptionButtonSelector = moreOptionButtonTypes[0].selector;
        await waitAndClick(page, moreOptionButtonSelector);

        const extraOptionsSelector =
            "tp-yt-iron-dropdown.ytd-popup-container:not([aria-hidden='true']) .ytq-extra-options";
        await page.waitForSelector(extraOptionsSelector, { timeout: 2000 });

        const useMarkSelector = `${extraOptionsSelector} .vertical-menu .use-mark`;
        await page.waitForSelector(useMarkSelector, { timeout: 2000 });

        // click quesuseMarkElement useMarkElement tion menu
        const questionButtonSelector = ".option-item[target-value=question]";
        await waitAndClick(page, questionButtonSelector);

        const questionDialogSelector = "ytd-popup-container #dialog-container";
        await page.waitForSelector(questionDialogSelector, { timeout: 2000 });

        // Close question dialog
        await waitAndClick(page, `${questionDialogSelector} #close-button`);
        await page.waitForSelector(questionDialogSelector, {
            timeout: 2000,
            hidden: true,
        });

        // click more option button
        await waitAndClick(page, moreOptionButtonSelector);
        await page.waitForSelector(extraOptionsSelector, { timeout: 2000 });

        // Check if useMarkElement is removed
        await page.waitForSelector(useMarkSelector, {
            timeout: 2000,
            hidden: true,
        });
    });

    const runCommonTestFlow = async (page, moreOptionButtonSelector) => {
        // Common interaction flow
        await waitAndClick(page, moreOptionButtonSelector);

        const extraOptionsSelector =
            "tp-yt-iron-dropdown.ytd-popup-container:not([aria-hidden='true']) .ytq-extra-options";
        await page.waitForSelector(extraOptionsSelector, { timeout: 1000 });

        const questionButtonSelector = ".option-item[target-value=question]";
        await waitAndClick(page, questionButtonSelector);

        const questionDialogSelector = "ytd-popup-container #dialog-container";
        await page.waitForSelector(questionDialogSelector, { timeout: 1000 });

        const contentsSelector = `${questionDialogSelector} #contents`;
        await page.waitForSelector(contentsSelector, {
            timeout: 1000,
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
            selector:
                "ytd-compact-video-renderer yt-icon-button button#button .yt-icon > div",
            name: "video-list",
        },
    ];

    const loadYoutubePage = async (videoId) => {
        await page.goto(`https://www.youtube.com/watch?v=${videoId}`, {
            waitUntil: "domcontentloaded", // Don't wait for full page load
        });
    };

    moreOptionButtonTypes.forEach((type) => {
        it(`Question dialog renders correctly for ${type.name}`, async () => {
            await loadYoutubePage("_CcYSnoZytk");
            await runCommonTestFlow(page, type.selector);
        });
    });

    it("Input question on ChatGPT from simple question form correctly", async () => {
        await loadYoutubePage("kSgIRBvxiDo");
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

async function closeWelcomePage(browser) {
    const welcomePageUrl =
        "https://muik.github.io/Ask-on-YouTube/pages/welcome.html";
    const welcomePage = await browser.waitForTarget(
        (target) => target.url().match(welcomePageUrl),
        { timeout: 3000 }
    );
    const welcomePageTab = await welcomePage.page();
    await welcomePageTab.close();
}
