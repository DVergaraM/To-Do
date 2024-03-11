const { Client } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./tasks.db');
const config = require('./config.json');
const { keepAlive } = require('./modules/keepAlive')
const { ready, interactionCreate, clientOptions } = require('./modules/events')

keepAlive()

const client = new Client(clientOptions);

client.once('ready', ready(client, db, config));
client.on('interactionCreate', interactionCreate(client, db));
client.login(config.token);