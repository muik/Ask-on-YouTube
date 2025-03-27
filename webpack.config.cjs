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
        filename: "index.html", // Output filename
        template: path.join(__dirname, "src", "options", "index.html"), // Input template
        chunks: ["options"], // Include only the 'options' entry
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
                    ["@babel/preset-react", { runtime: "automatic", importSource: "preact" }],
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
    devtool: ENV === "production" ? "source-map" : "cheap-module-source-map",
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
        background: path.join(__dirname, "src", "background.js"),
        options: [
            path.join(__dirname, "src", "options", "index.tsx"),
            path.join(__dirname, "src", "css", "options.css"),
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
        alias: {
            vendor: path.resolve(__dirname, "src/vendor"),
            "react": "preact/compat",
            "react-dom/test-utils": "preact/test-utils",
            "react-dom": "preact/compat",
            "react/jsx-runtime": "preact/jsx-runtime"
        },
    },
};

module.exports = config;
