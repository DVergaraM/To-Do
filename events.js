const { ActivityType, GatewayIntentBits } = require('discord.js');
//const { handleAdd } = require('./handler/handler');

function interactionCreate(client, db) {
    return async (interaction) => {
        if (!interaction.isCommand()) return;

        const { commandName, options } = interaction;

        if (commandName === 'add') {
            let due_date = options.getString('fecha');
            let task = options.getString('tarea');
            db.run(`INSERT INTO tasks(task, due_date) VALUES(?, ?)`, [task, due_date], function (err) {
                if (err) {
                    return console.log(err.message);
                }
                let dt = new Date(due_date + 'T12:00:00Z');
                dt.setHours(dt.getHours() + 5);
                let epochTimestamp = Math.floor(dt.getTime() / 1000)
                interaction.reply(`Tarea "${task}" agregada para la fecha <t:${epochTimestamp}:F>.`);
            });
        } else if (commandName === 'list') {
            db.all('SELECT task, due_date, id FROM tasks WHERE done = 0', (err, rows) => {
                if (err) {
                    throw err;
                }
                let undoneTasks = rows.map(r => {
                    let dt = new Date(r.due_date + 'T12:00:00Z');
                    dt.setHours(dt.getHours() + 5);
                    let epochTimestamp = Math.floor(dt.getTime() / 1000)
                    return `- ${r.id}. ${r.task} | <t:${epochTimestamp}:R>`}).join('\n');
                db.all('SELECT task, due_date, id FROM tasks WHERE done = 1', (err, rows) => {
                    if (err) {
                        throw err;
                    }
                    let doneTasks = rows.map(r => {
                        let dt = new Date(r.due_date + 'T12:00:00Z');
                        dt.setHours(dt.getHours() + 5);
                        let epochTimestamp = Math.floor(dt.getTime() / 1000)
                        return `- ${r.id}. ${r.task} | <t:${epochTimestamp}:R>`}).join('\n');
                    interaction.reply(`**Tareas pendientes:**\n${undoneTasks}\n**Tareas realizadas:**\n${doneTasks}`);
                });
            });
        } else if (commandName === 'ping') interaction.reply(client.ws.ping + 'ms', { ephemeral: true });
        else if (commandName === 'help') client.application.commands.fetch().then(commands => {
            let help = commands.map(c => `- /${c.name} - ${c.description}`).join('\n');
            interaction.reply(`Comandos disponibles:\n${help}`);
        });
        else if (commandName === 'setdone') {
            let taskId = parseInt(options.getString('id'));
            db.run(`UPDATE tasks SET Done = 1 WHERE id = ?`, [taskId], function (err) {
                if (err) {
                    return console.log(err.message);
                }
                interaction.reply(`Tarea con id "${taskId}" marcada como realizada.`);
            });
        }
        else if (commandName === 'setundone') {
            let taskId = parseInt(options.getString('id'));
            db.run(`UPDATE tasks SET Done = 0 WHERE id = ?`, [taskId], function (err) {
                if (err) {
                    return console.log(err.message);
                }
                interaction.reply(`Tarea con id "${taskId}" marcada como pendiente.`);
            })
        } else if (commandName === 'delete') {
            let taskId = parseInt(options.getString('id'));
            db.run(`DELETE FROM tasks WHERE id = ?`, [taskId], function (err) {
                if (err) {
                    return console.log(err.message);
                }
                interaction.reply(`Tarea con id "${taskId}" eliminada.`);
            });
        }
    }
}

function convertUTCtoLocal(hour) { 
    let UTC = hour - 5;
    if (UTC < 0) UTC += 24;
    return UTC;
}

function ready(client, db, config) {
    return () => {
        console.log(`Bot is ready as: ${client.user.tag}`);
        /* client.application.commands.create({
            name: 'delete',
            description: 'Borra una tarea',
            options: [{
                name: 'id',
                type: 3,
                description: 'El ID de la tarea a borrar',
                required: true,
            }],
        }) */
        setInterval(() => {
            let date = new Date();
            let today = `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCDate().toString().padStart(2, '0')}`;
            let utcHours = date.getUTCHours();
            let utcMinutes = date.getUTCMinutes();
            let localHour = convertUTCtoLocal(utcHours);

            let isFirstReminder = localHour === config.firstRecordatoryHour && utcMinutes === config.firstRecordatoryMinute;
            let isSecondReminder = localHour === config.secondRecordatoryHour && utcMinutes === config.secondRecordatoryMinute;

            let isReminderTime = isFirstReminder || isSecondReminder;
            db.all('SELECT task FROM tasks WHERE done=0', (err, rows) => {
                if (err) {
                    throw err;
                }
                let tasks = rows.map(r => r.task);
                if (tasks.length === 0) return;
                else if (tasks.length === 1) client.user.setActivity('1 tarea pendiente', { type: ActivityType.Watching });
                else client.user.setActivity(`${tasks.length} tareas pendientes`, {
                    type: ActivityType.Watching
                });
            });
            if (isReminderTime) {
                db.all('SELECT task, due_date, id FROM tasks WHERE due_date >= ? AND done=0', [today], (err, rows) => {
                    if (err) {
                        throw err;
                    }
                    let tasks = rows.map(r => {
                        let dueDate = new Date(r.due_date + 'T12:00:00Z');
                        dueDate.setHours(dueDate.getHours() + 5)
                        let epochTimestamp = Math.floor(dueDate.getTime() / 1000);
                        return `- ${r.id}. ${r.task} | <t:${epochTimestamp}:F>`;
                    }).join('\n');
                    let channel = client.channels.cache.get(config.channelID);
                    channel.send(`<@!551063515084095488> **Tienes ${rows.length} tareas pendientes para hoy:**\n${tasks}`);
                });
                db.run('DELETE FROM tasks WHERE due_date < ? AND done=1', [today]);
            }
        }, 60000);
    }
}
const clientOptions = {
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
}
module.exports = {
    ready,
    interactionCreate,
    clientOptions
}
