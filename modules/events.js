const { Client, GatewayIntentBits } = require("discord.js");
const { reminder, commandHandling } = require("./clientMethods");
const { isReminderTime, changeStatus } = require("./methods");
const { Database } = require("sqlite3");

/**
 * Handles the interaction create event.
 * 
 * @param {Client} client - The Discord client.
 * @param {Database} db - The database object.
 * @returns {Function} - The interaction create event handler.
 */
function interactionCreate(client, db) {
    return async interaction => {
        if (!interaction.isCommand()) return;
        commandHandling(client, interaction, db);
    };
}

/**
 * Function that is called when the bot is ready.
 * @param {Client} client - The Discord client object.
 * @param {Database} db - The database object.
 * @param {Object} config - The configuration object.
 * @returns {Function} - A function that is called when the bot is ready.
 */
function ready(client, db, config) {
    return () => {
        console.log(`Bot is ready as: ${client.user.tag}`);
        /* client.application.commands.create({
            name: 'setlanguage',
            description: 'Set the language for this guild',
            options: [{
                name: 'language',
                type: 3,
                description: 'The language to set',
                required: true,
                choices: [
                    { name: 'English', value: 'en' },
                    { name: 'Spanish', value: 'es' },
                ],
            }],
        }); */
        setInterval(() => {
            let date = new Date();
            let [today, condition] = isReminderTime(date, config);
            changeStatus(client, db, config.guildID);
            reminder(client, db, config, today, condition);
        }, 60000);
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
};
