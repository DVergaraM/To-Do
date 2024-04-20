const { Client } = require("discord.js");
const app = require("express")();
const { keepAlive } = require("./modules/keepAlive");
const {
  ready,
  interactionCreate,
  clientOptions,
  guildCreate,
  guildDelete,
} = require("./modules/events");
require("dotenv").config();

keepAlive(app, 3001);

const client = new Client(clientOptions);

client.once("ready", ready(client));
client.on("interactionCreate", interactionCreate(client));
client.on("guildCreate", guildCreate());
client.on("guildDelete", guildDelete());
client.login(process.env["token"]);
