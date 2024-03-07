const { Client, GatewayIntentBits } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const { interactionCreate, ready } = require('./events.js');
let db = new sqlite3.Database('./tasks.db');
const config = require('./config.json');
const { keepAlive } = require('./keepAlive.js')
keepAlive()


db.run('CREATE TABLE IF NOT EXISTS tasks(task TEXT, due_date TEXT)');
db.run('CREATE TABLE IF NOT EXISTS config(guild_id TEXT, channel_id TEXT)');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', ready(client, db));
client.on('interactionCreate', interactionCreate(client));

client.login(config.token);