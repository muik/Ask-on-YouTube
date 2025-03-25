import { StorageKeys } from "../../constants";

// Mock storage data
export const mockStorage: { [key: string]: any } = {};

// Mock chrome storage API
export const mockChromeStorage = {
    local: {
        get: jest.fn(() =>
            Promise.resolve({
                [StorageKeys.QUESTION_HISTORY]: mockStorage[StorageKeys.QUESTION_HISTORY],
            })
        ),
        set: jest.fn(items => {
            Object.assign(mockStorage, items);
            return Promise.resolve();
        }),
    },
}; 