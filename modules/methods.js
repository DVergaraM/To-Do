const { Client, ActivityType } = require("discord.js");
const { Database } = require("sqlite3");
const config = require("../config.json");
const request = require("request");

/**
 * Converts a given UTC hour to the corresponding local hour.
 * @param {number} hour - The UTC hour to convert.
 * @returns {number} - The corresponding local hour.
 */
function convertUTCtoLocal(hour) {
  let UTC = hour - 5;
  if (UTC < 0) UTC += 24;
  return UTC;
}
/**
 * Get the date, local hour, and UTC minutes.
 * @param {Date} date - The date object.
 * @returns {Array<string, number>} - An array containing the date, local hour, and UTC minutes.
 */
function getDate(date) {
  let today = `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getUTCDate().toString().padStart(2, "0")}`;
  let utcHours = date.getUTCHours();
  let utcMinutes = date.getUTCMinutes();
  let localHour = convertUTCtoLocal(utcHours);
  return [today, localHour, utcMinutes];
}
/**
 * Checks if the given date matches any of the configured reminder times.
 *
 * @param {Date} date - The date to check.
 * @param {Object} config - The configuration object containing reminder times.
 * @param {Object[]} config.recordatories - An array of reminder times.
 * @param {number} config.recordatories[].hour - The hour of the reminder.
 * @param {number} config.recordatories[].minute - The minute of the reminder.
 * @returns {Array<Date, boolean>} - An array containing the current date and a boolean indicating if it matches any reminder time.
 */
function isReminderTime(date, config) {
  let [today, localHour, utcMinutes] = getDate(date);
  return [
    today,
    config.recordatories.some(
      (recordatory) =>
        localHour === recordatory.hour && utcMinutes === recordatory.minute
    ),
  ];
}

/**
 * Changes the status of the client's activity based on the number of pending tasks.
 * @param {Client} client - The Discord client object.
 * @param {Database} db - The database object.
 * @param {string} guildID - The ID of the guild to fetch the language from
 */
async function changeStatus(client, db, guildID) {
  let lang = await fetch(db, guildID);
  db.all("SELECT task FROM tasks WHERE done=0", (err, rows) => {
    if (err) throw err;
    let tasks = rows.map((r) => r.task);
    if (tasks.length === 0) return;
    else if (tasks.length === 1)
      client.user.setActivity(lang["defaultActivity"], {
        type: ActivityType.Watching,
      });
    else {
      let activity = lang["defaultActivityPlural"].replace(
        "{0}",
        tasks.length
      );
      client.user.setActivity(activity, {
        type: ActivityType.Watching,
      });
    }
  });
}

function fetch(db, guildID) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT language FROM guilds WHERE id = ?",
      [guildID],
      (err, row) => {
        if (err) {
          console.error("Error:", err);
          reject(err);
        }

        if (!row) {
          db.run(
            "INSERT INTO guilds(id, language) VALUES(?, ?)",
            [guildID, "en"],
            (err) => {
              if (err) {
                console.error("Error:", err);
                reject(err);
              } else {
                resolve("en");
              }
            }
          );
        } else {
          let language = row.language;
          const url = `http://localhost:3000/language/${language}`;

          request({ url, json: true }, (error, response, body) => {
            if (error) {
              console.error("Error:", error);
              // Aún resuelve la promesa con el cuerpo de la respuesta, incluso si hay un error
              resolve(body);
            } else {
              resolve(body);
            }
          });
        }
      }
    );
  });
}
module.exports = {
  isReminderTime,
  changeStatus,
  fetch,
};
