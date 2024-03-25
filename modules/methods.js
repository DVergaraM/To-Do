const { Client, ActivityType } = require("discord.js");
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
 * @returns {Array<string, boolean>} - An array containing the current date and a boolean indicating if it matches any reminder time.
 */
async function isReminderTime(date) {
  const [today] = getDate(date);
  const users = await getUsers();
  const currentHour = convertUTCtoLocal(date.getUTCHours());
  const currentMinute = addZerosToMinutes(date.getUTCMinutes());

  const recordatories = [];

  for (const user of users) {
    const reminders = (await getReminders(user.userID)) || [];
    if (!Array.isArray(reminders) || reminders.code || reminders.error)
      continue;

    for (const reminder of reminders) {
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
    (reminderHour === currentHour + 1 && reminderMinute === currentMinute - 59)
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
    console.error("Invalid language data:", language);
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

module.exports = {
  isReminderTime,
  changeStatus,
};
