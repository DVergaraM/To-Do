const { Client } = require("discord.js");
const app = require("express")();
require("dotenv").config();
const {
  ready,
  interactionCreate,
  clientOptions,
  guildCreate,
  guildDelete,
} = require("./modules/events");

const client = new Client(clientOptions);

client.once("ready", ready(client, app, 3000));
client.on("interactionCreate", interactionCreate(client));
client.on("guildCreate", guildCreate());
client.on("guildDelete", guildDelete());
client.login(process.env["token"]);