const {
  Client,
  CommandInteractionOptionResolver: Options,
} = require("discord.js");

const {
  updateConfig,
  getLanguage,
  getLanguageById,
  updateTask,
  getConfig,
  deleteTask: deleteTaskAPI,
  addTask: addTaskAPI,
  getTasksByGuild,
  getReminders,
  addReminder,
  deleteReminder,
} = require("./methods");

/**
 * Adds a task to the database and sends a reply message.
 * @param {Client} _ - Placeholder for the command context.
 * @param {import('discord.js').Interaction} interaction - The interaction object representing the command interaction.
 * @param {Options} options - The options object containing the task and due date.
 */
async function addTask(_, interaction, options) {
  let due_date = options.getString("fecha");
  let task = options.getString("tarea");
  let lang = await getLanguage(interaction.guild.id);
  const { language } = lang || {};
  addTaskAPI(interaction.user.id, interaction.guild.id, task, due_date);
  let message = language["add"].replace("{0}", task).replace("{1}", due_date);
  interaction.reply(message);
}

/**
 * Retrieves and lists tasks based on the specified status.
 *
 * @param {Client} _ - Placeholder for the first parameter.
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @param {Options} options - The options object.
 * @returns {Promise<void>}
 */
async function listTasks(_, interaction, options) {
  const status = options.getString("status");
  const lang = await getLanguage(interaction.guild.id);

  if (!lang?.language?.list_status) {
    console.error("Invalid language data:", lang?.language);
    return;
  }

  let tasks = await getTasksByGuild(interaction.guild.id, status);

  if (status) {
    tasks = tasks.filter((t) => t.status === (status === "done"));
  }

  if (tasks.length === 0) {
    return interaction.reply(lang.language.no_tasks);
  }

  const taskList = tasks
    .map((t) => {
      let dueDate = new Date(t.date + "T12:00:00Z");
      dueDate.setHours(dueDate.getHours() + 5);
      let epochTimestamp = Math.floor(dueDate.getTime() / 1000);
      return `- ${t.id}. ${t.task} | <t:${epochTimestamp}:F> - **${t.status ? lang.language.done : lang.language.pending
        }**`;
    })
    .join("\n");
  let rStatus = status === "done" ? lang.language.done : lang.language.pending;
  const message = status
    ? lang.language.list_status
      .replace("{0}", tasks.length)
      .replace("{1}", rStatus)
      .replace("{2}", taskList)
    : lang.language.list.replace("{0}", taskList);

  interaction.reply({ content: message });
}
/**
 * Retrieves and lists tasks based on the specified status.
 *
 * @param {Client} client - Placeholder for the first parameter.
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @param {Options} _ - The options object.
 * @returns {void}
 */
function ping(client, interaction, _) {
  interaction.reply(client.ws.ping + "ms", { ephemeral: true });
}

/**
 * Retrieves and lists tasks based on the specified status.
 *
 * @param {Client} client - Placeholder for the first parameter.
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @param {Options} _ - The options object.
 * @returns {Promise<void>}
 */
async function help(client, interaction, _) {
  let lang = await getLanguage(interaction.guild.id);
  client.application.commands.fetch().then((commands) => {
    const commandList = commands
      .map((c) => {
        return `/${c.name} - ${c.description}`;
      })
      .join("\n");
    let message = lang.language.help.replace("{0}", commandList);
    interaction.reply(message);
  });
}

/**
 * Retrieves and lists tasks based on the specified status.
 *
 * @param {Client} _ - Placeholder for the first parameter.
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @param {Options} options - The options object.
 * @returns {Promise<void>}
 */
async function deleteTask(_, interaction, options) {
  let taskDelete = parseInt(options.getString("id"));
  let lang = await getLanguage(interaction.guild.id);
  await deleteTaskAPI(interaction.user.id, taskDelete);
  let message = lang.language.deleteTask.replace("{0}", taskDelete);
  interaction.reply(message);
}

/**
 * Retrieves and lists tasks based on the specified status.
 *
 * @param {Client} _ - Placeholder for the first parameter.
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @param {Options} options - The options object.
 * @returns {Promise<void>}
 */
async function setDone(_, interaction, options) {
  let taskId = parseInt(options.getString("id"));
  await updateTask(taskId, "true");
  let lang = await getLanguage(interaction.guild.id);
  let message = lang.language.setDone.replace("{0}", taskId);
  interaction.reply(message);
}

/**
 * Retrieves and lists tasks based on the specified status.
 *
 * @param {Client} _ - Placeholder for the first parameter.
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @param {Options} options - The options object.
 * @returns {Promise<void>}
 */
async function setUndone(_, interaction, options) {
  let taskId = parseInt(options.getString("id"));
  let lang = await getLanguage(interaction.guild.id);
  await updateTask(taskId, "false");
  let message = lang.language.setUndone.replace("{0}", taskId);
  interaction.reply(message);
}

/**
 * Handles the configuration command.
 *
 * @param {Client} _ - Placeholder for the first parameter.
 * @param {import("discord.js").Interaction} interaction - The interaction object.
 * @param {Options} options - The options object.
 * @returns {Promise<void>} - A promise that resolves when the configuration is handled.
 */
async function config(_, interaction, options) {
  let command = options.getSubcommand();
  let lang = await getLanguageById(interaction.guild.id);

  switch (command) {
    case "get":
      try {
        let config = await getConfig(interaction.guild.id);
        let user = interaction.guild.members.cache.get(config.userID);
        if (!user) {
          user = await interaction.guild.members.fetch(config.userID);
        }
        let response = lang.language.getConfig
          .replace("{0}", `<#${config.channelID}>`)
          .replace("{1}", user.user.tag)
          .replace("{2}", config.language);
        interaction.reply(response);
      } catch (e) {
        console.error(e);
        interaction.reply(lang.language.configError);
      }
      break;

    case "set":
      let channel = options.getChannel("channel")
        ? options.getChannel("channel").id
        : "";
      let user = options.getUser("user") ? options.getUser("user").id : "";
      let language = options.getString("language")
        ? options.getString("language")
        : "";

      if (channel || user || language) {
        await updateConfig(interaction.guild.id, channel, user, language);
        interaction.reply(lang.language.saved);
      } else {
        interaction.reply(lang.language.saveError);
      }
      break;

    case "reset":
      updateConfig(interaction.guild.id, "", "", "en");
      break;
  }
}

async function getRemindersByUser(userID) {
  let reminders = await getReminders(userID);
  return reminders;
}

/**
 * Handles the reminder command.
 *
 * @param {Client} _ - Placeholder for the first parameter.
 * @param {import("discord.js").Interaction} interaction - The interaction object.
 * @param {Options} options - The options object.
 * @returns {Promise<void>} A promise that resolves when the reminder command is handled.
 */
async function reminder(_, interaction, options) {
  let command = options.getSubcommand();
  let lang = await getLanguage(interaction.guild.id);

  switch (command) {
    case "list":
      let reminders = await getRemindersByUser(interaction.user.id);
      let reminderList = reminders
        .map((r) => {
          return `- ${r.reminderID}. ${r.hour}:${r.minute}`;
        })
        .join("\n");

      let messageList = lang.language.reminderList.replace("{0}", reminderList);
      interaction.reply(messageList);
      break;
    case "add":
      let time = options.getString("time");
      let [hour, minute] = time.split(":");
      let rValue = await addReminder(interaction.user.id, hour, minute);
      if (rValue.error) {
        interaction.reply(lang.language.reminderError);
        return;
      }
      interaction.reply(lang.language.addReminder);
      break;
    case "delete":
      let reminderID = parseInt(options.getString("id"));
      let reValue = await deleteReminder(interaction.user.id, reminderID);
      if (reValue.error) {
        interaction.reply(lang.language.reminderError);
        return;
      }
      interaction.reply(lang.language.removeReminder);
      break;
    default:
      interaction.reply(lang.language.reminderCommands);
  }
}

module.exports = {
  addTask,
  listTasks,
  ping,
  help,
  deleteTask,
  setDone,
  setUndone,
  reminder,
  config,
};
