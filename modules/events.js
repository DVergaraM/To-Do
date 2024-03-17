const { Client, GatewayIntentBits } = require("discord.js");
const { reminder, commandHandling } = require("./clientMethods");
const { isReminderTime, changeStatus, createConfig, deleteConfig } = require("./methods");


/**
 * Handles the interactionCreate event.
 *
 * @param {Client} client - The Discord client.
 * @returns {Function} - The interactionCreate event handler.
 */
function interactionCreate(client) {
    return async interaction => {
        if (!interaction.isCommand()) return;
        commandHandling(client, interaction);
    };
}


/**
 * Function that returns a callback function to be executed when the bot is ready.
 * @param {Client} client - The Discord client object.
 * @param {Object} config - The configuration object.
 * @returns {Function} - The callback function to be executed when the bot is ready.
 */
function ready(client, config) {
    return async () => {
        console.log(`Bot is ready as: ${client.user.tag}`);
        setInterval(async () => {
            let date = new Date();
            let [today, condition] = isReminderTime(date, config);
            await changeStatus(client, config.guildID);
            await reminder(client, config, today, condition);
        }, 60000);
    };
}

/**
 * Creates a guild create event handler.
 * @returns {Function} The guild create event handler function.
 */
function guildCreate() {
    return guild => {
        createConfig(guild.id);
    };
}


/**
 * Deletes the configuration for a guild.
 * @param {Guild} guild - The guild object.
 */
function guildDelete() {
    return guild => {
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
