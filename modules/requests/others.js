const request = require("request");
const { ApplicationCommandOptionType, Client } = require("discord.js");
/**
 * Deletes a global command from the Discord application.
 *
 * @param {import('discord.js').Client} client - The Discord client instance.
 * @param {string} commandName - The name of the command to delete.
 * @returns {Promise<void>} - A promise that resolves when the command is deleted.
 */
async function deleteGlobalCommand(client, commandName) {
  const commands = await client.application.commands.fetch();

  const command = commands.find((cmd) => cmd.name === commandName);

  if (command) {
    await client.application.commands.delete(command.id);
    client.channels.cache
      .get("1230190057684734124")
      .send({ content: `Command ${commandName} deleted.` });
  } else {
    client.channels.cache
      .get("1230190057684734124")
      .send({ content: `Command ${commandName} not found.` });
  }
}

/**
 *
 * @param {Client} client
 */
async function deleteCommands(client) {
  const commands = await client.application.commands.fetch();
  commands.forEach(async (command) => {
    await client.application.commands.delete(command.id);
  });
  console.log("Commands deleted");
}

/**
 *
 * @param {Client} client
 */
async function createCommands(client) {
  // add
  client.application.commands.create({
    name: "add",
    description: "Add a new task",
    options: [
      {
        name: "date",
        description: "The due date for the task",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "task",
        description: "The task to be added",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  });
  // delete
  client.application.commands.create({
    name: "delete",
    description: "Delete a task",
    options: [
      {
        name: "id",
        description: "The ID of the task to delete",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  });
  // list
  client.application.commands.create({
    name: "list",
    description: "List all tasks",
    options: [
      {
        name: "status",
        description: "Filter by status",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
          { name: "Done", value: "done" },
          { name: "Pending", value: "pending" },
        ],
      },
    ],
  });
  // ping
  client.application.commands.create({
    name: "ping",
    description: "Replies with Pong!",
  });
  // help
  client.application.commands.create({
    name: "help",
    description: "List all commands",
  });
  // set done
  client.application.commands.create({
    name: "setdone",
    description: "Mark a task as done",
    options: [
      {
        name: "id",
        description: "The ID of the task to mark as done",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  });
  // set undone
  client.application.commands.create({
    name: "setundone",
    description: "Mark a task as undone",
    options: [
      {
        name: "id",
        description: "The ID of the task to mark as undone",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  });
  // config
  client.application.commands.create({
    name: "config",
    description: "Configure the bot",
    options: [
      {
        name: "get",
        description: "Get the current configuration",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "set",
        description: "Set the configuration",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "channel",
            description: "The channel to send reminders to",
            type: ApplicationCommandOptionType.Channel,
            required: false,
          },
          {
            name: "user",
            description: "The user to send reminders to",
            type: ApplicationCommandOptionType.User,
            required: false,
          },
          {
            name: "language",
            description: "The language to send reminders in",
            type: ApplicationCommandOptionType.String,
            required: false,
          },
        ],
      },
      {
        name: "reset",
        description: "Reset the configuration",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  });
  // reminder
  client.application.commands.create({
    name: "reminder",
    description: "Set a reminder",
    options: [
      {
        name: "list",
        description: "List all reminders",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "add",
        description: "Add a new reminder",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "time",
            description: "The time for the reminder",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: "delete",
        description: "Delete a reminder",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "id",
            description: "The ID of the reminder to delete",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
    ],
  });
  console.log("Commands created");
}

/**
 * Retrieves a list of users from the server.
 * @returns {Promise<Array>} A promise that resolves to an array of user objects.
 */
async function getUsers() {
  return new Promise((resolve, reject) => {
    request(
      {
        url: `https://to-do-api-pqi0.onrender.com/users/`,
        json: true,
      },
      (err, _res, body) => {
        if (err) {
          console.error("Error:", err);
          reject(err);
          return;
        }
        resolve(body);
      }
    );
  });
}

/**
 * Retrieves user data from a server.
 * @param {string} guildID - The ID of the guild.
 * @returns {Promise<Object>} - A promise that resolves to an object containing the user data.
 * @throws {Error} - If there is an error retrieving the user data or if the data is invalid.
 */
async function getUser(guildID) {
  return new Promise((resolve, reject) => {
    request(
      {
        url: `https://to-do-api-pqi0.onrender.com/config?guildID=${guildID}`,
        json: true,
      },
      async (err, _res, body) => {
        if (err) {
          console.error("Error:", err);
          reject(err);
          return;
        }
        if (!body || !body.guildID) {
          console.error("Invalid user data:", body);
          reject(new Error("Invalid user data"));
          return;
        }
        let newBody = {
          code: 200,
          guildID: body.guildID,
          userID: body.userID || "No userID provided",
        };
        resolve(newBody);
      }
    );
  });
}

/**
 * Retrieves the channel information for a given guild ID.
 * @param {string} guildID - The ID of the guild.
 * @returns {Promise<Object>} - A promise that resolves to an object containing the guild ID and channel ID.
 * @throws {Error} - If there is an error retrieving the channel data or if the data is invalid.
 */
async function getChannel(guildID) {
  return new Promise((resolve, reject) => {
    request(
      {
        url: `https://to-do-api-pqi0.onrender.com/config?guildID=${guildID}`,
        json: true,
      },
      async (err, _res, body) => {
        if (err) {
          console.error("Error:", err);
          reject(err);
          return;
        }
        if (!body || !body.guildID || !body.channelID) {
          console.error("Invalid channel data:", body);
          reject(new Error("Invalid channel data"));
          return;
        }
        let newBody = {
          code: 200,
          guildID: body.guildID,
          channelID: body.channelID,
        };
        resolve(newBody);
      }
    );
  });
}

/**
 * Retrieves the list of guilds from the server.
 * @returns {Promise<Array>} A promise that resolves to an array of guilds.
 */
async function getGuilds() {
  return new Promise((resolve, reject) => {
    request(
      {
        url: `https://to-do-api-pqi0.onrender.com/config/guilds`,
        json: true,
      },
      (err, _res, body) => {
        if (err) {
          console.error("Error:", err);
          reject(err);
          return;
        }
        resolve(body);
      }
    );
  });
}

module.exports = {
  deleteGlobalCommand,
  deleteCommands,
  createCommands,
  getUsers,
  getUser,
  getChannel,
  getGuilds,
};
