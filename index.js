const { Client } = require("discord.js");
require("dotenv").config();
const {
  ready,
  interactionCreate,
  clientOptions,
  guildCreate,
  guildDelete,
} = require("./modules/events");
const { keepAlive } = require("./modules/keepAlive");
const app = require("express")();

keepAlive(app, 3000);
const client = new Client(clientOptions);
client.once("ready", (ready(client)));
client.on("interactionCreate", (interactionCreate(client)));
client.on("guildCreate", (guildCreate()));
client.on("guildDelete", (guildDelete()));
client.login(process.env["token"]);
