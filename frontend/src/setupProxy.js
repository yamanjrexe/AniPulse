const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
    app.use(
        "/anilist-proxy",
        createProxyMiddleware({
            target: "https://graphql.anilist.co",
            changeOrigin: true,
            secure: false,
            pathRewrite: { "^/anilist-proxy": "" },
            onProxyReq: (proxyReq, req, res) => {
                proxyReq.setHeader(
                    "User-Agent",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                );
                proxyReq.setHeader("Origin", "https://graphql.anilist.co");
                proxyReq.setHeader("Accept", "application/json");
                proxyReq.setHeader("Content-Type", "application/json");
            },
        })
    );
};