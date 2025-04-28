// Helper function to wait for a selector and click it.
export async function waitAndClick(page, selector, options = {}) {
    await page.waitForSelector(selector, { timeout: 3000, ...options });
    await page.click(selector);
}

// Helper function to retrieve text content from a sub-element.
export async function getElementText(page, scopeSelector, childSelector) {
    return page.evaluate(
        (scopeSelector, childSelector) => {
            const container = document.querySelector(scopeSelector);
            return container
                ? container.querySelector(childSelector)?.textContent
                : "";
        },
        scopeSelector,
        childSelector
    );
}

// Helper function to retrieve an attribute from a sub-element.
export async function getElementAttr(page, scopeSelector, childSelector, attr = "src") {
    return page.evaluate(
        (scopeSelector, childSelector, attr) => {
            const container = document.querySelector(scopeSelector);
            return container
                ? container.querySelector(childSelector)?.getAttribute(attr)
                : null;
        },
        scopeSelector,
        childSelector,
        attr
    );
} 