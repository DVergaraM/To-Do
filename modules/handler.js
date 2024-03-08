function handleAdd(db, interaction, options) {
    let task = options.getString('task');
    let dueDate = options.getString('due_date');
    db.run('INSERT INTO tasks (task, due_date, done) VALUES (?, ?, 0)', [task, dueDate], function (err) {
        if (err) {
            return console.log(err.message);
        }
        interaction.reply(`Tarea "${task}" agregada.`);
    });
}

function handleList(db, interaction) {
    db.all('SELECT task, due_date, id FROM tasks WHERE done = 0', (err, rows) => {
        if (err) {
            throw err;
        }
        let undoneTasks = rows.map(r => {
            let dt = new Date(r.due_date + 'T12:00:00Z');
            dt.setHours(dt.getHours() + 5);
            let epochTimestamp = Math.floor(dt.getTime() / 1000)
            return `- ${r.id}. ${r.task} | <t:${epochTimestamp}:R>`
        }).join('\n');
        db.all('SELECT task, due_date, id FROM tasks WHERE done = 1', (err, rows) => {
            if (err) {
                throw err;
            }
            let doneTasks = rows.map(r => {
                let dt = new Date(r.due_date + 'T12:00:00Z');
                dt.setHours(dt.getHours() + 5);
                let epochTimestamp = Math.floor(dt.getTime() / 1000)
                return `- ${r.id}. ${r.task} | <t:${epochTimestamp}:R>`
            }).join('\n');
            interaction.reply(`**Tareas pendientes:**\n${undoneTasks}\n**Tareas realizadas:**\n${doneTasks}`);
        });
    });
}

function handleSetDone(db, interaction, options) {
    let taskId = parseInt(options.getString('id'));
    db.run(`UPDATE tasks SET Done = 1 WHERE id = ?`, [taskId], function (err) {
        if (err) {
            return console.log(err.message);
        }
        interaction.reply(`Tarea con id "${taskId}" marcada como realizada.`);
    });
}

function handleSetUndone(db, interaction, options) {
    let taskId = parseInt(options.getString('id'));
    db.run(`UPDATE tasks SET Done = 0 WHERE id = ?`, [taskId], function (err) {
        if (err) {
            return console.log(err.message);
        }
        interaction.reply(`Tarea con id "${taskId}" marcada como pendiente.`);
    });
}

function handleDelete(db, interaction, options) {
    let taskId = parseInt(options.getString('id'));
    db.run(`DELETE FROM tasks WHERE id = ?`, [taskId], function (err) {
        if (err) {
            return console.log(err.message);
        }
        interaction.reply(`Tarea con id "${taskId}" eliminada.`);
    });
}

module.exports = {
    handleAdd,
    handleList,
    handleSetDone,
    handleSetUndone,
    handleDelete
}