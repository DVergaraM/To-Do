const { Express } = require("express");
const http = require("http");
/**
 * Starts a keep-alive server on the specified port.
 * @param {Express} app - The Express app object.
 * @param {number} port - The port number to listen on.
 */
function keepAlive(app, port) {
  app.listen(port);
  app.get("/", (_req, res) => {
    res.send("Hello World", 5, 5);
  });
  app.get("/ping", (_req, res) => {
    res.send("Pong!");
  });

  console.log(`Server is running on port ${port}`);
}

module.exports = keepAlive;
