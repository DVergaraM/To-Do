const {
  Client,
  CommandInteractionOptionResolver: Options,
  EmbedBuilder,
} = require("discord.js");

const { getLanguageById } = require("./requests/language");
const {
  addTask: addTaskAPI,
  deleteTaskByUser: deleteTaskAPI,
  updateTask,
  getTasksByUser,
} = require("./requests/task");
const { getConfig, updateConfig } = require("./requests/config");
const {
  getReminders,
  addReminder,
  deleteReminder,
} = require("./requests/reminder");

const { multipleReplaceForLanguage } = require("./methods");

class Commands {
  /**
   * Creates a new instance of the Commands class.
   * @param {Client} client - The Discord client instance.
   */
  constructor(client) {
    this.client = client;
  }

  /**
   * Returns a string representing the Commands class instance.
   * @returns {string} A string representing the Commands class instance.
   */
  string() {
    return `Commands class instance for ${this.client.user.tag}`;
  }

  /**
   * Returns a string representation of the Commands object.
   * @returns {string} The string representation of the Commands object.
   */
  repr() {
    return `Commands(${this.client.user.tag})`;
  }

  /**
   * Adds a task to the to-do list.
   *
   * @param {import("discord.js").Interaction} interaction - The interaction object representing the command interaction.
   * @param {Options} options - The options object containing the task and due date.
   * @returns {Promise<void>} - A promise that resolves once the task is added.
   */
  async addTask(interaction, options) {
    await interaction.deferReply();
    let due_date = options.getString("date");
    let task = options.getString("task");
    console.log(`Running addTask(${task}, ${due_date})`);
    let lang = await getLanguageById(interaction.guild.id);
    const { language } = lang || {};
    await addTaskAPI(interaction.user.id, interaction.guild.id, task, due_date);
    let message = multipleReplaceForLanguage(
      ["{0}", "{1}"],
      [task, due_date],
      language["add"],
      this.client
    );
    await interaction.editReply(message, {});
    console.log(`Task added: ${task}`);
    return;
  }

  /**
   * Lists tasks based on the provided status.
   *
   * @param {import("discord.js").Interaction} interaction - The interaction object.
   * @param {Options} options - The options object.
   * @returns {Promise<void>} - A promise that resolves when the tasks are listed.
   */
  async listTasks(interaction, options) {
    await interaction.deferReply();
    const status = options.getString("status");
    console.log(`Running listTasks(${status})`);
    const lang = await getLanguageById(interaction.guild.id);
    let embed = new EmbedBuilder();
    embed.setTitle("Commands");

    if (!lang?.language?.list_status) {
      embed.setColor("Red");
      embed.setDescription(
        `Invalid language data: ${lang?.language}\nIn guild: ${interaction.guild.name}(ID: ${interaction.guild.id})`
      );
      await this.client.channels.cache
        .get("1230190057684734124")
        .send({ embeds: [embed] });
      console.error("Invalid language data:", lang?.language);
      await interaction.editReply({ content: "Invalid language data." });
      return;
    }
    let tasks = await getTasksByUser(interaction.user.id);
    if (status) {
      tasks = tasks.filter((t) => t.status === (status === "done"));
    }

    if (tasks.length === 0) {
      embed.setColor("Red");
      embed.setDescription(
        `No tasks found for user ${interaction.user.globalName}(ID: ${interaction.user.id}) in guild ${interaction.guild.name}(ID: ${interaction.guild.id})`
      );
      await interaction.client.channels.cache
        .get("1230190057684734124")
        .send({ embeds: [embed] });
      await interaction.editReply({ content: lang.language.no_tasks });
      return;
    }

    const taskList = tasks
      .map((t) => {
        let dueDate = new Date(t.date + "T12:00:00Z");
        dueDate.setHours(dueDate.getHours() + 5);
        let epochTimestamp = Math.floor(dueDate.getTime() / 1000);
        return `- ${t.id}. ${t.task} | <t:${epochTimestamp}:F> - **${
          t.status ? lang.language.done : lang.language.pending
        }**`;
      })
      .join("\n");
    let rStatus =
      status === "done" ? lang.language.done : lang.language.pending;
    let mess = multipleReplaceForLanguage(
      ["{0}", "{1}", "{2}"],
      [tasks.length, rStatus, taskList],
      lang.language.list_status,
      this.client
    );
    const message = status ? mess : lang.language.list.replace("{0}", taskList);

    await interaction.editReply({ content: message });
    console.log(`Tasks listed`);
    return;
  }

  /**
   * Responds with the current WebSocket ping in milliseconds.
   * @param {import("discord.js").Interaction} interaction - The interaction object representing the command interaction.
   * @param {Options} _ - Additional parameters (not used in this method).
   * @returns {Promise<void>} - A promise that resolves when the reply is sent.
   */

  ping = async (interaction, _) => {
    await interaction.deferReply();
    await interaction.editReply(this.client.ws.ping + "ms", { ephemeral: true });
    console.log(`Ping: ${this.client.ws.ping}ms`);
    return;
  };

  /**
   * Sends a help message containing a list of available commands.
   * @param {import("discord.js").Interaction} interaction - The interaction object representing the command interaction.
   * @param {Options} _ - Additional parameters (not used in this function).
   * @returns {Promise<void>} - A promise that resolves when the help message is sent.
   */
  help = async (interaction, _) => {
    await interaction.deferReply();
    let embed = new EmbedBuilder();
    embed.setTitle("Commands");
    embed.setColor("Green");

    let commands = await this.client.application.commands.fetch();
    commands.forEach((command) => {
      embed.addFields({
        name: command.name,
        value: command.description,
      });
    });
    await interaction.editReply({ embeds: [embed], ephemeral: false });
    console.log(`Help message sent`);
  };

  /**
   * Deletes a task based on the provided ID.
   *
   * @param {import("discord.js").Interaction} interaction - The interaction object representing the command interaction.
   * @param {Options} options - The options object containing the task ID.
   * @returns {Promise<void>} - A promise that resolves once the task is deleted.
   */
  async deleteTask(interaction, options) {
    await interaction.deferReply();
    let taskDelete = parseInt(options.getString("id"));
    console.log(`Running deleteTask(${taskDelete})`);
    let lang = await getLanguageById(interaction.guild.id);
    await deleteTaskAPI(interaction.user.id, taskDelete);
    let message = lang.language.deleteTask.replace("{0}", taskDelete);
    await interaction.editReply(message, {});
    console.log(`Task deleted: ${taskDelete}`);
    return;
  }

  /**
   * Sets a task as done.
   * @param {import("discord.js").Interaction} interaction - The interaction object.
   * @param {Options} options - The options object.
   * @returns {Promise<void>} - A promise that resolves when the task is set as done.
   */
  async setDone(interaction, options) {
    await interaction.deferReply();
    let taskId = parseInt(options.getString("id"));
    console.log(`Running setDone(${taskId})`);
    let lang = await getLanguageById(interaction.guild.id);
    await updateTask(interaction.user.id, taskId, "true");
    let message = lang.language.setDone.replace("{0}", taskId);
    await interaction.editReply(message, {});
    console.log(`Task set as done: ${taskId}`);
    return;
  }

  /**
   * Sets a task as undone.
   *
   * @param {import("discord.js").Interaction} interaction - The interaction object representing the command interaction.
   * @param {Options} options - The options object containing the task ID.
   * @returns {Promise<void>} - A promise that resolves when the task is set as undone.
   */
  async setUndone(interaction, options) {
    await interaction.deferReply();
    let taskId = parseInt(options.getString("id"));
    console.log(`Running setUndone(${taskId})`);
    let lang = await getLanguageById(interaction.guild.id);
    await updateTask(interaction.user.id, taskId, "false");
    let message = lang.language.setUndone.replace("{0}", taskId);
    await interaction.editReply(message, {});
    console.log(`Task set as undone: ${taskId}`);
    return;
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
    await interaction.deferReply();
    if (interaction.user.id !== interaction.guild.ownerId) {
      let embed = new EmbedBuilder();
      embed.setTitle("Config");
      embed.setColor("Red");
      embed.setDescription(lang.language.ownerError);
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    switch (command) {
      case "get":
        try {
          let config = await getConfig(interaction.guild.id);
          let user = interaction.guild.members.cache.get(config.userID);
          if (!user)
            user = await interaction.guild.members.fetch(config.userID);
          let response = multipleReplaceForLanguage(
            ["{0}", "{1}", "{2}"],
            [config.channelID, user.user.tag, config.language],
            lang.language.getConfig,
            this.client
          );
          await interaction.editReply(response, {});
          return;
        } catch (e) {
          console.error(e);
          await interaction.editReply(lang.language.configError, {});
          return;
        }
      case "set":
        let channel = options.getChannel("channel")
          ? options.getChannel("channel").id
          : "";
        let user = options.getUser("user") ? options.getUser("user").id : "";
        let language = options.getString("language")
          ? options.getString("language")
          : "";

        if (channel || user || language) {
          updateConfig(interaction.guild.id, channel, user, language);
          await interaction.editReply(lang.language.saved, {});
          return;
        } else {
          let embed = new EmbedBuilder();
          embed.setTitle("Config");
          embed.setColor("Red");
          embed.setDescription(`Error: ${lang.language.saveError}`);
          await this.client.channels.cache
            .get("1230190057684734124")
            .send({ embeds: [embed] });
          await interaction.editReply(lang.language.saveError, {});
          return;
        }
      case "reset":
        updateConfig(interaction.guild.id, "", "", "en");
        await interaction.editReply(lang.language.configReset, {});
        return;
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
    await interaction.deferReply();
    let command = options.getSubcommand();
    let lang = await getLanguageById(interaction.guild.id);

    let embed = new EmbedBuilder();
    embed.setTitle("Reminder");

    switch (command) {
      case "list":
        let reminders = await this.getRemindersByUser(interaction.user.id);
        let reminderList = reminders.data
          .map((r) => {
            return `- ${r.reminderID}. ${r.hour}:${r.minute}`;
          })
          .join("\n");
        if (reminders.length === 0) {
          embed.setColor("Red");
          embed.setDescription(
            `No reminders found for user ${interaction.user.globalName}(ID: ${interaction.user.id}) in guild ${interaction.guild.name}(ID: ${interaction.guild.id})`
          );
          await this.client.channels.cache
            .get("1230190057684734124")
            .send({ embeds: [embed] });
          await interaction.editReply(lang.language.noReminders, {});
          return;
        }
        let messageList = lang.language.reminderList.replace(
          "{0}",
          reminderList
        );
        await interaction.editReply(messageList, {});
        return;
      case "add":
        let time = options.getString("time");
        let [hour, minute] = time.split(":");
        let rValue = await addReminder(interaction.user.id, hour, minute);
        if (rValue["error"]) {
          await interaction.editReply(lang.language.reminderError, {});
          return;
        }
        await interaction.editReply(lang.language.addReminder, {});
        return;
      case "delete":
        let reminderID = options.getString("id");
        let reValue = await deleteReminder(interaction.user.id, reminderID);
        if (reValue["error"]) {
          embed.setColor("Red");
          embed.setDescription(`Error: ${reValue["error"]}`);
          await this.client.channels.cache
            .get("1230190057684734124")
            .send({ embeds: [embed] });
          await interaction.editReply(reValue["error"], {});
          return;
        } else {
          await interaction.editReply(lang.language.removeReminder, {});
          return;
        }
      default:
        await interaction.editReply(lang.language.reminderCommands, {});
        return;
    }
  };
}

/**
 * Represents a command object.
 */
class Command {
  /**
   * Creates a new command object.
   */
  constructor() {
    this.commands = new Map();
  }

  /**
   * Checks if a command exists.
   * @param {string} command - The command to check.
   * @returns {boolean} - A boolean indicating if the command exists.
   */
  has(command) {
    return this.commands.has(command);
  }

  /**
   * Gets a command.
   * @param {string} command - The command to get.
   * @returns {Function} - The command function.
   */
  get(command) {
    return this.commands.get(command);
  }

  /**
   * Sets a command.
   * @param {string} command - The command to set.
   * @param {Function} func - The function to set.
   * @returns {void}
   */
  set(command, func) {
    this.commands.set(command, func);
  }

  [Symbol.iterator]() {
    return this.commands.entries();
  }

  /**
   * Returns the number of commands.
   * @returns {number} - The number of commands.
   */
  get size() {
    return this.commands.size;
  }

  /**
   * Deletes a command.
   * @param {string} command - The command to delete.
   * @returns {boolean} - A boolean indicating if the command was deleted.
   */
  delete(command) {
    return this.commands.delete(command);
  }

  /**
   * Clears all commands.
   * @returns {void}
   */
  clear() {
    this.commands.clear();
  }

  /**
   * Executes a command.
   * @param {string} command - The command to execute.
   * @param {import('discord.js').Interaction} interaction - The interaction object.
   * @param {import('discord.js').CommandInteractionOptionResolver} options - The options object.
   * @returns {void}
   */

  execute(command, interaction, options) {
    this.get(command)(interaction, options);
  }

  /**
   * Returns the commands.
   * @returns {Map<string, Function>} - The commands.
   */
  getCommands() {
    return this.commands;
  }

  /**
   * Returns the command names.
   * @returns {string[]} - The command names.
   */

  getCommandNames() {
    return [...this.commands.keys()];
  }

  /**
   * Returns the command functions.
   * @returns {Function[]} - The command functions.
   */
  getCommandFunctions() {
    return [...this.commands.values()];
  }

  /**
   * Returns the command entries.
   * @returns {IterableIterator<[string, Function]>} - The command entries.
   */
  getCommandEntries() {
    return this.commands.entries();
  }

  /**
   * Returns the command keys.
   * @returns {IterableIterator<string>} - The command keys.
   */
  getCommandKeys() {
    return this.commands.keys();
  }
  /**
   * Returns the command values.
   * @returns {IterableIterator<Function>} - The command values.
   * @returns {void}
   */
  getCommandValues() {
    return this.commands.values();
  }
}

module.exports = {Commands, Command};
