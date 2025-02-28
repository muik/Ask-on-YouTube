const webpack = require("webpack"),
    path = require("path"),
    CopyWebpackPlugin = require("copy-webpack-plugin"),
    HtmlWebpackPlugin = require("html-webpack-plugin"),
    WriteFilePlugin = require("write-file-webpack-plugin"),
    MiniCssExtractPlugin = require("mini-css-extract-plugin"),
    CssMinimizerPlugin = require("css-minimizer-webpack-plugin"),
    TerserPlugin = require("terser-webpack-plugin");

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

const fileExtensions = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "eot",
    "otf",
    "svg",
    "ttf",
    "woff",
    "woff2",
];
const moduleRules = [
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
        "contentscript/gemini": path.join(
            __dirname,
            "src",
            "contentscript",
            "gemini.js"
        ),
        "contentscript/chatgpt": path.join(
            __dirname,
            "src",
            "contentscript",
            "chatgpt.js"
        ),
        "contentscript/welcome": path.join(
            __dirname,
            "src",
            "contentscript",
            "welcome.js"
        ),
        background: path.join(__dirname, "src", "background.js"),
        settings: [
            path.join(__dirname, "src", "options", "settings.js"),
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
};

if (ENV === "development") {
    config.devtool = "cheap-module-source-map";
}

module.exports = config;
