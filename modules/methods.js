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
 * @returns {Array<string, boolean>} - An array containing the current date and a boolean indicating if it matches any reminder time.
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
 * Changes the status of the client user based on the number of tasks.
 * @param {Client} client - The Discord client instance.
 * @param {string} guildID - The ID of the guild.
 * @returns {Promise<void>} - A promise that resolves when the status is changed.
 */
async function changeStatus(client, guildID) {
  const lang = await getLanguage(guildID);
  const tasks = await getTasks(guildID);

  const { language } = lang || {};
  const { defaultActivity, defaultActivityPlural, noTasksActivity } =
    language || {};

  if (!defaultActivity || !defaultActivityPlural || !noTasksActivity) {
    console.error("Invalid language data:", language);
    return;
  }

  // Filtrar las tareas pendientes
  const pendingTasks = Array.isArray(tasks) ? tasks.filter(task => task.status === false) : [];

  const taskCount = pendingTasks.length;

  let activity;
  if (taskCount > 1) {
    activity = defaultActivityPlural.replace("{0}", taskCount);
  } else if (taskCount === 1) {
    activity = defaultActivity;
  } else {
    activity = noTasksActivity;
  }
  client.user.setActivity(activity, { type: ActivityType.Watching });
}

/**
 * Retrieves the configuration for a guild.
 * @param {string} guildID - The ID of the guild.
 * @returns {Promise<Map<string, any>>} - A promise that resolves with the guild configuration.
 */
async function getConfig(guildID) {
  return new Promise((resolve, reject) => {
    request(
      {
        url: `http://localhost:3000/config/`,
        json: true,
        body: {
          guildID: guildID,
        },
      },
      (err, res, body) => {
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
  request(
    {
      url: `http://localhost:3000/config/`,
      method: "PATCH",
      json: true,
      body: {
        guildID: guildID,
        channelID: channelID,
        userID: userID,
        language: language,
      },
    },
    (err, res, body) => {
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
      url: `http://localhost:3000/config/`,
      method: "DELETE",
      json: true,
      body: {
        guildID: guildID,
      },
    },
    (err, res, body) => {
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
function createConfig(guildID, channelID, userID, language) {
  request(
    {
      url: `http://localhost:3000/config/`,
      method: "POST",
      json: true,
      body: {
        guildID: guildID,
        channelID: channelID,
        userID: userID,
        language: language,
      },
    },
    (err, res, body) => {
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
 * Retrieves the language for a given guild ID.
 * @param {string} guildID - The ID of the guild.
 * @returns {Promise} - An object containing the code, guildID, and language.
 */
async function getLanguage(guildID) {
  return new Promise((resolve, reject) => {
    request(
      {
        url: `http://localhost:3000/language/`,
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
 * Retrieves tasks from the server for a specific guild.
 * @param {string} guildID - The ID of the guild.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of task objects.
 */
async function getTasks(guildID) {
  return new Promise((resolve, reject) => {
    request(
      {
        url: `http://localhost:3000/tasks/`,
        json: true,
        body: {
          guildID: guildID,
        },
      },
      (err, res, body) => {
        if (err) {
          console.error("Error:", err);
          reject({
            code: 500,
            error: err,
          });
          return;
        }
        if (!body || !Array.isArray(body.data)) {
          resolve([]);
          return;
        }
        let newBody = body.data.map((task) => ({
          id: task.id,
          task: task.task,
          date: task.date,
          guildID: task.guildID,
          userID: task.userID,
          status: task.status,
        }));
        resolve(newBody);
      }
    );
  });
}

/**
 * Adds a task to the server.
 * @param {string} userID - The ID of the user.
 * @param {string} guildID - The ID of the guild.
 * @param {string} task - The task to be added.
 * @param {string} date - The date of the task.
 * @returns {Object} - The response body containing the code and message.
 */
function addTask(userID, guildID, task, date) {
  request(
    {
      url: `http://localhost:3000/tasks/`,
      method: "POST",
      json: true,
      body: {
        guildID: guildID,
        userID: userID,
        task: task,
        date: date,
      },
    },
    (err, res, body) => {
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
 * Deletes a task from the server.
 * @param {string} guildID - The ID of the guild.
 * @param {string} task - The ID of the task to be deleted.
 * @returns {Object} - The response body containing the code and message.
 */
async function deleteTask(guildID, task) {
  request(
    {
      url: `http://localhost:3000/tasks/`,
      method: "DELETE",
      json: true,
      body: {
        guildID: guildID,
        id: task,
      },
    },
    (err, res, body) => {
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
 * Updates the status of a task.
 * @param {string} taskID - The ID of the task to update.
 * @param {boolean} done - The new status of the task.
 * @returns {Promise<any>} - A promise that resolves with the updated task.
 */
async function updateTask(taskID, done) {
  request(
    {
      url: `http://localhost:3000/tasks/${taskID}`,
      method: "PATCH",
      json: true,
      body: {
        status: done,
      },
    },
    (err, res, body) => {
      if (err) {
        console.error("Error:", err);
        return;
      }
      return body;
    }
  );
}

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
        if (!body || !body.guildID || !body.userID) {
          console.error("Invalid user data:", body);
          reject(new Error("Invalid user data"));
          return;
        }
        let newBody = {
          code: 200,
          guildID: body.guildID,
          userID: body.userID,
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

module.exports = {
  isReminderTime,
  changeStatus,
  getConfig,
  createConfig,
  updateConfig,
  deleteConfig,
  getLanguage,
  getTasks,
  addTask,
  deleteTask,
  updateTask,
  deleteGlobalCommand,
  getUser,
  getChannel,
};
