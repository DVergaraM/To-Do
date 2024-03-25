const request = require("request");

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
    console.log(`Command ${commandName} deleted.`);
  } else {
    console.log(`Command ${commandName} not found.`);
  }
}

/**
 * Retrieves a list of users from the server.
 * @returns {Promise<Array>} A promise that resolves to an array of user objects.
 */
async function getUsers() {
  return new Promise((resolve, reject) => {
    request(
      {
        url: `http://localhost:3000/users/`,
        json: true,
      },
      (err, res, body) => {
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
        url: `http://localhost:3000/config/`,
        json: true,
        body: {
          guildID: guildID,
        },
      },
      async (err, res, body) => {
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
        url: `http://localhost:3000/config/`,
        json: true,
        body: {
          guildID: guildID,
        },
      },
      async (err, res, body) => {
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
        url: `http://localhost:3000/config/guilds`,
        json: true,
      },
      (err, res, body) => {
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
  getUsers,
  getUser,
  getChannel,
  getGuilds,
};
