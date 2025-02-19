# Ask on YouTube using ChatGPT

This Chrome Extension lets you ask questions about YouTube videos and get clear answers, not just summaries.

## How to Install

To install this extension, follow these steps:

1. Download the code on GitHub.
2. Unzip the downloaded file.
3. Open the code in your favorite IDE like VS Code.
4. Run `npm install` in terminal

```
npm install
```

5. Run `npm run build` or `npm run build-release` to run webpack to generate **dist** folder.

```
npm run build
# or
npm run build-release
```

6. In case of Google Chrome, open the Extensions page (chrome://extensions/).
7. Turn on Developer mode by clicking the toggle switch in the top right corner of the page.
8. Click the `Load unpacked` button and select the **dist** directory.
9. This extension should be installed and active!

## How to Use

To use this extension:

1. Open a YouTube video on your chrome browser.
2. Click the question box at the top right, which includes an input field and an Ask button.
3. Click the video’s "More options" (the vertical three-dot icon) and select the question option at the bottom of the menu.
4. Get the right answer on ChatGPT.

## Notes

-   Originally a fork of [YouTube Summary with ChatGPT](https://github.com/kazuki-sf/chatgpt-youtube-summary), this project has been significantly modified to let users ask questions on YouTube.

## Feedback & Contribution

If you have any questions or feedback, please open an issue. Contributions are welcome—feel free to submit a pull request!
