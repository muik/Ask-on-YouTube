import { BackgroundActions } from "../../constants.js";
import { getDialogData } from "./questionView.js";

/**
 * Debounce function to limit the rate at which a function can fire
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce delay in milliseconds
 * @returns {Function} - The debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Store the suggestion element reference
let suggestionElement = null;
// Track the last input value that triggered a request
let lastRequestedInput = null;
// Flag to enable/disable auto-completion functionality
let autoCompleteEnabled = false;

// Minimum characters required to trigger auto-completion
const MIN_CHARS = 2;
// Debounce delay in milliseconds
const DEBOUNCE_DELAY = 300;

function normalizeText(text) {
    return text.toLowerCase();
}

function isQuestionStart(completedText, questionStart) {
    return normalizeText(completedText).startsWith(
        normalizeText(questionStart)
    );
}

/**
 * Initialize auto-completion for the question input
 * @param {HTMLElement} inputElement - The input element
 */
export function initAutoComplete(inputElement) {
    if (!inputElement) return;

    console.debug("Initializing auto-completion for:", inputElement);

    // Clean up any existing suggestion element
    cleanupSuggestion();

    // Create debounced handler for input changes
    const debouncedInputHandler = debounce(handleInputChange, DEBOUNCE_DELAY);

    // Remove any existing event listeners to prevent duplicates
    const newInputElement = inputElement.cloneNode(true);
    inputElement.parentNode.replaceChild(newInputElement, inputElement);
    inputElement = newInputElement;

    // Add input event listener
    inputElement.addEventListener("input", (e) => {
        if (suggestionElement) {
            const questionStart = e.target.value;
            const completedText = suggestionElement.dataset.suggestion;
            if (
                questionStart &&
                isQuestionStart(completedText, questionStart)
            ) {
                displaySuggestion(inputElement, questionStart, completedText);
                return;
            } else {
                // if user doesn't follow the suggestion, clear the suggestion immediately
                cleanupSuggestion();
            }
        }

        inputElement.style.height = "auto";
        inputElement.style.height = inputElement.scrollHeight + "px";

        if (autoCompleteEnabled) {
            debouncedInputHandler(e);
        }
    });
    console.debug("Added input event listener for auto-completion");

    // Add tab key event listener for accepting suggestions
    inputElement.addEventListener("keydown", (e) => {
        // Handle Tab key for accepting suggestions
        if (e.key === "Tab" && suggestionElement) {
            handleTabKey(e);
        }

        // Allow Enter key to submit when Shift is not pressed
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            cleanupSuggestion();

            const button = inputElement
                .closest(".question-input-container")
                .querySelector(".question-button");
            if (button) {
                button.click();
            }
        }
    });
    console.debug("Added key event listeners for auto-completion");

    // Add cleanup when dialog is closed
    const containerElement = document.getElementById("dialog-container");
    if (containerElement) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (
                    mutation.type === "attributes" &&
                    mutation.attributeName === "style" &&
                    containerElement.style.display === "none"
                ) {
                    cleanupSuggestion();
                }
            });
        });
        observer.observe(containerElement, { attributes: true });
        console.debug("Added mutation observer for dialog closing");
    }

    // Handle placeholder changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === "placeholder") {
                console.debug("Placeholder changed to:", mutation);

                const inputElement = mutation.target;
                if (inputElement.textContent.length === 0) {
                    inputElement.style.height = "auto";
                    inputElement.style.height =
                        inputElement.scrollHeight + "px";
                }
            }
        });
    });
    observer.observe(inputElement, { attributes: true });

    loadAutoCompleteAvailable();

    // Return the input element in case it was replaced
    return inputElement;
}

async function loadAutoCompleteAvailable() {
    try {
        const response = await chrome.runtime.sendMessage({
            action: BackgroundActions.GET_QUESTION_COMPLETE_AVAILABLE,
        });

        if (chrome.runtime.lastError) {
            console.error(
                "Failed to load auto-complete available:",
                chrome.runtime.lastError
            );
            return;
        }

        autoCompleteEnabled = response.isAvailable;
        console.debug("Auto-complete available:", autoCompleteEnabled);
    } catch (error) {
        console.error("Failed to load auto-complete available:", error);
    }
}

/**
 * Handle input changes to trigger auto-completion
 * @param {Event} e - The input event
 */
async function handleInputChange(e) {
    const inputElement = e.target;
    const questionStart = inputElement.value;
    lastRequestedInput = questionStart;

    console.debug("Input changed:", questionStart);

    // Clear suggestion if input is too short or recently accepted a suggestion
    if (questionStart.replace(/\s+/g, "").length < MIN_CHARS) {
        console.debug("Input too short, clearing suggestion");
        cleanupSuggestion();
        return;
    }

    console.debug("Requesting question completion for:", questionStart);

    const { videoInfo } = getDialogData();

    // Request question completion from background script
    const startTime = performance.now();
    const response = await chrome.runtime.sendMessage({
        action: BackgroundActions.GET_QUESTION_COMPLETE,
        questionStart,
        videoInfo,
    });
    const endTime = performance.now();
    console.debug(
        "Question completion response time:",
        (endTime - startTime).toFixed(1),
        "ms"
    );

    // Check if the input has changed since the request was sent
    if (lastRequestedInput !== questionStart) {
        console.debug("Input changed since request, ignoring response");
        return;
    }

    console.debug("Question completion response:", response);

    if (chrome.runtime.lastError) {
        console.error(
            "Error getting question completion:",
            chrome.runtime.lastError
        );
        return;
    }

    if (response && response.error) {
        console.error("Error getting question completion:", response.error);
        return;
    }

    if (!response || !response.questionComplete) {
        console.error("No question completion response");
        return;
    }

    // Ensure the completed text is different from what the user typed
    const completedText = response.questionComplete;

    if (completedText === questionStart) {
        console.debug(
            "Completed text is the same as current text, not showing suggestion"
        );
        return;
    }

    // Check if the completed text actually extends the current text
    if (!isQuestionStart(completedText, questionStart)) {
        console.debug("Completed text doesn't start with current text, fixing");
        cleanupSuggestion();
        return;
    }

    console.debug("Displaying suggestion:", completedText);
    displaySuggestion(inputElement, questionStart, completedText);
}

/**
 * Display the suggestion below the input field
 * @param {HTMLElement} inputElement - The input element
 * @param {string} currentText - The current input text
 * @param {string} completedText - The completed text suggestion
 */
function displaySuggestion(inputElement, currentText, completedText) {
    // Clean up any existing suggestion
    cleanupSuggestion();

    console.debug("Displaying suggestion:", { currentText, completedText });

    // Get the input container
    const inputContainer = inputElement.closest(".question-input-container");
    if (!inputContainer) {
        console.error("Input container not found");
        return;
    }

    // Create auto-complete text element that will appear behind the input
    const autoCompleteText = document.createElement("div");
    autoCompleteText.className = "question-auto-complete-text";

    // set the width to the width of the input
    const computedStyle = window.getComputedStyle(inputElement);
    autoCompleteText.style.width =
        inputElement.getBoundingClientRect().width -
        parseFloat(computedStyle.paddingLeft) -
        parseFloat(computedStyle.paddingRight) +
        "px";

    // Create the visible part (what user has typed)
    const typedPart = document.createElement("span");
    typedPart.className = "typed-text";
    typedPart.textContent = currentText;

    // Create the suggestion part
    const suggestionPart = document.createElement("span");
    suggestionPart.className = "suggestion-text";
    suggestionPart.textContent = completedText.substring(currentText.length);

    // Add both parts to the auto-complete text
    const completeTextContainer = document.createElement("div");
    completeTextContainer.appendChild(typedPart);
    completeTextContainer.appendChild(suggestionPart);
    autoCompleteText.appendChild(completeTextContainer);

    // Add the auto-complete text to the input container
    inputContainer.appendChild(autoCompleteText);

    // Create the tab hint element
    const tabHint = document.createElement("span");
    tabHint.className = "ytq-auto-complete-tab-hint";
    tabHint.textContent = " [Tab]";

    // Add the tab hint to the input container
    completeTextContainer.appendChild(tabHint);

    // Store the suggestion element and completed text for later use
    suggestionElement = autoCompleteText;
    suggestionElement.dataset.suggestion = completedText;

    inputElement.style.height = suggestionElement.scrollHeight + "px";

    console.debug("Auto-complete text added to input container");
}

/**
 * Handle tab key press to accept suggestions
 * @param {KeyboardEvent} e - The keyboard event
 */
function handleTabKey(e) {
    console.debug(
        "Tab key pressed, suggestion element exists:",
        !!suggestionElement
    );

    if (e.key === "Tab" && suggestionElement) {
        e.preventDefault();

        // Get the suggestion text
        const suggestion = suggestionElement.dataset.suggestion;
        console.debug("Accepting suggestion:", suggestion);

        // Update the input value
        e.target.value = suggestion;

        // Move cursor to the end
        e.target.selectionStart = suggestion.length;
        e.target.selectionEnd = suggestion.length;

        // Clean up the suggestion
        cleanupSuggestion();

        console.debug("Suggestion accepted and cleaned up");
    }
}

/**
 * Clean up the suggestion element
 */
function cleanupSuggestion() {
    const inputElement = document.querySelector(
        ".ytq-form textarea.question-input"
    );

    if (suggestionElement) {
        // Also remove any tab hint elements
        const tabHint = document.querySelector(".ytq-auto-complete-tab-hint");
        if (tabHint) {
            tabHint.remove();
        }

        suggestionElement.remove();
        suggestionElement = null;
    }

    inputElement.style.height = "auto";
    inputElement.style.height = inputElement.scrollHeight + "px";
}

/**
 * Test function for auto-completion (for debugging)
 */
export function testAutoComplete() {
    const inputElement = document.querySelector(
        ".ytq-form textarea.question-input"
    );
    if (!inputElement) {
        console.error("Input element not found");
        return;
    }

    const videoInfo = {
        id: "test-video-id",
        title: "Test Video Title",
        caption: "Test video caption",
    };

    console.debug("Testing auto-completion with:", {
        inputElement,
        videoInfo,
    });

    // Initialize auto-completion
    initAutoComplete(inputElement, videoInfo);

    // Test function to manually trigger a suggestion
    window.showTestSuggestion = () => {
        const currentText = inputElement.value;
        if (currentText.replace(/\s+/g, "").length >= MIN_CHARS) {
            displaySuggestion(
                inputElement,
                currentText,
                `${currentText} is a test suggestion`
            );
            console.debug("Test suggestion displayed");
        } else {
            console.debug(`Input needs at least ${MIN_CHARS} characters`);
        }
    };

    console.debug("Test function available: window.showTestSuggestion()");
    console.debug(
        "Type at least 3 characters in the input field and run window.showTestSuggestion()"
    );
}
