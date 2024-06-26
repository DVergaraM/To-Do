const axios = require("axios");

/**
 * Retrieves the language for a given guild ID.
 * @param {string} guildID - The ID of the guild.
 * @returns {Promise<Object>} - An object containing the code, guildID, and language.
 */
async function getLanguageById(guildID) {
  try {
    let url = `https://to-do-api-pqi0.onrender.com/language`;
    if (guildID !== "") {
      url += `?guildID=${guildID}`;
    }
    const response = await axios.get(url);
    const body = response.data;
    if (!body || !body.code || !body.guildID || !body.language) {
      throw new Error("Invalid language data");
    }
    return {
      code: body.code,
      guildID: body.guildID,
      language: body.language,
    };
  } catch (err) {
    console.error("Error:", err);
    throw err;
  }
}

/**
 * Retrieves the language data from the server.
 * @returns {Promise<Object>} A promise that resolves with the language data.
 * @throws {Error} If there is an error retrieving the language data or if the data is invalid.
 */
async function getLanguage() {
  try {
    const response = await axios.get(
      `https://to-do-api-pqi0.onrender.com/language/`
    );
    const body = response.data;
    if (!body || !body.code || !body.language) {
      throw new Error("Invalid language data");
    }
    return body;
  } catch (err) {
    console.error("Error:", err);
    throw err;
  }
}

module.exports = {
  getLanguage,
  getLanguageById,
};
