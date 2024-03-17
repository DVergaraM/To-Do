const { Client } = require("discord.js");
const commands = require("./commands.js");
const { Database } = require("sqlite3");
const request = require('request');
const { getChannel, getUser, getLanguage, getTasks} = require("./methods.js");
const botCommands = new Map([
  ["add", commands.addTask],
  ["list", commands.listTasks],
  ["ping", commands.ping],
  ["help", commands.help],
  ["delete", commands.deleteTask],
  ["setdone", commands.setDone],
  ["setundone", commands.setUndone],
  ["config", commands.config],
]);


/**
 * Sends reminders for tasks that are due today.
 * @param {Client} client - The Discord client object.
 * @param {Object} config - The configuration object.
 * @param {string} today - The current date in string format.
 * @param {boolean} isReminderTime - Indicates whether it's time to send reminders.
 * @returns {Promise<void>} - A promise that resolves when the reminders are sent.
 */
async function reminder(client, config, today, isReminderTime) {
  if (isReminderTime) {
    try {
      let lang = await getLanguage(config.guildID);
      let channeldb = await getChannel(config.guildID);
      let user = await getUser(config.guildID);
      let tasks = await getTasks(config.guildID);
      let tasksToSend = tasks.filter(t => new Date(t.date) >= new Date(today) && t.status === false);
      let tasksToDelete = tasks.filter(t => new Date(t.date) < new Date(today) && t.status === true);
      if (tasksToSend.length > 0) {
        let tasksMessage = tasksToSend
          .map((t) => {
            let dueDate = new Date(t.date + "T12:00:00Z");
            dueDate.setHours(dueDate.getHours() + 5);
            let epochTimestamp = Math.floor(dueDate.getTime() / 1000);
            return `- ${t.id}. ${t.task} | <t:${epochTimestamp}:F>`;
          })
          .join("\n");
        let channel = client.channels.cache.get(channeldb.channelID);
        let message = lang.language.reminder.replace("{0}", tasksToSend.length);
        await channel.send(`<@!${user.userID}> **${message}**\n: ${tasksMessage}`); // Esperar a que el mensaje se envíe
      }

      for (let t of tasksToDelete) {
        await deleteTask(config.guildID, t.id);
      }
    } catch (error) {
      console.error(error);
    }
  }
}

/**
 * Handles the execution of commands received from the client.
 *
 * @param {Client} client - The Discord client object.
 * @param {import('discord.js').Interaction} interaction - The interaction object representing the command.
 * @returns {void}
 */
function commandHandling(client, interaction) {
  const { commandName, options } = interaction;
  if (!botCommands.has(commandName)) return;
  botCommands.get(commandName)(client, interaction, options);
}
module.exports = {
  reminder,
  commandHandling,
};
