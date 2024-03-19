const { Express } = require("express");

/**
 * Starts a keep-alive server on the specified port.
 * @param {Express} app - The Express app object.
 * @param {number} port - The port number to listen on.
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
