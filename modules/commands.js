function addTask(_, interaction, options, db) {
    let due_date = options.getString("fecha");
    let task = options.getString("tarea");
    db.run(
        `INSERT INTO tasks(task, due_date) VALUES(?, ?)`,
        [task, due_date],
        err => {
            if (err) return console.log(err.message);
            let dt = new Date(due_date + "T12:00:00Z");
            dt.setHours(dt.getHours() + 5);
            let epochTimestamp = Math.floor(dt.getTime() / 1000);
            interaction.reply(
                `Tarea "${task}" agregada para la fecha <t:${epochTimestamp}:F>.`
            );
        }
    );
}

function listTasks(_, interaction, options, db) {
    let status = options ? options.getString("status") : null;
    let query = "SELECT task, due_date, id FROM tasks";

    if (status === "done") {
        query += " WHERE done = 1";
    } else if (status === "undone") {
        query += " WHERE done = 0";
    }

    db.all(query, (err, rows) => {
        if (err) throw err;
        let tasks = rows
            .map(r => {
                let dt = new Date(r.due_date + "T12:00:00Z");
                dt.setHours(dt.getHours() + 5);
                let epochTimestamp = Math.floor(dt.getTime() / 1000);
                return `- ${r.id}. ${r.task} | <t:${epochTimestamp}:R>`;
            })
            .join("\n");

        if (status) {
            interaction.reply(`**Tareas ${status} :**\n${tasks}`);
        } else {
            db.all(
                "SELECT task, due_date, id FROM tasks WHERE done = 1",
                (err, rows) => {
                    if (err) throw err;
                    let doneTasks = rows
                        .map(r => {
                            let dt = new Date(r.due_date + "T12:00:00Z");
                            dt.setHours(dt.getHours() + 5);
                            let epochTimestamp = Math.floor(dt.getTime() / 1000);
                            return `- ${r.id}. ${r.task} | <t:${epochTimestamp}:R>`;
                        })
                        .join("\n");
                    interaction.reply(
                        `**Tareas pendientes:**\n${tasks}\n**Tareas realizadas:**\n${doneTasks}`
                    );
                }
            );
        }
    });
}

function ping(client, interaction, _, _b) {
    interaction.reply(client.ws.ping + "ms", { ephemeral: true });
}

function help(client, interaction, _, _a) {
    client.application.commands.fetch().then(commands => {
        const commandList = commands
            .map(c => {
                return `/${c.name} - ${c.description}`;
            })
            .join("\n");
        interaction.reply(`Comandos disponibles:\n${commandList}`);
    });
}

function deleteTask(_, interaction, options, db) {
    let taskDelete = parseInt(options.getString("id"));
    db.run(`DELETE FROM tasks WHERE id = ?`, [taskDelete], err => {
        if (err) return console.log(err.message);
        interaction.reply(`Tarea con id "${taskDelete}" eliminada.`);
    });
}

function setDone(_, interaction, options, db) {
    let taskId = parseInt(options.getString("id"));
    db.run(`UPDATE tasks SET Done = 1 WHERE id = ?`, [taskId], err => {
        if (err) return console.log(err.message);
        interaction.reply(`Tarea con id "${taskId}" marcada como realizada.`);
    });
}

function setUndone(_, interaction, options, db) {
    let taskId = parseInt(options.getString("id"));
    db.run(`UPDATE tasks SET Done = 0 WHERE id = ?`, [taskId], err => {
        if (err) return console.log(err.message);
        interaction.reply(`Tarea con id "${taskId}" marcada como pendiente.`);
    });
}

module.exports = {
    addTask,
    listTasks,
    ping,
    help,
    deleteTask,
    setDone,
    setUndone,
};
