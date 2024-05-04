const { GatewayIntentBits } = require("discord.js");
const { MyClient } = require("./modules/client");
require("dotenv").config();
const { keepAlive } = require("./modules/keepAlive");
const { run } = require("./modules/methods");
const app = require("express")();
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

keepAlive(app, 3000);
const client = new MyClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

run(client, rl,  mode)
