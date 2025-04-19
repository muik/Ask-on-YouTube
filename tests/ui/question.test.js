import puppeteer from "puppeteer";
import { getElementAttr, waitAndClick } from "./helpers";

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

        // Mock closeWelcomePage to be faster
        const welcomePage = await browser.waitForTarget(
            target => target.url().includes("welcome.html"),
            { timeout: 1000 }
        );
        if (welcomePage) {
            const welcomePageTab = await welcomePage.page();
            await welcomePageTab.close();
        }

        page = await browser.newPage();
        await page.setViewport({ width: 800, height: 600 });

        // Reduce timeouts for faster tests
        page.setDefaultNavigationTimeout(3000);
        page.setDefaultTimeout(1000);

        // Mock YouTube page load
        await loadYoutubePage("kSgIRBvxiDo");
    });

    afterAll(async () => {
        if (page) {
            await page.close();
        }
        if (browser) {
            await browser.close();
            browser = null;
        }
    });

    it("Question menu use mark is shown when first time", async () => {
        const moreOptionButtonSelector = moreOptionButtonTypes[0].selector;
        await waitAndClick(page, moreOptionButtonSelector);

        const extraOptionsSelector =
            "tp-yt-iron-dropdown.ytd-popup-container:not([aria-hidden='true']) .ytq-extra-options";
        await page.waitForSelector(extraOptionsSelector, { timeout: 1000 });

        // the use mark should be shown
        const useMarkSelector = `${extraOptionsSelector} .vertical-menu .use-mark`;
        await page.waitForSelector(useMarkSelector, { timeout: 1000 });

        // Click the question menu
        const questionButtonSelector = ".option-item[target-value=question]";
        await waitAndClick(page, questionButtonSelector);

        // Wait for the question dialog to be shown
        const questionDialogSelector = "ytd-popup-container #dialog-container";
        await page.waitForSelector(questionDialogSelector, { timeout: 1000 });

        // Close the question dialog
        await waitAndClick(page, `${questionDialogSelector} #close-button`);
        await page.waitForSelector(questionDialogSelector, {
            timeout: 1000,
            hidden: true,
        });

        // Open the more option button again
        await waitAndClick(page, moreOptionButtonSelector);
        await page.waitForSelector(extraOptionsSelector, { timeout: 1000 });

        // the use mark should be hidden
        await page.waitForSelector(useMarkSelector, {
            timeout: 1000,
            hidden: true,
        });

        // Close the more option
        await waitAndClick(page, moreOptionButtonSelector);
        const hideExtraOptionsSelector =
            "tp-yt-iron-dropdown.ytd-popup-container[aria-hidden='true'] .ytq-extra-options";
        await page.waitForSelector(hideExtraOptionsSelector, { timeout: 1000 });
    });

    const runCommonTestFlow = async (page, moreOptionButtonSelector) => {
        await waitAndClick(page, moreOptionButtonSelector);

        const extraOptionsSelector =
            "tp-yt-iron-dropdown.ytd-popup-container:not([aria-hidden='true']) .ytq-extra-options";
        await page.waitForSelector(extraOptionsSelector, { timeout: 500 });

        const questionButtonSelector = ".option-item[target-value=question]";
        await waitAndClick(page, questionButtonSelector);

        const questionDialogSelector = "ytd-popup-container #dialog-container";
        await page.waitForSelector(questionDialogSelector, { timeout: 500 });

        const contentsSelector = `${questionDialogSelector} #contents`;
        await page.waitForSelector(contentsSelector, {
            timeout: 500,
            hidden: false,
        });

        // Wait for title to be updated with a non-empty value
        await page.waitForFunction(
            selector => {
                const title = document.querySelector(selector);
                return title && title.textContent.trim().length > 0;
            },
            { timeout: 500 },
            `${questionDialogSelector} #contents .title`
        );

        const thumbnailUrl = await getElementAttr(
            page,
            questionDialogSelector,
            "#contents img.thumbnail"
        );
        expect(thumbnailUrl).toBeTruthy();

        await waitAndClick(page, `${questionDialogSelector} #close-button`);
        await page.waitForSelector(questionDialogSelector, {
            timeout: 1000,
            hidden: true,
        });
    };

    const moreOptionButtonTypes = [
        {
            selector: "#actions-inner #button-shape>button div.yt-spec-touch-feedback-shape__fill",
            name: "main",
        },
        {
            selector: "ytd-compact-video-renderer yt-icon-button button#button .yt-icon > div",
            name: "video-list",
        },
    ];

    const loadYoutubePage = async videoId => {
        await page.goto(`https://www.youtube.com/watch?v=${videoId}`, {
            waitUntil: "domcontentloaded",
        });
    };

    moreOptionButtonTypes.forEach(type => {
        it(`Question dialog renders correctly for ${type.name}`, async () => {
            await runCommonTestFlow(page, type.selector);
        });
    });

    it("Input question on ChatGPT from simple question form correctly", async () => {
        await waitAndClick(page, "#ytq-detail-related-above .question-input-container button");

        const newTarget = await browser.waitForTarget(
            target => target.url().startsWith("https://chatgpt.com/"),
            { timeout: 2000 }
        );
        expect(newTarget.url()).toContain("https://chatgpt.com/");

        // close the target page
        (await newTarget.page()).close();
    });

    it("Input question on ChatGPT from question dialog correctly", async () => {
        const moreOptionButtonSelector = moreOptionButtonTypes[0].selector;
        await waitAndClick(page, moreOptionButtonSelector);

        const extraOptionsSelector =
            "tp-yt-iron-dropdown.ytd-popup-container:not([aria-hidden='true']) .ytq-extra-options";
        await page.waitForSelector(extraOptionsSelector, { timeout: 1000 });

        const questionButtonSelector = ".option-item[target-value=question]";
        await waitAndClick(page, questionButtonSelector);

        const questionDialogSelector = "ytd-popup-container #dialog-container";
        await page.waitForSelector(questionDialogSelector, { timeout: 1000 });

        await waitAndClick(page, "#dialog-container button.question-button");

        const newTarget = await browser.waitForTarget(
            target => target.url().startsWith("https://chatgpt.com/"),
            { timeout: 2000 }
        );
        expect(newTarget.url()).toContain("https://chatgpt.com/");

        // close the target page
        (await newTarget.page()).close();
    });
});
