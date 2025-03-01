# Ask on YouTube using ChatGPT

This Chrome Extension lets you ask questions about YouTube videos and get clear answers, not just summaries.

## How to Install

### Option 1: Download from Release (For General Users)

For most users who just want to use the extension, this is the recommended method:

1. Go to the [Releases page](https://github.com/muik/Ask-on-YouTube/releases) and download the latest release zip file.
2. Unzip the downloaded file to get the `dist` directory.
3. Skip to [Loading the Extension](#loading-the-extension) section below.

### Option 2: Build from Source (For Developers/Latest Code)

If you want to get the latest code or plan to modify the extension:

1. Clone the repository or download the code on GitHub.
2. If you downloaded the code, unzip the downloaded file.
3. Open the code in your favorite IDE like VS Code.
4. Run `npm install` in terminal:

```
npm install
```

5. Run `npm run build` or `npm run build-release` to generate the **dist** folder:

```
npm run build
# or
npm run build-release
```

### Loading the Extension

1. In case of Google Chrome, open the Extensions page (chrome://extensions/).
2. Turn on Developer mode by clicking the toggle switch in the top right corner of the page.
3. Click the `Load unpacked` button and select the **dist** directory.
4. This extension should be installed and active!

## How to Use

To use this extension:

1. Open a YouTube video on your chrome browser.
2. Click the question box at the top right, which includes an input field and an Ask button.
3. Click the video's "More options" (the vertical three-dot icon) and select the question option at the bottom of the menu.
4. Get the right answer on ChatGPT.

## Notes

-   Originally a fork of [YouTube Summary with ChatGPT](https://github.com/kazuki-sf/chatgpt-youtube-summary), this project has been significantly modified to let users ask questions on YouTube.

## Feedback & Contribution

If you have any questions or feedback, please open [an issue](https://github.com/muik/Ask-on-YouTube/issues). Contributions are welcome—feel free to submit [a pull request](https://github.com/muik/Ask-on-YouTube/pulls)!
