const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
} = require("discord.js");
const { reminder, commandHandling } = require("./clientMethods");
const { isReminderTime, changeStatus } = require("./methods");
const { createConfig, deleteConfig } = require("./requests/config");
const { createCommands } = require("./requests/others");

/**
 * Handles the interaction create event.
 * @param {Client} client - The Discord client object.
 * @returns {Function} The interaction create event handler.
 */
function interactionCreate(client) {
  /**
   * The interaction create event handler.
   * @param {import('discord.js').Interaction} interaction - The interaction object.
   */
  return async (interaction) => {
    console.log("Interaction received.")
    console.log(interaction.isCommand())
    if (!interaction.isCommand()) return;
    await commandHandling(client, interaction);
  };
}

/**
 * Function that returns a callback function to be executed when the bot is ready.
 * @param {Client} client - The Discord client object.
 * @returns {Function} - The callback function to be executed when the bot is ready.
 */
function ready(client) {
  return async () => {
    //createCommands(client);
    console.log("Bot is ready.");
    let embed = new EmbedBuilder();
    embed.setColor("DarkAqua");
    embed.setTitle("To-Do Bot is ready.");
    embed.setTimestamp();
    client.channels.cache.get("1230190057684734124").send({ embeds: [embed] });
    setInterval(async () => {
      let date = new Date();
      let [today, condition] = await isReminderTime(date);
      await changeStatus(client);
      await reminder(client, today, condition);
    }, 60000);
  };
}

/**
 * Creates a guild create event handler.
 * @returns {Function} The guild create event handler function.
 */
function guildCreate() {
  return (guild) => {
    createConfig(guild.id);
  };
}

/**
 * Deletes the configuration for a guild.
 * @returns {Function} The guild delete event handler function.
 */
function guildDelete() {
  return (guild) => {
    deleteConfig(guild.id);
  };
}
/**
 * Options for the Discord client.
 *
 * @typedef {Object} ClientOptions
 * @property {GatewayIntentBits[]} intents - The intents for the client.
 */

/**
 * The client options.
 *
 * @type {ClientOptions}
 */
const clientOptions = {
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
};
module.exports = {
  ready,
  interactionCreate,
  clientOptions,
  guildCreate,
  guildDelete,
};
