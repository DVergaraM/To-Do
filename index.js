const { GatewayIntentBits } = require("discord.js");
const { MyClient } = require("./modules/client");
require("dotenv").config();
const { keepAlive } = require("./modules/keepAlive");
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

if (process.env["mode"] == "prod") {
  let started = false;
  rl.on("line", (input) => {
    let args = input.split(" ");
    let command = args[0];
    if (command == "stop" && started) {
      client.stop();
    } else if (command == "start") {
      started = true;
      client.start(true);
      client.login(process.env["prodToken"]);
    } else if (command === "start" && args[1] == "true" && !started) {
      started = true;
      client.start(true);
      client.login(process.env["prodToken"]);
    } else if (command === "start" && args[1] == "false" && !started) {
      started = true;
      client.start(false);
      client.login(process.env["prodToken"]);
    } else if (command === "delete" && started) {
      client.commands(false);
    } else if (command === "create") {
      client.commands(true);
    } else {
      console.log("Invalid command.");
    }
  });
} else if (process.env["mode"] == "dev") {
  client.start(true);
  client.login(process.env["token"]);
} else {
  console.log("Invalid mode.");
}

/* setTimeout(() => {
  console.log("Stopping client...")
  client.stop();
  console.log("Client stopped.")
}, 30*1000)
 */
