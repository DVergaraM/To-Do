const { Client, CommandInteractionOptionResolver: Options } = require("discord.js");
const { Database } = require("sqlite3");

const {
  fetch,
  updateConfig,
  getLanguage,
  getTasks,
  updateTask,
  getConfig,
  deleteTask: deleteTaskAPI,
  addTask: addTaskAPI,
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

  let tasks = await getTasks(interaction.guild.id, status);

  if (status) {
    tasks = tasks.filter((t) => t.status === (status === "done"));
  }

  if (tasks.length === 0) {
    return interaction.reply(lang.language.no_tasks);
  }

  const taskList = tasks
    .map(
      (t) => {
        let dueDate = new Date(t.date + "T12:00:00Z");
        dueDate.setHours(dueDate.getHours() + 5);
        let epochTimestamp = Math.floor(dueDate.getTime() / 1000);
        return `- ${t.id}. ${t.task} | <t:${epochTimestamp}:F> - ${t.status ? lang.language.done : lang.language.pending}`;
      }
    )
    .join("\n");

  const message = status
    ? lang.language.list_status
      .replace("{0}", tasks.length)
      .replace(
        "{1}",
        status === "done" ? lang.language.done : lang.language.pending
      )
      .replace("{2}", taskList)
    : taskList;

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
  await deleteTaskAPI(interaction.guild.id, taskDelete);
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
  let lang = await getLanguage(interaction.guild.id);

  switch (command) {
    case "get":
      try {
        let config = await getConfig(interaction.guild.id);
        let message = lang.language.getConfig
          .replace("{0}", config.channel)
          .replace("{1}", config.user)
          .replace("{2}", config.language);
        interaction.reply(message);
      } catch (e) {
        console.error(e);
        interaction.reply(lang.language.configError);
      }
      break;

    case "set":
      let channel = options.getChannel("channel") ? options.getChannel("channel").id : "";
      let user = options.getUser("user") ? options.getUser("user").id : "";
      let language = options.getString("language") ? options.getString("language") : "";

      if (channel || user || language) {
        updateConfig(interaction.guild.id, channel, user, language);
        interaction.reply(lang.language.saved)
      } else {
        interaction.reply(lang.language.saveError);
      }
      break;

    case "reset":
      updateConfig(interaction.guild.id, "", "", "en");
      break;
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
  config,
};
