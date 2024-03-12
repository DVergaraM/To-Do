const { Client } = require("discord.js");
const { Database } = require("sqlite3");

const config = require("../config.json");

/**
 * Adds a task to the database and sends a reply message.
 * @param {Client} _ - Placeholder for the command context.
 * @param {import('discord.js').Interaction} interaction - The interaction object representing the command interaction.
 * @param {Object} options - The options object containing the task and due date.
 * @param {Database} db - The database object used to run the query.
 */
function addTask(_, interaction, options, db) {
  let due_date = options.getString("fecha");
  let task = options.getString("tarea");
  db.run(
    `INSERT INTO tasks(task, due_date) VALUES(?, ?)`,
    [task, due_date],
    (err) => {
      if (err) return console.log(err.message);
      let dt = new Date(due_date + "T12:00:00Z");
      dt.setHours(dt.getHours() + 5);
      let epochTimestamp = Math.floor(dt.getTime() / 1000);
      let message = config.lang.en.add
        .replace("{0}", task)
        .replace("{1}", `<t:${epochTimestamp}:F>`);
      interaction.reply(message);
    }
  );
}

/**
 * Retrieves and lists tasks based on the specified status.
 *
 * @param {Client} _ - Placeholder for the first parameter.
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @param {Object} options - The options object.
 * @param {Database} db - The database object.
 * @returns {void}
 */
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
      .map((r) => {
        let dt = new Date(r.due_date + "T12:00:00Z");
        dt.setHours(dt.getHours() + 5);
        let epochTimestamp = Math.floor(dt.getTime() / 1000);
        return `- ${r.id}. ${r.task} | <t:${epochTimestamp}:R>`;
      })
      .join("\n");

    if (status) {
      let message = config.lang.en.list_status
        .replace("{0}", status)
        .replace("{1}", tasks);
      interaction.reply(message);
    } else {
      db.all(
        "SELECT task, due_date, id FROM tasks WHERE done = 1",
        (err, rows) => {
          if (err) throw err;
          let doneTasks = rows
            .map((r) => {
              let dt = new Date(r.due_date + "T12:00:00Z");
              dt.setHours(dt.getHours() + 5);
              let epochTimestamp = Math.floor(dt.getTime() / 1000);
              return `- ${r.id}. ${r.task} | <t:${epochTimestamp}:R>`;
            })
            .join("\n");
          let message = config.lang.en.list
            .replace("{0}", tasks)
            .replace("{1}", doneTasks);
          interaction.reply(message);
        }
      );
    }
  });
}
/**
 * Retrieves and lists tasks based on the specified status.
 *
 * @param {Client} client - Placeholder for the first parameter.
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @param {Object} _ - The options object.
 * @param {Database} _b - The database object.
 * @returns {void}
 */
function ping(client, interaction, _, _b) {
  interaction.reply(client.ws.ping + "ms", { ephemeral: true });
}

/**
 * Retrieves and lists tasks based on the specified status.
 *
 * @param {Client} client - Placeholder for the first parameter.
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @param {Object} _ - The options object.
 * @param {Database} _a - The database object.
 * @returns {void}
 */
function help(client, interaction, _, _a) {
  client.application.commands.fetch().then((commands) => {
    const commandList = commands
      .map((c) => {
        return `/${c.name} - ${c.description}`;
      })
      .join("\n");
    let message = config.lang.en.help.replace("{0}", commandList);
    interaction.reply(message);
  });
}

/**
 * Retrieves and lists tasks based on the specified status.
 *
 * @param {Client} _ - Placeholder for the first parameter.
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @param {Object} options - The options object.
 * @param {Database} db - The database object.
 * @returns {void}
 */
function deleteTask(_, interaction, options, db) {
  let taskDelete = parseInt(options.getString("id"));
  db.run(`DELETE FROM tasks WHERE id = ?`, [taskDelete], (err) => {
    if (err) return console.log(err.message);
    let message = config.lang.en.deleteTask.replace("{0}", taskDelete);
    interaction.reply(message);
  });
}

/**
 * Retrieves and lists tasks based on the specified status.
 *
 * @param {Client} _ - Placeholder for the first parameter.
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @param {Object} options - The options object.
 * @param {Database} db - The database object.
 * @returns {void}
 */
function setDone(_, interaction, options, db) {
  let taskId = parseInt(options.getString("id"));
  db.run(`UPDATE tasks SET Done = 1 WHERE id = ?`, [taskId], (err) => {
    if (err) return console.log(err.message);
    let message = config.lang.en.setDone.replace("{0}", taskId);
    interaction.reply(message);
  });
}

/**
 * Retrieves and lists tasks based on the specified status.
 *
 * @param {Client} _ - Placeholder for the first parameter.
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @param {Object} options - The options object.
 * @param {Database} db - The database object.
 * @returns {void}
 */
function setUndone(_, interaction, options, db) {
  let taskId = parseInt(options.getString("id"));
  db.run(`UPDATE tasks SET Done = 0 WHERE id = ?`, [taskId], (err) => {
    if (err) return console.log(err.message);
    let message = config.lang.en.setUndone.replace("{0}", taskId);
    interaction.reply(message);
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
