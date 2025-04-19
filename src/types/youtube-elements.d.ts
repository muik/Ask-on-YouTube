import "react";

declare module "react" {
    namespace JSX {
        interface IntrinsicElements {
            "ytd-unified-share-panel-renderer": React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement>,
                HTMLElement
            > & {
                "links-only"?: string;
                "can-post"?: string;
            };
            "yt-icon-button": React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement>,
                HTMLElement
            > & {
                icon?: string;
            };
            "yt-icon": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                icon?: string;
            };
            "yt-interaction": React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement>,
                HTMLElement
            >;
            "yt-share-panel-header-renderer": React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement>,
                HTMLElement
            >;
            "yt-share-panel-title-v15-renderer": React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement>,
                HTMLElement
            >;
            "tp-yt-paper-spinner": React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement>,
                HTMLElement
            > & {
                active?: string;
            };
        }
    }
}
