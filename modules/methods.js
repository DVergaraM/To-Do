const { Client, ActivityType, EmbedBuilder, Channel } = require("discord.js");
const { getReminders } = require("./requests/reminder");
const { getTasksCount } = require("./requests/task");
const { getLanguage } = require("./requests/language");
const { getUsers } = require("./requests/others");

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
 * Adds leading zeros to minutes if less than 10.
 *
 * @param {number} minutes - The minutes value.
 * @returns {string} The minutes value with leading zeros if less than 10.
 */
function addZerosToMinutes(minutes) {
  if (minutes < 10) return `0${minutes}`;
  return `${minutes}`;
}

function isOClock(minute) {
  return minute === "00"
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
  let utcMinutes = addZerosToMinutes(date.getUTCMinutes());
  let localHour = convertUTCtoLocal(date.getUTCHours());
  return [today, localHour, utcMinutes];
}
/**
 * Checks if the given date matches any of the configured reminder times.
 *
 * @param {Date} date - The date to check.
 * @returns {Promise<Array<T>>} - An array containing the current date and a boolean indicating if it matches any reminder time.
 */
async function isReminderTime(date) {
  const [today, currentHour, currentMinute] = getDate(date);
  const users = await getUsers();

  const recordatories = [];

  for (const user of users) {
    const reminders = (await getReminders(user.userID)) || [];
    for (const reminder of reminders.data) {
      const [reminderHour, reminderMinute] = [
        reminder.hour,
        reminder.minute,
      ].map((part) => parseInt(part, 10));
      if (isNaN(reminderHour) || isNaN(reminderMinute)) continue;
      if (
        isReminderTimeMatch(
          reminderHour,
          String(reminderMinute),
          currentHour,
          currentMinute
        )
      )
        recordatories.push(reminder);
    }
  }
  return [
    today,
    recordatories.some(({ hour, minute }) =>
      isReminderTimeMatch(
        parseInt(hour, 10),
        String(minute),
        currentHour,
        currentMinute
      )
    ),
  ];
}

/**
 * Checks if the reminder time matches the current time.
 * @param {number} reminderHour - The hour of the reminder.
 * @param {number} reminderMinute - The minute of the reminder.
 * @param {number} currentHour - The current hour.
 * @param {number} currentMinute - The current minute.
 * @returns {boolean} - Returns true if the reminder time matches the current time, otherwise false.
 */
function isReminderTimeMatch(
  reminderHour,
  reminderMinute,
  currentHour,
  currentMinute
) {
  return (
    (reminderHour === currentHour && reminderMinute === currentMinute) ||
    (reminderHour === currentHour + 1 && reminderMinute === currentMinute - 59) ||
    (reminderHour === currentHour - 1 && reminderMinute === currentMinute + 59) ||
    (isOClock(reminderMinute) && reminderHour === currentHour - 1 && currentMinute === 59) ||
    (isOClock(reminderMinute) && reminderHour === currentHour + 1 && currentMinute === 0) ||
    (isOClock(currentMinute) && reminderHour === currentHour && reminderMinute === 59) ||
    (isOClock(currentMinute) && reminderHour === currentHour + 1 && reminderMinute === 0) ||
    (isOClock(currentMinute) && reminderHour === currentHour - 1 && reminderMinute === 59) || 
    (isOClock(currentMinute) && reminderHour === currentHour && reminderMinute === 0) || 
    (isOClock(reminderMinute) && reminderHour === currentHour && currentMinute === 59) ||
    (isOClock(reminderMinute) && reminderHour === currentHour && currentMinute === 0)
  );
}

/**
 * Changes the status of the client user based on the number of tasks.
 * @param {Client} client - The Discord client instance.
 * @param {string} guildID - The ID of the guild.
 * @returns {Promise<void>} - A promise that resolves when the status is changed.
 */
async function changeStatus(client) {
  const { language = {} } = (await getLanguage()) || {};
  const { defaultActivity, defaultActivityPlural, noTasksActivity } = language;

  if (!defaultActivity || !defaultActivityPlural || !noTasksActivity) {
    client.channels.cache.get("1230190057684734124").send({
      content: `Invalid language data: ${language}`,
    });
    return;
  }

  const tasks = await getTasksCount();
  let activity;

  switch (tasks) {
    case 0:
      activity = noTasksActivity;
      break;
    case 1:
      activity = defaultActivity;
      break;
    default:
      activity = defaultActivityPlural.replace("{0}", tasks);
  }

  client.user.setActivity(activity, { type: ActivityType.Watching });
}

/**
 * Replaces multiple occurrences of strings in a given text.
 *
 * @param {string[]} toReplace - An array of strings to be replaced.
 * @param {string[]} replaceWith - An array of strings to replace the corresponding strings in `toReplace`.
 * @param {string} text - The text in which the replacements will be made.
 * @param {Client} client - The Discord client instance.
 * @returns {string} The modified text with the replacements.
 * @throws {Error} If the length of `toReplace` and `replaceWith` arrays are not the same.
 */
function multipleReplaceForLanguage(toReplace, replaceWith, text, client) {
  let embed = new EmbedBuilder();
  embed.setTitle("Error");
  if (toReplace.length !== replaceWith.length) {
    embed.setColor("Red");
    embed.setDescription(
      `The length of the arrays must be the same: ${toReplace.join(
        ", "
      )} | ${replaceWith.join(", ")}`
    );
    let c = client.channels.cache.get("1230190057684734124");
    if (c instanceof Channel) c.send({ embed: embed });
    throw new Error("The length of the arrays must be the same.");
  }
  for (let i = 0; i < toReplace.length; i++) {
    text = text.replace(toReplace[i], replaceWith[i]);
  }
  return text;
}

/**
 * Runs the client based on the specified mode.
 * 
 * @param {import('../modules/client').ToDoClient} client - The Discord client object.
 * @param {import('readline').Interface} rl - The readline interface object.
 * @param {string} mode - The mode to run the client in ("prod" or "dev").
 */
function run(client, rl, mode) {
  if (mode == "dev") {
    let started = false;
    rl.on("line", (input) => {
      let args = input.split(" ");
      let command = args[0];
      if (command == "stop" && started) {
        started = false;
        client.stop();
      } else if (command == "start") {
        started = true;
        client.start(true);
        client.login(process.env["token"]);
      } else if (command === "start" && args[1] == "true" && !started) {
        started = true;
        client.start(true);
        client.login(process.env["token"]);
      } else if (command === "start" && args[1] == "false" && !started) {
        started = true;
        client.start(false);
        client.login(process.env["token"]);
      } else if (command === "delete" && started) {
        client.commands(false);
      } else if (command === "create" && started) {
        client.commands(true);
      } else {
        console.log("Invalid command.");
      }
    });
  } else if (mode == "prod") {
    client.start(true);
    client.login(process.env["prodToken"]);
  } else {
    console.log("Invalid mode.");
  }
}

module.exports = {
  isReminderTime,
  changeStatus,
  multipleReplaceForLanguage,
  run
};
