/**
 * Insert a button to copy all comments in the video
 * @param {string} id - The id of the element to insert the button
 */
export function insertCommentBtn(id) {
    const buttonHtml = `<button class="yt-ai-comments yt-spec-button-shape-next
            yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono
            yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-leading"
        label="Copy comments">Copy comments</button>`;

    const el = document.querySelector(`#${id}`);
    el.insertAdjacentHTML("beforeend", buttonHtml);

    addCopyCommentsEventListener(id);
}

// Event Listener: Copy Comments
function addCopyCommentsEventListener(id) {
    const el = document.querySelector(`#comments #${id} button.yt-ai-comments`);

    el.addEventListener("click", (e) => {
        const btn = e.target;
        const defaultText = btn.textContent;

        expandCommentReplies();

        setTimeout(() => {
            copyUserComments();

            btn.textContent = "Copied!";

            setTimeout(() => {
                btn.textContent = defaultText;
            }, 2000);
        }, 200);
    });
}

function expandCommentReplies() {
    Array.from(
        document.querySelectorAll("#comments #contents #more-replies button")
    ).forEach((el) => {
        el.click();
    });
}

function copyUserComments() {
    let contentBody = `## User Comments\n`;
    let preDepth = 0;

    Array.from(document.querySelectorAll("#contents #main")).forEach((el) => {
        const author = el.querySelector("#author-text").innerText.trim();
        const content = el.querySelector("#content").innerText.trim();
        const publishedTime = el
            .querySelector("#published-time-text")
            .innerText.trim();
        const likesCount = el
            .querySelector("#vote-count-middle")
            .innerText.trim();
        const depth = el.closest("#expander-contents") ? 1 : 0;
        const indent = "  ".repeat(depth);

        if (depth > preDepth) {
            contentBody += `${indent}[Replies]\n`;
        }

        contentBody += `${indent}- ${author}, ${publishedTime}\n`;
        contentBody += `${indent}  ${content}\n`;

        if (likesCount) {
            contentBody += `${indent}  ${likesCount} likes\n`;
        }

        preDepth = depth;
    });

    copyTextToClipboard(contentBody);
}
