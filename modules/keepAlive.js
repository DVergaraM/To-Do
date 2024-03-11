const { Express } = require("express");
/**
 * Starts a server that keeps the application alive.
 * @param {Express} app
 * @param {number} port
 */
function keepAlive(app, port) {
    app.get("/", (_, res) => {
        res.send("Hello World", 5, 5);
    });
    app.listen(port);
}

module.exports = {
    keepAlive,
};
