const { ToDoClient } = require("./modules/client");
const { keepAlive } = require("./modules/keepAlive");
const { run } = require("./modules/methods");
const app = require("express")();
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
require("dotenv").config();

keepAlive(app, 3000);
const client = new ToDoClient();

run(client, rl,  process.env["mode"])
