const axios = require("axios");

/**
 * Retrieves reminders for a given user ID.
 * @param {string} userID - The ID of the user.
 * @returns {Promise<Array>} - A promise that resolves to an array of reminders.
 */
async function getReminders(userID) {
  let url = `https://to-do-api-pqi0.onrender.com/reminders`;
  if (userID !== "") {
    url += `?userID=${userID}`;
  }
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

/**
 * Adds a reminder for a user.
 * @param {string} userID - The ID of the user.
 * @param {string} hour - The hour of the reminder.
 * @param {string} minute - The minute of the reminder.
 * @returns {Promise<any>} - A promise that resolves with the response body.
 */
async function addReminder(userID, hour, minute) {
  try {
    const response = await axios.post(`https://to-do-api-pqi0.onrender.com/reminders/`, {
      userID,
      hour,
      minute,
    });
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

/**
 * Deletes a reminder for a specific user.
 * @param {string} userID - The ID of the user.
 * @param {number} reminderID - The ID of the reminder to be deleted.
 * @returns {Promise<any>} - A promise that resolves with the response body if successful, or rejects with an error if unsuccessful.
 */
async function deleteReminder(userID, reminderID) {
  try {
    const response = await axios.delete(`https://to-do-api-pqi0.onrender.com/reminders/`, {
      data: {
        userID,
        id: reminderID,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

module.exports = {
  getReminders,
  addReminder,
  deleteReminder,
};