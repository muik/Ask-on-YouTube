/**
 * @jest-environment jsdom
 */

import { ObserverManager } from "../observer";

describe("ObserverManager", () => {
    let observerManager: ObserverManager;

    beforeEach(() => {
        observerManager = new ObserverManager();
    });

    afterEach(() => {
        observerManager.cleanupAll();
    });

    test("should create and cleanup a single observer", () => {
        const mockCallback = jest.fn();
        const target = document.createElement("div");
        const config = { childList: true, subtree: true };

        const observer = observerManager.createObserver(target, mockCallback, config);
        expect(observer).toBeDefined();
        expect(mockCallback).not.toHaveBeenCalled();

        observerManager.cleanupObserver(observer);
        // Verify observer is disconnected by checking if it still has records
        expect(observer.takeRecords()).toHaveLength(0);
        expect(mockCallback).not.toHaveBeenCalled();
    });

    test("should cleanup all observers", () => {
        const mockCallback = jest.fn();
        const target = document.createElement("div");
        const config = { childList: true, subtree: true };

        const observer1 = observerManager.createObserver(target, mockCallback, config);
        const observer2 = observerManager.createObserver(target, mockCallback, config);

        observerManager.cleanupAll();
        // Verify both observers are disconnected
        expect(observer1.takeRecords()).toHaveLength(0);
        expect(observer2.takeRecords()).toHaveLength(0);
        expect(mockCallback).not.toHaveBeenCalled();
    });
});

describe("findOrObserveElement", () => {
    let observerManager: ObserverManager;
    let mockCallback: jest.Mock;

    beforeEach(() => {
        observerManager = new ObserverManager();
        mockCallback = jest.fn();
        document.body.innerHTML = '';
    });

    afterEach(() => {
        observerManager.cleanupAll();
        document.body.innerHTML = "";
    });

    test("should observe direct child selector", (done) => {
        const parent = document.createElement("div");
        document.body.appendChild(parent);
        
        observerManager.findOrObserveElement("div > span", mockCallback);
        
        // Add child after observer is set up
        setTimeout(() => {
            const child = document.createElement("span");
            parent.appendChild(child);
            
            // Wait for mutation observer to fire
            setTimeout(() => {
                expect(mockCallback).toHaveBeenCalledWith(child);
                done();
            }, 0);
        }, 0);
    });

    test("should observe descendant selector", (done) => {
        const parent = document.createElement("div");
        document.body.appendChild(parent);
        
        observerManager.findOrObserveElement("div span", mockCallback);
        
        // Add child after observer is set up
        setTimeout(() => {
            const child = document.createElement("span");
            parent.appendChild(child);
            
            // Wait for mutation observer to fire
            setTimeout(() => {
                expect(mockCallback).toHaveBeenCalledWith(child);
                done();
            }, 0);
        }, 0);
    });

    test("should handle non-existent parent selector", () => {
        observerManager.findOrObserveElement("non-existent > span", mockCallback);
        expect(mockCallback).not.toHaveBeenCalled();
    });

    test("should handle body as parent selector", (done) => {
        observerManager.findOrObserveElement("span", mockCallback);
        
        // Add child after observer is set up
        setTimeout(() => {
            const child = document.createElement("span");
            document.body.appendChild(child);
            
            // Wait for mutation observer to fire
            setTimeout(() => {
                expect(mockCallback).toHaveBeenCalledWith(child);
                done();
            }, 0);
        }, 0);
    });

    test("should handle dynamic element addition", done => {
        const parent = document.createElement("div");
        document.body.appendChild(parent);

        observerManager.findOrObserveElement("div > span", mockCallback);

        // Add child element after a delay
        setTimeout(() => {
            const child = document.createElement("span");
            parent.appendChild(child);

            // Wait for next tick to allow mutation observer to fire
            setTimeout(() => {
                expect(mockCallback).toHaveBeenCalledWith(child);
                done();
            }, 0);
        }, 0);
    });
});
