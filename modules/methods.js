const { Client, ActivityType } = require("discord.js");
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
 * @returns {Array<string, boolean>} - An array containing the current date and a boolean indicating if it matches any reminder time.
 */
async function isReminderTime(date) {
  let [today, localHour, utcMinutes] = getDate(date);
  let users = await getUsers();
  let recordatories = []
  
  for (let user of users) {
    let reminders = await getReminders(user.userID) || [];
    if (!Array.isArray(reminders) || reminders.code || reminders.error) continue;

    let dateParts = today.split("-").map(part => parseInt(part, 10));
    dateParts[1]--; // Adjust month index

    for (let reminder of reminders) {
      let timeParts = [reminder.hour, reminder.minute].map(part => parseInt(part, 10));
      if (timeParts.some(isNaN)) continue;

      let time = Date.parse(`${dateParts[0]}-${dateParts[1] + 1}-${dateParts[2]}T${timeParts[0]}:${timeParts[1]}:00Z`);
      if (time >= date.getTime()) recordatories.push(reminder);
    }
  }

  return [
    today,
    recordatories.length > 0 && recordatories.some(
      recordatory => localHour === recordatory.hour && utcMinutes === recordatory.minute
    )
  ];
}

/**
 * Changes the status of the client user based on the number of tasks.
 * @param {Client} client - The Discord client instance.
 * @param {string} guildID - The ID of the guild.
 * @returns {Promise<void>} - A promise that resolves when the status is changed.
 */
async function changeStatus(client) {
  const lang = await getLanguage();
  const tasks = await getTasksCount();

  const { language } = lang || {};
  const { defaultActivity, defaultActivityPlural, noTasksActivity } =
    language || {};

  if (!defaultActivity || !defaultActivityPlural || !noTasksActivity) {
    console.error("Invalid language data:", language);
    return;
  }

  if (tasks > 1) {
    activity = defaultActivityPlural.replace("{0}", tasks);
  } else if (tasks === 1) {
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
function createConfig(guildID) {
  request(
    {
      url: `http://localhost:3000/config/`,
      method: "POST",
      json: true,
      body: {
        guildID: guildID,
        language: "en",
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
async function getLanguageById(guildID) {
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

/**
 * Retrieves tasks from the server for a specific guild.
 * @param {string} userID - The ID of the user.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of task objects.
 */
async function getTasksByUser(userID) {
  return new Promise((resolve, reject) => {
    request(
      {
        url: `http://localhost:3000/tasks/user?id=${userID}`,
        json: true,
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

async function getTasksByGuild(guildID) {
  return new Promise((resolve, reject) => {
    request(
      {
        url: `http://localhost:3000/tasks/guild?id=${guildID}`,
        json: true,
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
 * Retrieves the count of tasks from a remote server.
 * @returns {Promise<number>} A promise that resolves to the count of tasks.
 */
async function getTasksCount() {
  return new Promise((resolve, reject) => {
    request(
      {
        url: `http://localhost:3000/tasks/count/`,
        json: true,
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
        if (!body.count) {
          resolve(0)
          return;
        }
        resolve(body.count);
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
 * @param {string} userID - The ID of the guild.
 * @param {string} task - The ID of the task to be deleted.
 * @returns {Object} - The response body containing the code and message.
 */
async function deleteTask(userID, task) {
  request(
    {
      url: `http://localhost:3000/tasks/`,
      method: "DELETE",
      json: true,
      body: {
        userID: userID,
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
 * Retrieves reminders for a given user ID.
 * @param {string} userID - The ID of the user.
 * @returns {Promise<Array>} - A promise that resolves to an array of reminders.
 */
async function getReminders(userID) {
  return new Promise((resolve, reject) => {
    request(
      {
        url: `http://localhost:3000/reminders?userID=${userID}`,
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
 * Adds a reminder for a user.
 * @param {string} userID - The ID of the user.
 * @param {string} hour - The hour of the reminder.
 * @param {string} minute - The minute of the reminder.
 * @returns {Promise<any>} - A promise that resolves with the response body.
 */
async function addReminder(userID, hour, minute) {
  request(
    {
      url: `http://localhost:3000/reminders/`,
      method: "POST",
      json: true,
      body: {
        userID: userID,
        hour: hour,
        minute: minute,
      },
    },
    (err, res, body) => {
      if (err) {
        console.error("Error:", err, body.error);
        return body;
      }
      return body;
    }
  );
}

/**
 * Deletes a reminder for a specific user.
 * @param {string} userID - The ID of the user.
 * @param {number} reminderID - The ID of the reminder to be deleted.
 * @returns {Promise<any>} - A promise that resolves with the response body if successful, or rejects with an error if unsuccessful.
 */
async function deleteReminder(userID, reminderID) {
  request(
    {
      url: `http://localhost:3000/reminders/`,
      method: "DELETE",
      json: true,
      body: {
        userID: userID,
        id: reminderID,
      },
    },
    (err, res, body) => {
      if (err) {
        console.error("Error:", err);
        return;
      }
      if (body.error) {
        console.log(body.error)
        return body;
      }
      console.log(body)
      return body;
    }
  );
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
          userID: body.userID || 'No userID provided',
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
  isReminderTime,
  changeStatus,
  getConfig,
  createConfig,
  updateConfig,
  deleteConfig,
  getLanguage,
  getLanguageById,
  getTasksByUser,
  getTasksByGuild,
  getTasksCount,
  addTask,
  deleteTask,
  updateTask,
  deleteGlobalCommand,
  getUser,
  getChannel,
  getGuilds,
  getUsers,
  getReminders,
  addReminder,
  deleteReminder
};
