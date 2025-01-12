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
