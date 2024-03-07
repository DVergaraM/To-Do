const { Client, GatewayIntentBits } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./tasks.db');
const config = require('./config.json');
//require('dotenv').config();
const express = require('express')
const app = express()
app.get('/', (_, res) => {
    res.send('Hello World', 5, 5)
  })
app.listen(3000)

db.run('CREATE TABLE IF NOT EXISTS tasks(task TEXT, due_date TEXT)');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', () => {
    console.log(`Bot is ready as: ${client.user.tag}`);
    /* createSlashCommand(client, config.guildID, 'add', 'Agrega una tarea', [
        {
            name: 'Date',
            type: 3,
            description: 'Task\'s due date in YYYY-MM-DD format',
            required: true,
        },
        {
            name: 'Task',
            type: 3,
            description: 'Task to be added',
            required: true,
        },
    ])
    createSlashCommand(client, config.guildID, 'list', 'Lista las tareas pendientes')*/

    setInterval(() => {
        let date = new Date();
        let today = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        if (date.getHours() === 9 && date.getMinutes() === 10) {
            db.all('SELECT task FROM tasks WHERE due_date = ?', [today], (err, rows) => {
                if (err) {
                    throw err;
                }
                let tasks = rows.map(r => r.task).join('\n');
                let channel = client.channels.cache.get(config.channelID); // Reemplaza 'CHANNEL_ID' con el ID de tu canal
                channel.send(`Tienes tareas pendientes para hoy:\n${tasks}`);
            });

            // Elimina las tareas cuya fecha de vencimiento haya pasado
            db.run('DELETE FROM tasks WHERE due_date < ?', [today], (err) => {
                if (err) {
                    throw err;
                }
            });
        }
    }, 60000);
});
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'add') {
        let due_date = options.getString('fecha');
        let task = options.getString('tarea');
        db.run(`INSERT INTO tasks(task, due_date) VALUES(?, ?)`, [task, due_date], function (err) {
            if (err) {
                return console.log(err.message);
            }
            interaction.reply(`Tarea "${task}" agregada para la fecha ${due_date}.`);
        });
    } else if (commandName === 'list') {
        db.all('SELECT task, due_date FROM tasks', (err, rows) => {
            if (err) {
                throw err;
            }
            let tasks = rows.map(r => `${r.task} - ${r.due_date}`).join('\n');
            interaction.reply(`Tareas pendientes:\n${tasks}`);
        });
    }
});

client.login(config.token);