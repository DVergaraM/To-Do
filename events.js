const { ActivityType } = require('discord.js');

function interactionCreate(client) {
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
                let help = commands.map(c => `- /${c.name} - ${c.description} ${"- " + c.options.map(o => o.name).join(' ')}`).join('\n');
                interaction.reply(`Comandos disponibles:\n${help}`);
            });
        }
    }
}

function ready(client, db) {
    return () => {
        console.log(`Bot is ready as: ${client.user.tag}`);
        setInterval(() => {
            let date = new Date();
            let today = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
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
            if ((date.getHours() === 9 && date.getMinutes() === 15) || (date.getHours() === 20 && date.getMinutes() === 30)) {
                db.all('SELECT task FROM tasks WHERE due_date = ?', [today], (err, rows) => {
                    if (err) {
                        throw err;
                    }
                    let tasks = rows.map(r => r.task).join('\n');
                    let channel = client.channels.cache.get(config.channelID);
                    channel.send(`Tienes tareas pendientes para hoy:\n${tasks}`);
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

module.exports = {
    ready,
    interactionCreate
}
