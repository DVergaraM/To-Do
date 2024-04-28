const { Client, EmbedBuilder } = require("discord.js");
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
  console.log(commands.repr());
  return new Map([
    ["add", commands.addTask.bind(commands)],
    ["list", commands.listTasks.bind(commands)],
    ["ping", commands.ping.bind(commands)],
    ["delete", commands.deleteTask.bind(commands)],
    ["help", commands.help.bind(commands)],
    ["setdone", commands.setDone.bind(commands)],
    ["setundone", commands.setUndone.bind(commands)],
    ["config", commands.config.bind(commands)],
    ["reminder", commands.reminder.bind(commands)],
  ]);
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
      console.error("Error:", error);
      client.channels.cache
        .get("1230190057684734124")
        .send({ content: error.message });
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
async function sendReminders(client, guildID, today) {
  let lang = await getLanguage(guildID);
  let channelInDB = await getChannel(guildID);
  let user = await getUser(guildID);
  let tasks = await getTasksByGuild(guildID);
  let tasksToSend = tasks.filter((t) => t.status === false);
  let tasksToDelete = tasks.filter((t) => t.date < today && t.status === true);
  let guild = client.guilds.cache.get(guildID);
  let embed = new EmbedBuilder();
  embed.setTitle("Reminders");
  if (!guild) {
    embed
      .setColor("Red")
      .setDescription(lang.language.guildNotFound.replace("{0}", guildID));
    client.channels.cache.get("1230190057684734124").send({ embeds: [embed] });
    return;
  }
  let channel = guild.channels.cache.get(channelInDB.channelID);
  if (!channel) {
    embed
      .setColor("Red")
      .setDescription(
        lang.language.channelNotFound.replace("{0}", channelInDB.channelID)
      );
    client.channels.cache.get("1230190057684734124").send({ embeds: [embed] });
    return;
  }
  if (tasksToSend.length > 0) {
    let tasksMessage = tasksToSend
      .map((t) => {
        let dueDate = new Date(t.date + "T12:00:00Z");
        dueDate.setHours(dueDate.getHours() + 5);
        let epochTimestamp = Math.floor(dueDate.getTime() / 1000);
        return `- ${t.id}. ${t.task} | <t:${epochTimestamp}:F>`;
      })
      .join("\n");

    let message = lang.language.reminder.replace("{0}", tasksToSend.length);
    await channel.send({
      content: `<@!${user.userID}> **${message}**:\n${tasksMessage}`,
    });
    embed.setColor("Green");
    embed.setDescription(
      `Reminders sent for guild "${guild.name}"\n${tasksMessage}`
    );
    client.channels.cache.get("1230190057684734124").send({ embeds: [embed] });
  } else {
    embed.setColor("Red");
    embed.setDescription(`No reminders to send for guild "${guild.name}"`);
    client.channels.cache.get("1230190057684734124").send({ embeds: [embed] });
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
  let { commandName, options } = interaction;
  const botCommands = botCommandsMap(client);
  commandName = commandName.toLowerCase();
  if (!botCommands.has(commandName)) return;
  botCommands.get(commandName)(interaction, options);
}
module.exports = {
  reminder,
  commandHandling,
};
