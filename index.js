const { Client } = require("discord.js");
const app = require("express")();
const config = require("./config.json");
const { keepAlive } = require("./modules/keepAlive");
const { ready, interactionCreate, clientOptions, guildCreate, guildDelete } = require("./modules/events");

keepAlive(app, 3001);

const client = new Client(clientOptions);

client.once("ready", ready(client));
client.on("interactionCreate", interactionCreate());
client.on("guildCreate", guildCreate());
client.on("guildDelete", guildDelete())
client.login(config.token);
