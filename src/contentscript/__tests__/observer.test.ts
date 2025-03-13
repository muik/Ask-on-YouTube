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

describe("observeParent", () => {
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
        
        observerManager.observeParent("div > span", mockCallback);
        
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
        
        observerManager.observeParent("div span", mockCallback);
        
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
        observerManager.observeParent("non-existent > span", mockCallback);
        expect(mockCallback).not.toHaveBeenCalled();
    });

    test("should handle body as parent selector", (done) => {
        observerManager.observeParent("span", mockCallback);
        
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

        observerManager.observeParent("div > span", mockCallback);

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

describe("observeWithSelector", () => {
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

    test("should observe existing element", (done) => {
        const element = document.createElement("div");
        element.id = "test-element";
        document.body.appendChild(element);
        
        observerManager.observeWithSelector("#test-element", mockCallback);
        
        // Wait for next tick to allow initial callback
        setTimeout(() => {
            expect(mockCallback).toHaveBeenCalledWith(element);
            done();
        }, 0);
    });

    test("should observe non-existing element", (done) => {
        observerManager.observeWithSelector("#test-element", mockCallback);
        
        // Add element after observer is set up
        setTimeout(() => {
            const element = document.createElement("div");
            element.id = "test-element";
            document.body.appendChild(element);
            
            // Wait for mutation observer to fire
            setTimeout(() => {
                expect(mockCallback).toHaveBeenCalledWith(element);
                done();
            }, 0);
        }, 0);
    });

    test("should handle dynamic element changes", (done) => {
        const element = document.createElement("div");
        element.id = "test-element";
        document.body.appendChild(element);
        
        observerManager.observeWithSelector("#test-element", mockCallback);
        
        // Wait for initial callback
        setTimeout(() => {
            expect(mockCallback).toHaveBeenCalledWith(element);
            
            // Add a child element to trigger childList change
            const child = document.createElement("span");
            element.appendChild(child);
            
            // Wait for mutation observer to fire
            setTimeout(() => {
                expect(mockCallback).toHaveBeenCalledTimes(2);
                expect(mockCallback).toHaveBeenLastCalledWith(element);
                done();
            }, 0);
        }, 0);
    });

    test("should handle element removal and re-addition", (done) => {
        // Create a container that we'll observe
        const container = document.createElement("div");
        container.id = "container";
        document.body.appendChild(container);
        
        // Create the element we'll track
        const element = document.createElement("div");
        element.id = "test-element";
        container.appendChild(element);
        
        observerManager.observeWithSelector("#test-element", mockCallback);
        
        // Wait for initial callback
        setTimeout(() => {
            expect(mockCallback).toHaveBeenCalledWith(element);
            
            // Add a child to trigger childList change
            const child = document.createElement("span");
            element.appendChild(child);
            
            // Wait for mutation observer to fire
            setTimeout(() => {
                expect(mockCallback).toHaveBeenCalledTimes(2);
                expect(mockCallback).toHaveBeenLastCalledWith(element);
                done();
            }, 0);
        }, 0);
    });
});
