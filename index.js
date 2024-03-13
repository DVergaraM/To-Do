const { Client } = require("discord.js");
const sqlite3 = require("sqlite3").verbose();
const app = require("express")();
let db = new sqlite3.Database("./tasks.db");
const config = require("./config.json");
const { keepAlive } = require("./modules/keepAlive");
const { ready, interactionCreate, clientOptions } = require("./modules/events");
db.run("CREATE TABLE IF NOT EXISTS guilds(id TEXT PRIMARY KEY, language TEXT)");
keepAlive(app, 3001);

const client = new Client(clientOptions);

client.once("ready", ready(client, db, config));
client.on("interactionCreate", interactionCreate(client, db));
client.login(config.token);
