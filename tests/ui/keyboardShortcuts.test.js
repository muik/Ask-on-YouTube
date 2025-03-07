/**
 * @jest-environment jsdom
 */

// Mock all dependencies
jest.mock('@honeybadger-io/js', () => ({
    default: {
        configure: jest.fn()
    }
}));

jest.mock('../../src/config.js', () => ({
    honeybadgerConfig: {}
}));

jest.mock('../../src/constants.js', () => ({
    BackgroundActions: {}
}));

jest.mock('../../src/contentscript/youtube/videoDetail.js', () => ({
    injectElements: jest.fn()
}));

// Create mock functions
const mockFindQuestionMenuShown = jest.fn();
const mockFindSimpleQuestionInputShown = jest.fn();

// Mock the modules
jest.mock('../../src/contentscript/youtube/moreOptions.js', () => ({
    findQuestionMenuShown: mockFindQuestionMenuShown,
    detectVideoOptionClick: jest.fn(),
    insertExtraOptions: jest.fn()
}));

jest.mock('../../src/contentscript/youtube/simpleQuestion.js', () => ({
    findSimpleQuestionInputShown: mockFindSimpleQuestionInputShown
}));

// Import the functions we want to test
import { jest } from '@jest/globals';
import { handleQuestionShortcut, isVideoDetailPage } from '../../src/contentscript/youtube/keyboardShortcuts.js';

describe('Keyboard Shortcuts', () => {
    let mockEvent;
    let mockQuestionButton;
    let mockQuestionInput;
    let originalQuerySelector;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock window.location
        const mockLocation = new URL('https://www.youtube.com/watch?v=test123');
        Object.defineProperty(window, 'location', {
            value: mockLocation,
            writable: true
        });

        // Create mock elements
        mockQuestionButton = document.createElement('button');
        mockQuestionButton.click = jest.fn();

        mockQuestionInput = document.createElement('input');
        mockQuestionInput.focus = jest.fn();

        // Create base mock event
        mockEvent = {
            code: 'KeyQ',
            ctrlKey: false,
            altKey: false,
            metaKey: false,
            shiftKey: false,
            preventDefault: jest.fn(),
            target: document.createElement('div')
        };

        // Mock document.querySelector
        originalQuerySelector = document.querySelector;
        document.querySelector = jest.fn();
    });

    afterEach(() => {
        // Restore original querySelector
        document.querySelector = originalQuerySelector;
    });

    describe('isVideoDetailPage', () => {
        test('should return true for video watch pages', () => {
            expect(isVideoDetailPage()).toBe(true);
        });

        test('should return false for non-video pages', () => {
            window.location = new URL('https://www.youtube.com/feed/subscriptions');
            expect(isVideoDetailPage()).toBe(false);
        });

        test('should return false for watch pages without video ID', () => {
            window.location = new URL('https://www.youtube.com/watch');
            expect(isVideoDetailPage()).toBe(false);
        });
    });

    describe('handleQuestionShortcut', () => {
        test('should not trigger for non-Q key', () => {
            mockEvent.code = 'KeyW';
            handleQuestionShortcut(mockEvent);
            
            expect(mockEvent.preventDefault).not.toHaveBeenCalled();
            expect(document.querySelector).not.toHaveBeenCalled();
        });

        test('should not trigger when modifier keys are pressed', () => {
            const modifierTests = [
                { ctrlKey: true },
                { altKey: true },
                { metaKey: true },
                { shiftKey: true }
            ];

            modifierTests.forEach(modifier => {
                const testEvent = { ...mockEvent, ...modifier };
                handleQuestionShortcut(testEvent);
                
                expect(mockEvent.preventDefault).not.toHaveBeenCalled();
                expect(document.querySelector).not.toHaveBeenCalled();
            });
        });

        test('should not trigger when target is an input element', () => {
            mockEvent.target = document.createElement('input');
            handleQuestionShortcut(mockEvent);
            
            expect(mockEvent.preventDefault).not.toHaveBeenCalled();
            expect(document.querySelector).not.toHaveBeenCalled();
        });

        test('should click question button if dropdown menu is shown', () => {
            // Mock the dropdown query
            const mockDropdown = document.createElement('div');
            document.querySelector.mockReturnValueOnce(mockDropdown);

            // Mock the question button query
            mockQuestionButton.setAttribute('target-value', 'question');
            mockDropdown.querySelector = jest.fn().mockReturnValue(mockQuestionButton);

            handleQuestionShortcut(mockEvent);
            
            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(document.querySelector).toHaveBeenCalledWith('tp-yt-iron-dropdown.ytd-popup-container:not([aria-hidden=\'true\'])');
            expect(mockDropdown.querySelector).toHaveBeenCalledWith('.ytq-extra-options .option-item[target-value=question]');
            expect(mockQuestionButton.click).toHaveBeenCalled();
        });

        test('should focus question input if on video page and input is shown', () => {
            // Mock the dropdown query to return null (no dropdown shown)
            document.querySelector.mockReturnValueOnce(null);

            // Mock the input query
            const mockContainer = document.createElement('div');
            mockContainer.style.display = 'block';
            mockContainer.querySelector = jest.fn().mockReturnValue(mockQuestionInput);
            document.querySelector.mockReturnValueOnce(mockContainer);

            handleQuestionShortcut(mockEvent);
            
            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(document.querySelector).toHaveBeenCalledWith('tp-yt-iron-dropdown.ytd-popup-container:not([aria-hidden=\'true\'])');
            expect(mockQuestionInput.focus).toHaveBeenCalled();
        });

        test('should not focus input if not on video page', () => {
            window.location = new URL('https://www.youtube.com/feed/subscriptions');

            // Mock the dropdown query to return null (no dropdown shown)
            document.querySelector.mockReturnValueOnce(null);

            handleQuestionShortcut(mockEvent);
            
            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(document.querySelector).toHaveBeenCalledWith('tp-yt-iron-dropdown.ytd-popup-container:not([aria-hidden=\'true\'])');
            expect(mockQuestionInput.focus).not.toHaveBeenCalled();
        });
    });
}); 