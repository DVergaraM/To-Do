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


class Commands {
  /**
   * Creates a new instance of the Commands class.
   * @param {Client} client - The Discord client instance.
   */
  constructor(client) {
    this.client = client;
  }

  /**
   * Adds a task to the to-do list.
   *
   * @param {import("discord.js").Interaction} interaction - The interaction object representing the command interaction.
   * @param {Options} options - The options object containing the task and due date.
   * @returns {Promise<void>} - A promise that resolves once the task is added.
   */
  async addTask(interaction, options) {
    let due_date = options.getString("fecha");
    let task = options.getString("tarea");
    let lang = await getLanguage(interaction.guild.id);
    const { language } = lang || {};
    addTaskAPI(interaction.user.id, interaction.guild.id, task, due_date);
    let message = language["add"].replace("{0}", task).replace("{1}", due_date);
    interaction.reply(message);
  }

  /**
   * Lists tasks based on the provided status.
   *
   * @param {import("discord.js").Interaction} interaction - The interaction object.
   * @param {Options} options - The options object.
   * @returns {Promise<void>} - A promise that resolves when the tasks are listed.
   */
  async listTasks(interaction, options) {
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
   * Responds with the current WebSocket ping in milliseconds.
   * @param {import("discord.js").Interaction} interaction - The interaction object representing the command interaction.
   * @param {Options} _ - Additional parameters (not used in this method).
   * @returns {Promise<void>} - A promise that resolves when the reply is sent.
   */

  ping = async (interaction, _) => {
    interaction.reply(this.client.ws.ping + "ms", { ephemeral: true });
  }

  /**
   * Sends a help message containing a list of available commands.
   * @param {import("discord.js").Interaction} interaction - The interaction object representing the command interaction.
   * @param {Options} _ - Additional parameters (not used in this function).
   * @returns {Promise<void>} - A promise that resolves when the help message is sent.
   */
  help = async (interaction, _) => {
    let lang = await getLanguage(interaction.guild.id);
    this.client.application.commands.fetch().then((commands) => {
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
   * Deletes a task based on the provided ID.
   *
   * @param {import("discord.js").Interaction} interaction - The interaction object representing the command interaction.
   * @param {Options} options - The options object containing the task ID.
   * @returns {Promise<void>} - A promise that resolves once the task is deleted.
   */
  async deleteTask(interaction, options) {
    let taskDelete = parseInt(options.getString("id"));
    let lang = await getLanguage(interaction.guild.id);
    await deleteTaskAPI(interaction.user.id, taskDelete);
    let message = lang.language.deleteTask.replace("{0}", taskDelete);
    interaction.reply(message);
  }

  /**
   * Sets a task as done.
   * @param {import("discord.js").Interaction} interaction - The interaction object.
   * @param {Options} options - The options object.
   * @returns {Promise<void>} - A promise that resolves when the task is set as done.
   */
  async setDone(interaction, options) {
    let taskId = parseInt(options.getString("id"));
    await updateTask(interaction.user.id, taskId, "true");
    let lang = await getLanguage(interaction.guild.id);
    let message = lang.language.setDone.replace("{0}", taskId);
    interaction.reply(message);
  }

  /**
   * Sets a task as undone.
   *
   * @param {import("discord.js").Interaction} interaction - The interaction object representing the command interaction.
   * @param {Options} options - The options object containing the task ID.
   * @returns {Promise<void>} - A promise that resolves when the task is set as undone.
   */
  async setUndone(interaction, options) {
    let taskId = parseInt(options.getString("id"));
    let lang = await getLanguage(interaction.guild.id);
    await updateTask(taskId, "false");
    let message = lang.language.setUndone.replace("{0}", taskId);
    interaction.reply(message);
  }

  /**
   * Handles the configuration command.
   *
   * @param {import("discord.js").Interaction} interaction - The interaction object.
   * @param {Options} options - The options object.
   * @returns {Promise<void>} - A promise that resolves when the configuration is handled.
   */
  async config(interaction, options) {
    let command = options.getSubcommand();
    let lang = await getLanguageById(interaction.guild.id);

    switch (command) {
      case "get":
        try {
          let config = await getConfig(interaction.guild.id);
          let user = interaction.guild.members.cache.get(config.userID);
          if (!user) user = await interaction.guild.members.fetch(config.userID);
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
        let user = options.getUser("user")
          ? options.getUser("user").id
          : "";
        let language = options.getString("language")
          ? options.getString("language")
          : "";

        if (channel || user || language) {
          await updateConfig(interaction.guild.id, channel, user, language);
          interaction.reply(lang.language.saved);
        } else interaction.reply(lang.language.saveError);

        break;

      case "reset":
        updateConfig(interaction.guild.id, "", "", "en");
        break;
    }
  }

  /**
   * Retrieves reminders for a specific user.
   * @param {string} userID - The ID of the user.
   * @returns {Promise<Array>} - A promise that resolves to an array of reminders.
   */
  async getRemindersByUser(userID) {
    let reminders = await getReminders(userID);
    return reminders;
  }


  /**
   * Handles the reminder command.
   *
   * @param {import("discord.js").Interaction} interaction - The interaction object.
   * @param {Options} options - The options for the command.
   * @returns {Promise<void>} - A promise that resolves when the reminder command is handled.
   */
  reminder = async (interaction, options) => {
    let command = options.getSubcommand();
    let lang = await getLanguage(interaction.guild.id);

    switch (command) {
      case "list":
        let reminders = await this.getRemindersByUser(interaction.user.id);
        let reminderList = reminders
          .map((r) => {
            return `- ${r.reminderID}. ${r.hour}:${r.minute}`;
          })
          .join("\n");
        if (reminders.length === 0) {
          interaction.reply(lang.language.noReminders, {});
          return;
        }
        let messageList = lang.language.reminderList.replace("{0}", reminderList);
        interaction.reply(messageList, {});
        break;
      case "add":
        let time = options.getString("time");
        let [hour, minute] = time.split(":");
        let rValue = await addReminder(interaction.user.id, hour, minute);
        console.log(rValue)
        if (rValue["error"]) {
          interaction.reply(lang.language.reminderError, {});
          return;
        }
        interaction.reply(lang.language.addReminder, {});
        break;
      case "delete":
        let reminderID = options.getString("id");
        let reValue = await deleteReminder(interaction.user.id, reminderID);
        console.log(reValue)
        if (reValue["error"]) {
          interaction.reply(reValue["error"], {});
        } else {
          interaction.reply(lang.language.removeReminder, {});
        }
        break;
      default:
        interaction.reply(lang.language.reminderCommands, {});
    }
  }
}

module.exports = Commands;
