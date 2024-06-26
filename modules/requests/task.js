const axios = require("axios");
/**
 * Retrieves tasks from the server for a specific guild.
 * @param {string} userID - The ID of the user.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of task objects.
 */
async function getTasksByUser(userID) {
  if (userID === "") {
    console.log("Invalid user ID");
    return [];
  }
  const url = `https://to-do-api-pqi0.onrender.com/tasks/user?id=${userID}`;
  try {
    const response = await axios.get(url);
    const tasks = response.data.data.map((task) => ({
      id: task.id,
      task: task.task,
      date: task.date,
      guildID: task.guildID,
      userID: task.userID,
      status: task.status,
    }));
    return tasks;
  } catch (error) {
    console.error("Error:", error);
    throw {
      code: 500,
      error: error,
    };
  }
}

/**
 * Retrieves tasks by guild ID.
 * @param {string} guildID - The ID of the guild.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of task objects.
 */
async function getTasksByGuild(guildID) {
  const url = `https://to-do-api-pqi0.onrender.com/tasks/guild?id=${guildID}`;
  try {
    const response = await axios.get(url);
    const tasks = response.data.data.map((task) => ({
      id: task.id,
      task: task.task,
      date: task.date,
      guildID: task.guildID,
      userID: task.userID,
      status: task.status,
    }));
    return tasks;
  } catch (error) {
    console.error("Error:", error);
    throw {
      code: 500,
      error: error,
    };
  }
}

/**
 * Retrieves the count of tasks from a remote server.
 * @returns {Promise<number>} A promise that resolves to the count of tasks.
 */
async function getTasksCount() {
  try {
    const response = await axios.get(
      `https://to-do-api-pqi0.onrender.com/tasks/count/`
    );
    return response.data.count;
  } catch (error) {
    console.error("Error:", error);
    throw {
      code: 500,
      error: error,
    };
  }
}

/**
 * Adds a task to the server.
 * @param {string} userID - The ID of the user.
 * @param {string} guildID - The ID of the guild.
 * @param {string} task - The task to be added.
 * @param {string} date - The date of the task.
 * @returns {Object} - The response body containing the code and message.
 */
async function addTask(userID, guildID, task, date) {
  try {
    const response = await axios.post(
      `https://to-do-api-pqi0.onrender.com/tasks/`,
      {
        guildID,
        userID,
        task,
        date,
      }
    );
    return {
      code: response.data.code,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

/**
 * Deletes a task from the server.
 * @param {string} userID - The ID of the guild.
 * @param {string} task - The ID of the task to be deleted.
 * @returns {Object} - The response body containing the code and message.
 */
async function deleteTaskByUser(userID, task) {
  try {
    const response = await axios.delete(
      `https://to-do-api-pqi0.onrender.com/tasks/`,
      {
        data: {
          userID,
          id: task,
        },
      }
    );
    return {
      code: response.data.code,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

/**
 * Deletes a task with the specified task ID.
 * @param {string} taskID - The ID of the task to delete.
 * @returns {Promise<any>} - A promise that resolves with the response body if successful, or rejects with an error if unsuccessful.
 */
async function deleteTask(taskID) {
  if (!taskID) {
    throw {
      code: 400,
      error: "Invalid task ID",
    };
  }
  try {
    const response = await axios.delete(
      `https://to-do-api-pqi0.onrender.com/tasks/`,
      {
        data: {
          id: taskID,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
/**
 * Updates a task with the given task ID and sets its status to the specified value.
 * @param {string} userID - The ID of the user who owns the task.
 * @param {string} taskID - The ID of the task to be updated.
 * @param {boolean} done - The status to set for the task (true for done, false for not done).
 * @returns {Promise<any>} - A promise that resolves with the updated task object.
 */
async function updateTask(userID, taskID, done) {
  try {
    const response = await axios.put(
      `https://to-do-api-pqi0.onrender.com/tasks/${taskID}`,
      {
        status: done,
        userID,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
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
