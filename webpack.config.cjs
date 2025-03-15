const webpack = require("webpack"),
    path = require("path"),
    CopyWebpackPlugin = require("copy-webpack-plugin"),
    HtmlWebpackPlugin = require("html-webpack-plugin"),
    WriteFilePlugin = require("write-file-webpack-plugin"),
    MiniCssExtractPlugin = require("mini-css-extract-plugin"),
    CssMinimizerPlugin = require("css-minimizer-webpack-plugin"),
    TerserPlugin = require("terser-webpack-plugin"),
    HoneybadgerSourceMapPlugin = require("@honeybadger-io/webpack");

if (process.env.NODE_ENV == null) {
    process.env.NODE_ENV = "development";
}
const ENV = (process.env.ENV = process.env.NODE_ENV);

const plugins = [
    new webpack.DefinePlugin({
        "process.env": {
            ENV: JSON.stringify(ENV),
        },
    }),
    new HoneybadgerSourceMapPlugin({
        apiKey: "hbp_3jSfbmWLloU7jlmLHm6IiD9JebrjGz4wnmUY",
        assetsUrl: "chrome-extension://__MSG_@@extension_id__/",
        revision: process.env.npm_package_version,
        silent: ENV === "development", // Don't show warnings in development mode
    }),
    new CopyWebpackPlugin({
        patterns: [
            {
                from: "manifest.json",
            },
            {
                from: "_locales",
                to: "_locales",
            },
            {
                from: "src/images",
                to: "images",
            },
            {
                from: "src/vendor/honeybadger.ext.min.js",
                to: "vendor/honeybadger.ext.min.js",
            },
        ],
    }),
    new HtmlWebpackPlugin({
        filename: "settings.html", // Output filename
        template: path.join(__dirname, "src", "options", "settings.html"), // Input template
        chunks: ["settings"], // Include only the 'settings' entry
        inject: "body",
    }),
    new WriteFilePlugin(),
    new MiniCssExtractPlugin({
        filename: "[name].min.css",
    }),
];

const fileExtensions = ["jpg", "jpeg", "png", "gif", "eot", "otf", "svg", "ttf", "woff", "woff2"];
const moduleRules = [
    {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
            loader: "babel-loader",
            options: {
                presets: [
                    "@babel/preset-env",
                    ["@babel/preset-react", { runtime: "automatic" }],
                    "@babel/preset-typescript",
                ],
            },
        },
    },
    {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
        exclude: /node_modules/,
    },
    {
        test: new RegExp(".(" + fileExtensions.join("|") + ")$"),
        use: "file-loader?name=[name].[ext]",
        exclude: /node_modules/,
    },
    {
        test: /\.html$/,
        use: {
            loader: "html-loader",
            options: {
                sources: false,
            },
        },
        exclude: /node_modules/,
    },
];

const config = {
    target: "web",
    devtool: "cheap-module-source-map",
    mode: process.env.NODE_ENV || "development",
    entry: {
        "contentscript/youtube": [
            path.join(__dirname, "src", "contentscript", "youtube.js"),
            path.join(__dirname, "src", "css", "common.css"),
            path.join(__dirname, "src", "css", "dialog.css"),
            path.join(__dirname, "src", "css", "extraOptions.css"),
        ],
        "contentscript/chatgpt": path.join(__dirname, "src", "contentscript", "chatgpt.js"),
        "contentscript/welcome": path.join(__dirname, "src", "contentscript", "welcome.js"),
        background: [
            path.join(__dirname, "src", "vendor", "honeybadger.ext.min.js"),
            path.join(__dirname, "src", "background.js"),
        ],
        settings: [
            path.join(__dirname, "src", "options", "index.tsx"),
            path.join(__dirname, "src", "css", "settings.css"),
        ],
    },
    output: {
        path: path.join(__dirname, "dist"),
        filename: "[name].min.js",
        clean: true,
    },
    module: {
        rules: moduleRules,
    },
    plugins: plugins,
    optimization: {
        minimize: ENV === "production",
        minimizer: [new CssMinimizerPlugin(), new TerserPlugin()],
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx"],
        extensionAlias: {
            ".js": [".ts", ".js"],
            ".jsx": [".tsx", ".jsx"],
        },
    },
};

if (ENV === "development") {
    config.devtool = "cheap-module-source-map";
}

module.exports = config;
