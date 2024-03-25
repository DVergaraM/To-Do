const { Client } = require("discord.js");
const Commands = require("./commands.js");
const { getLanguage } = require("./requests/language");
const { deleteTask, getTasksByGuild } = require("./requests/task");
const { getGuilds, getChannel, getUser } = require("./requests/others");

/**
 * Creates a map of bot commands.
 *
 * @param {Client} client - The Discord client object.
 * @returns {Map<string, Function>}  - A map of bot commands.
 */
function botCommandsMap(client) {
  const commands = new Commands(client);
  return {
    add: commands.addTask,
    list: commands.listTasks,
    ping: commands.ping,
    remove: commands.deleteTask,
    help: commands.help,
    setdone: commands.setDone,
    setundone: commands.setUndone,
    config: commands.config,
    reminder: commands.reminder,
  };
}

/**
 * Sends reminders for tasks that are due today.
 * @param {Client} client - The Discord client object.
 * @param {string} today - The current date in string format.
 * @param {boolean} isReminderTime - Indicates whether it's time to send reminders.
 * @returns {Promise<void>} - A promise that resolves when the reminders are sent.
 */
async function reminder(client, today, isReminderTime) {
  if (isReminderTime) {
    try {
      let guilds = await getGuilds();
      for (let guild of guilds) {
        await sendReminders(client, guild, today);
      }
    } catch (error) {
      console.error(error);
    }
  }
}
/**
 * Sends reminders for tasks based on the current date.
 * @param {Client} client - The Discord client object.
 * @param {string} guildID - The guild object.
 * @param {string} today - The current date in string format.
 * @returns {Promise<void>} - A promise that resolves when the reminders are sent.
 */
async function sendReminders(client, guildID) {
  let lang = await getLanguage(guildID);
  let channeldb = await getChannel(guildID);
  let user = await getUser(guildID);
  let tasks = await getTasksByGuild(guildID);
  let tasksToSend = tasks.filter((t) => t.status === false);

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
    await channel.send(`<@!${user.userID}> **${message}**:\n ${tasksMessage}`);
    console.log(`Reminders sent for guild ${guildID}`);
  } else {
    console.log(`No reminders to send for guild ${guildID}`);
  }

  for (let t of tasksToDelete) {
    await deleteTask(t.id);
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
  const botCommands = botCommandsMap(client);
  if (!botCommands.has(commandName)) return;
  botCommands.get(commandName)(interaction, options);
}
module.exports = {
  reminder,
  commandHandling,
};
