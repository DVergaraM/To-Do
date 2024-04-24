const request = require("request");
;

/**
 * Retrieves tasks from the server for a specific guild.
 * @param {string} userID - The ID of the user.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of task objects.
 */
async function getTasksByUser(userID) {
  let url = `https://to-do-api-pqi0.onrender.com/tasks/user`;
  if (userID == "") {
    console.log("Invalid user ID");
    return [];
  }
  url += `?id=${userID}`;
  return new Promise((resolve, reject) => {
    request(
      {
        url: url,
        json: true,
      },
      (err, _res, body) => {
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
 * Retrieves tasks by guild ID.
 * @param {string} guildID - The ID of the guild.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of task objects.
 */
async function getTasksByGuild(guildID) {
  let url = `https://to-do-api-pqi0.onrender.com/tasks/guild?id=${guildID}`;
  return new Promise((resolve, reject) => {
    request(
      {
        url: url,
        json: true,
      },
      (err, _res, body) => {
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
        url: `https://to-do-api-pqi0.onrender.com/tasks/count/`,
        json: true,
      },
      (err, _res, body) => {
        if (err) {
          console.error("Error:", err);
          reject({
            code: 500,
            error: err,
          });
          return;
        }
        if (!body.count) {
          resolve(0);
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
      url: `https://to-do-api-pqi0.onrender.com/tasks/`,
      method: "POST",
      json: true,
      body: {
        guildID: guildID,
        userID: userID,
        task: task,
        date: date,
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

/**
 * Deletes a task from the server.
 * @param {string} userID - The ID of the guild.
 * @param {string} task - The ID of the task to be deleted.
 * @returns {Object} - The response body containing the code and message.
 */
async function deleteTaskByUser(userID, task) {
  request(
    {
      url: `https://to-do-api-pqi0.onrender.com/tasks/`,
      method: "DELETE",
      json: true,
      body: {
        userID: userID,
        id: task,
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

/**
 * Deletes a task with the specified task ID.
 * @param {string} taskID - The ID of the task to delete.
 * @returns {Promise<any>} - A promise that resolves with the response body if successful, or rejects with an error if unsuccessful.
 */
async function deleteTask(taskID) {
  return new Promise((resolve, reject) => {
    if (!taskID) {
      reject({
        code: 400,
        error: "Invalid task ID",
      });
      return;
    }
    request(
      {
        url: `https://to-do-api-pqi0.onrender.com/tasks/`,
        method: "DELETE",
        json: true,
        body: {
          id: taskID,
        },
      },
      (err, _res, body) => {
        if (err) {
          console.error("Error:", err);
          return;
        }
        resolve(body);
      }
    );
  });
}


/**
 * Updates a task with the given task ID and sets its status to the specified value.
 * @param {string} userID - The ID of the user who owns the task.
 * @param {string} taskID - The ID of the task to be updated.
 * @param {boolean} done - The status to set for the task (true for done, false for not done).
 * @returns {Promise<any>} - A promise that resolves with the updated task object.
 */
async function updateTask(userID, taskID, done) {
  request(
    {
      url: `https://to-do-api-pqi0.onrender.com/tasks/${taskID}`,
      method: "PATCH",
      json: true,
      body: {
        status: done,
        userID: userID,
      },
    },
    (err, _res, body) => {
      if (err) {
        console.error("Error:", err);
        return;
      }
      return body;
    }
  );
}

module.exports = {
  getTasksByUser,
  getTasksByGuild,
  getTasksCount,
  addTask,
  deleteTaskByUser,
  deleteTask,
  updateTask,
};
