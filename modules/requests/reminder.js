const request = require("request");

/**
 * Retrieves reminders for a given user ID.
 * @param {string} userID - The ID of the user.
 * @returns {Promise<Array>} - A promise that resolves to an array of reminders.
 */
async function getReminders(userID) {
  return new Promise((resolve, reject) => {
    let url = `http://localhost:3000/reminders`;
    if (userID != "") {
      url += `?userID=${userID}`;
    }
    request(
      {
        url: url,
        method: "GET",
        json: true,
      },
      (err, _res, body) => {
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
  return new Promise((resolve, reject) => {
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
      (err, _res, body) => {
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
 * Deletes a reminder for a specific user.
 * @param {string} userID - The ID of the user.
 * @param {number} reminderID - The ID of the reminder to be deleted.
 * @returns {Promise<any>} - A promise that resolves with the response body if successful, or rejects with an error if unsuccessful.
 */
async function deleteReminder(userID, reminderID) {
  return new Promise((resolve, reject) => {
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
      (err, _res, body) => {
        if (err) {
          console.error("Error:", err);
          reject(err);
          return;
        }
        if (body.error) {
          resolve(body);
        }
        resolve(body);
      }
    );
  });
}

module.exports = {
  getReminders,
  addReminder,
  deleteReminder,
};
