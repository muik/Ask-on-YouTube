declare module "vendor/honeybadger.ext.no-remote.min.js" {
    interface HoneybadgerConfig {
        apiKey: string;
        environment?: string;
        projectRoot?: string;
        component?: string;
        action?: string;
        revision?: string;
        reportData?: boolean;
        breadcrumbsEnabled?: boolean;
        eventsEnabled?: boolean;
        maxBreadcrumbs?: number;
        maxObjectDepth?: number;
        logger?: Console;
        developmentEnvironments?: string[];
        debug?: boolean;
        tags?: string[];
        enableUncaught?: boolean;
        enableUnhandledRejection?: boolean;
        afterUncaught?: () => boolean;
        filters?: string[];
    }

    interface HoneybadgerNotice {
        name?: string;
        message?: string;
        stack?: string;
        backtrace?: Array<{
            file: string | null;
            method: string;
            number: number | null;
            column: number | null;
        }>;
        context?: Record<string, any>;
        projectRoot?: string;
        environment?: string;
        component?: string;
        action?: string;
        revision?: string;
        tags?: string[];
        url?: string;
        params?: Record<string, any>;
        session?: Record<string, any>;
        details?: Record<string, any>;
    }

    interface Honeybadger {
        configure(config: HoneybadgerConfig): void;
        notify(error: Error | string | HoneybadgerNotice, options?: HoneybadgerNotice): boolean;
        notifyAsync(error: Error | string | HoneybadgerNotice, options?: HoneybadgerNotice): Promise<void>;
        setContext(context: Record<string, any>): void;
        resetContext(context?: Record<string, any>): void;
        clear(): void;
        addBreadcrumb(message: string, options?: { category?: string; metadata?: Record<string, any> }): void;
        beforeNotify(handler: (notice: HoneybadgerNotice) => boolean | void): Honeybadger;
        afterNotify(handler: (notice: HoneybadgerNotice, error?: Error) => void): Honeybadger;
    }

    const honeybadger: Honeybadger;
    export default honeybadger;
} 