const axios = require("axios");

/**
 * Retrieves the configuration for a guild.
 * @param {string} guildID - The ID of the guild.
 * @returns {Promise<Object>} - A promise that resolves with the guild configuration.
 */
async function getConfig(guildID) {
  try {
    const response = await axios.get(
      `https://to-do-api-pqi0.onrender.com/config?guildID=${guildID}`
    );
    const body = response.data;
    let newBody = {
      code: body.code,
      guildID: body.guildID,
      channelID: body.channelID,
      userID: body.userID,
      language: body.language,
    };
    return newBody;
  } catch (err) {
    console.error("Error:", err);
    throw err;
  }
}

/**
 * Updates the configuration for a guild.
 * @param {string} guildID - The ID of the guild.
 * @param {string} channelID - The ID of the channel (optional).
 * @param {string} userID - The ID of the user (optional).
 * @param {string} language - The language code (optional).
 * @returns {Promise<Object>} - The updated configuration object.
 */
async function updateConfig(
  guildID,
  channelID = "",
  userID = "",
  language = ""
) {
  try {
    const response = await axios.put(
      `https://to-do-api-pqi0.onrender.com/config?guildID=${guildID}&channelID=${channelID}&userID=${userID}&language=${language}`
    );
    const body = response.data;
    let newBody = {
      code: body.code,
      message: body.message,
    };
    return newBody;
  } catch (err) {
    console.error("Error:", err);
    throw err;
  }
}

/**
 * Deletes the configuration for a guild.
 * @param {string} guildID - The ID of the guild.
 * @returns {Promise<Object>} - The response body containing the code and message.
 */
async function deleteConfig(guildID) {
  try {
    const response = await axios.delete(
      `https://to-do-api-pqi0.onrender.com/config?guildID=${guildID}`
    );
    const body = response.data;
    let newBody = {
      code: body.code,
      message: body.message,
    };
    return newBody;
  } catch (err) {
    console.error("Error:", err);
    throw err;
  }
}

/**
 * Creates a new configuration by sending a POST request to the server.
 * @param {string} guildID - The ID of the guild.
 * @param {string} channelID - The ID of the channel.
 * @param {string} userID - The ID of the user.
 * @param {string} language - The language to be set in the configuration.
 * @returns {Promise<Object>} - The response body containing the code and message.
 */
async function createConfig(guildID) {
  try {
    const response = await axios.post(
      `https://to-do-api-pqi0.onrender.com/config/`,
      {
        guildID: guildID,
        language: "en",
      }
    );
    const body = response.data;
    let newBody = {
      code: body.code,
      message: body.message,
    };
    return newBody;
  } catch (err) {
    console.error("Error:", err);
    throw err;
  }
}

module.exports = {
  getConfig,
  updateConfig,
  deleteConfig,
  createConfig,
};
