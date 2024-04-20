const { Client } = require("discord.js");
const app = require("express")();
require("dotenv").config();
const { keepAlive } = require("./modules/keepAlive");
const {
  ready,
  interactionCreate,
  clientOptions,
  guildCreate,
  guildDelete,
} = require("./modules/events");

const client = new Client(clientOptions);
app.get("/", (_req, res) => {
  res.send("Hello World");
});
client.once("ready", ready(client));
client.on("interactionCreate", interactionCreate(client));
client.on("guildCreate", guildCreate());
client.on("guildDelete", guildDelete());
app.listen(3002, () => {
  console.log(`Server is running on port ${3002}`);
});
client.login(process.env["token"]);
