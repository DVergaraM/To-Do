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

keepAlive(app, 3001);
client.once("ready", ready(client));
client.on("interactionCreate", interactionCreate(client));
client.on("guildCreate", guildCreate());
client.on("guildDelete", guildDelete());
client.login(process.env["token"]);
