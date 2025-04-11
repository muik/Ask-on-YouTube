// Mock DataTransfer and File
export class MockDataTransferItemList {
    private items: File[] = [];

    add(file: File): void {
        this.items.push(file);
    }

    get length() {
        return this.items.length;
    }

    get(index: number): File {
        return this.items[index];
    }
}

export class MockDataTransfer {
    public items: MockDataTransferItemList;
    private _files: File[] = [];

    constructor() {
        this.items = new MockDataTransferItemList();
    }

    get files(): File[] {
        return this._files;
    }

    setFiles(files: File[]): void {
        this._files = files;
    }
}

export class MockFile {
    constructor(
        public content: any[],
        public name: string,
        public options: { type: string }
    ) {}
    get type() {
        return this.options.type;
    }
}

// Mock DragEvent
export class MockDragEvent extends Event {
    public dataTransfer: DataTransfer;

    constructor(type: string, init: DragEventInit) {
        super(type, init);
        this.dataTransfer = init.dataTransfer as DataTransfer;
        if (this.dataTransfer instanceof MockDataTransfer) {
            const file = (this.dataTransfer.items as MockDataTransferItemList).get(0);
            if (file) {
                this.dataTransfer.setFiles([file]);
            }
        }
    }
} 