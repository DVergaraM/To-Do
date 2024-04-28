const request = require("request");
;

/**
 * Retrieves the configuration for a guild.
 * @param {string} guildID - The ID of the guild.
 * @returns {Promise<Map<string, any>>} - A promise that resolves with the guild configuration.
 */
async function getConfig(guildID) {
  return new Promise((resolve, reject) => {
    request(
      {
        url: `https://to-do-api-pqi0.onrender.com/config?guildID=${guildID}`,
        json: true,
      },
      (err, _res, body) => {
        if (err) {
          console.error("Error:", err);
          reject(err);
          return;
        }
        let newBody = {
          code: body.code,
          guildID: body.guildID,
          channelID: body.channelID,
          userID: body.userID,
          language: body.language,
        };
        resolve(newBody);
      }
    );
  });
}

/**
 * Updates the configuration settings for a guild.
 * @param {string} guildID - The ID of the guild.
 * @param {string} channelID - The ID of the channel.
 * @param {string} userID - The ID of the user.
 * @param {string} language - The language setting.
 * @returns {Map<string, any>} - The updated configuration object.
 */
async function updateConfig(guildID, channelID, userID, language) {
  let url = `https://to-do-api-pqi0.onrender.com/config?guildID=${guildID}`;

  if (channelID !== "") {
    url += `&channelID=${channelID}`;
  }

  if (userID !== "") {
    url += `&userID=${userID}`;
  }

  if (language !== "") {
    url += `&language=${language}`;
  }

  request(
    {
      url: url,
      method: "PUT",
      json: true,
    },
    (err, _res, body) => {
      if (err) {
        console.error("Error:", err);
        return;
      }
      let newBody = {
        code: body.code,
        message: body.message,
      };
      return newBody;
    }
  );
}

/**
 * Deletes the configuration for a guild.
 * @param {string} guildID - The ID of the guild.
 * @returns {Map<String, any>} - The response body containing the code and message.
 */
function deleteConfig(guildID) {
  request(
    {
      url: `https://to-do-api-pqi0.onrender.com/config?guildID=${guildID}`,
      method: "DELETE",
      json: true,
    },
    (err, _res, body) => {
      if (err) {
        console.error("Error:", err);
        return;
      }
      let newBody = {
        code: body.code,
        message: body.message,
      };
      return newBody;
    }
  );
}

/**
 * Creates a new configuration by sending a POST request to the server.
 * @param {string} guildID - The ID of the guild.
 * @param {string} channelID - The ID of the channel.
 * @param {string} userID - The ID of the user.
 * @param {string} language - The language to be set in the configuration.
 * @returns {Map<string, any>} - The response body containing the code and message.
 */
function createConfig(guildID) {
  request(
    {
      url: `https://to-do-api-pqi0.onrender.com/config/`,
      method: "POST",
      json: true,
      body: {
        guildID: guildID,
        language: "en",
      },
    },
    (err, _res, body) => {
      if (err) {
        console.error("Error:", err);
        return;
      }
      let newBody = {
        code: body.code,
        message: body.message,
      };
      return newBody;
    }
  );
}

module.exports = {
  getConfig,
  updateConfig,
  deleteConfig,
  createConfig,
};
