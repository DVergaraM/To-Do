const { Client } = require("discord.js");
const commands = require("./commands");
const { Database } = require("sqlite3");
const botCommands = new Map([
  ["add", commands.addTask],
  ["list", commands.listTasks],
  ["ping", commands.ping],
  ["help", commands.help],
  ["delete", commands.deleteTask],
  ["setdone", commands.setDone],
  ["setundone", commands.setUndone],
]);

/**
 * Sends a reminder message to the specified user with pending tasks for today.
 * @param {Client} client - The Discord client object.
 * @param {Database} db - The database object.
 * @param {Object} config - The configuration object.
 * @param {string} today - The current date in YYYY-MM-DD format.
 * @param {boolean} isReminderTime - Indicates whether it's time to send the reminder.
 */
function reminder(client, db, config, today, isReminderTime) {
  if (isReminderTime) {
    db.all(
      "SELECT task, due_date, id FROM tasks WHERE due_date >= ? AND done=0",
      [today],
      (err, rows) => {
        if (err) throw err;
        let tasks = rows
          .map((r) => {
            let dueDate = new Date(r.due_date + "T12:00:00Z");
            dueDate.setHours(dueDate.getHours() + 5);
            let epochTimestamp = Math.floor(dueDate.getTime() / 1000);
            return `- ${r.id}. ${r.task} | <t:${epochTimestamp}:F>`;
          })
          .join("\n");
        let channel = client.channels.cache.get(config.channelID);
        let message = config.lang.en.reminder.replace("{0}", rows.length);
        channel.send(`<@!${config.userID}> **${message}**\n${tasks}`);
      }
    );
    db.run("DELETE FROM tasks WHERE due_date < ? AND done=1", [today]);
  }
}

/**
 * Handles the execution of commands received from the client.
 *
 * @param {Client} client - The Discord client object.
 * @param {import('discord.js').Interaction} interaction - The interaction object representing the command.
 * @param {Database} db - The database object (or any other relevant data) needed for command execution.
 * @returns {void}
 */
function commandHandling(client, interaction, db) {
  const { commandName, options } = interaction;
  if (!botCommands.has(commandName)) return;
  botCommands.get(commandName)(client, interaction, options, db);
}
module.exports = {
  reminder,
  commandHandling,
};
