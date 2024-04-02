const request = require("request");

/**
 * Retrieves the language for a given guild ID.
 * @param {string} guildID - The ID of the guild.
 * @returns {Promise} - An object containing the code, guildID, and language.
 */
async function getLanguageById(guildID) {
  return new Promise((resolve, reject) => {
    let url = `http://localhost:3000/language`;
    if (guildID != "") {
      url += `?guildID=${guildID}`;
    }
    request(
      {
        url: url,
        method: "GET",
        json: true,
      },
      async (err, res, body) => {
        if (err) {
          console.error("Error:", err);
          reject(err);
          return;
        }
        if (!body || !body.code || !body.guildID || !body.language) {
          console.error("Invalid language data:", body);
          reject(new Error("Invalid language data"));
          return;
        }
        let newBody = {
          code: body.code,
          guildID: body.guildID,
          language: body.language,
        };
        resolve(newBody);
      }
    );
  });
}

/**
 * Retrieves the language data from the server.
 * @returns {Promise<Object>} A promise that resolves with the language data.
 * @throws {Error} If there is an error retrieving the language data or if the data is invalid.
 */
async function getLanguage() {
  return new Promise((resolve, reject) => {
    request(
      {
        url: `http://localhost:3000/language/`,
        json: true,
      },
      async (err, res, body) => {
        if (err) {
          console.error("Error:", err);
          reject(err);
          return;
        }
        if (!body || !body.code || !body.language) {
          console.error("Invalid language data:", body);
          reject(new Error("Invalid language data"));
          return;
        }
        resolve(body);
      }
    );
  });
}

module.exports = {
  getLanguage,
  getLanguageById,
};
