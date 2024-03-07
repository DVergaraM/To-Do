const { ActivityType, GatewayIntentBits } = require('discord.js');

function interactionCreate(client, db) {
    return async interaction => {
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
                let tasks = rows.map(r => `- ${r.task} - ${r.due_date}`).join('\n');
                interaction.reply(`**Tareas pendientes:**\n${tasks}`);
            });
        } else if (commandName === 'ping') {
            interaction.reply(client.ws.ping + 'ms', { ephemeral: true });
        } else if (commandName === 'help') {
            client.application.commands.fetch().then(commands => {
                let options = commands.map(c => c.options);
                let help = commands.map(c => `- /${c.name} - ${c.description} \`- ${options}\``).join('\n');
                interaction.reply(`Comandos disponibles:\n${help}`);
            });
        }
    }
}

function convertlocalHourintoUTCHour(hour) {
    let UTC = hour - 5;
    if (UTC < 0) {
        UTC = UTC + 24;
    }
    return UTC;
}

function ready(client, db, config) {
    return () => {
        console.log(`Bot is ready as: ${client.user.tag}`);
        setInterval(() => {
            let date = new Date();
            let today = `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCDate().toString().padStart(2, '0')}`;
            db.all('SELECT task FROM tasks', (err, rows) => {
                if (err) {
                    throw err;
                }
                let tasks = rows.map(r => r.task);
                if (tasks.length === 0) {
                    return;
                } else if (tasks.length === 1) {
                    client.user.setActivity('1 tarea pendiente', {
                        type: ActivityType.Watching
                    });
                    return;
                }
                else {
                    client.user.setActivity(`${tasks.length} tareas pendientes`, {
                        type: ActivityType.Watching
                    });
                    return;
                }
            });
            if ((convertlocalHourintoUTCHour(date.getUTCHours()) == config.firstRecordatoryHour && date.getUTCMinutes() === config.firstRecordatoryMinute) || (convertlocalHourintoUTCHour(date.getUTCHours()) === config.secondRecordatoryHour && date.getUTCMinutes() === config.secondRecordatoryMinute)) {
                db.all('SELECT task, due_date FROM tasks WHERE due_date >= ?', [today], (err, rows) => {
                    if (err) {
                        throw err;
                    }
                    let tasks = rows.map(r => {
                        let dueDate = new Date(r.due_date + 'T00:00:00Z');
                        dueDate.setHours(dueDate.getHours() + 5)
                        let epochTimestamp = Math.floor(dueDate.getTime() / 1000);
                        return `- ${r.task} | <t:${epochTimestamp}:F>`;
                    }).join('\n');
                    let channel = client.channels.cache.get(config.channelID);
                    channel.send(`<@!551063515084095488> **Tienes ${rows.length} tareas pendientes para hoy:**\n${tasks}`);
                });
                db.run('DELETE FROM tasks WHERE due_date < ?', [today], (err) => {
                    if (err) {
                        throw err;
                    }
                });
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
