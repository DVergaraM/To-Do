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
    await interaction.reply(message, {});
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
      await interaction.reply({ content: "Invalid language data." });
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
      await interaction.reply({ content: lang.language.no_tasks });
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

    await interaction.reply({ content: message });
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
    await interaction.reply(this.client.ws.ping + "ms", { ephemeral: true });
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
    // const lang = await getLanguageById(interaction.guild.id);
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
    await interaction.reply({ embeds: [embed], ephemeral: false });
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
    let taskDelete = parseInt(options.getString("id"));
    console.log(`Running deleteTask(${taskDelete})`);
    let lang = await getLanguageById(interaction.guild.id);
    await deleteTaskAPI(interaction.user.id, taskDelete);
    let message = lang.language.deleteTask.replace("{0}", taskDelete);
    await interaction.reply(message, {});
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
    let taskId = parseInt(options.getString("id"));
    console.log(`Running setDone(${taskId})`);
    let lang = await getLanguageById(interaction.guild.id);
    await updateTask(interaction.user.id, taskId, "true");
    let message = lang.language.setDone.replace("{0}", taskId);
    await interaction.reply(message, {});
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
    let taskId = parseInt(options.getString("id"));
    console.log(`Running setUndone(${taskId})`);
    let lang = await getLanguageById(interaction.guild.id);
    await updateTask(interaction.user.id, taskId, "false");
    let message = lang.language.setUndone.replace("{0}", taskId);
    await interaction.reply(message, {});
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

    if (interaction.user.id !== interaction.guild.ownerId) {
      let embed = new EmbedBuilder();
      embed.setTitle("Config");
      embed.setColor("Red");
      embed.setDescription(lang.language.ownerError);
      await interaction.reply({ embeds: [embed] });
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
          await interaction.reply(response, {});
          return;
        } catch (e) {
          console.error(e);
          await interaction.reply(lang.language.configError, {});
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
          await interaction.reply(lang.language.saved, {});
          return;
        } else {
          let embed = new EmbedBuilder();
          embed.setTitle("Config");
          embed.setColor("Red");
          embed.setDescription(`Error: ${lang.language.saveError}`);
          await this.client.channels.cache
            .get("1230190057684734124")
            .send({ embeds: [embed] });
          await interaction.reply(lang.language.saveError, {});
          return;
        }
      case "reset":
        updateConfig(interaction.guild.id, "", "", "en");
        await interaction.reply(lang.language.configReset, {});
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
          await interaction.reply(lang.language.noReminders, {});
          return;
        }
        let messageList = lang.language.reminderList.replace(
          "{0}",
          reminderList
        );
        await interaction.reply(messageList, {});
        return;
      case "add":
        let time = options.getString("time");
        let [hour, minute] = time.split(":");
        let rValue = await addReminder(interaction.user.id, hour, minute);
        if (rValue["error"]) {
          await interaction.reply(lang.language.reminderError, {});
          return;
        }
        await interaction.reply(lang.language.addReminder, {});
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
          await interaction.reply(reValue["error"], {});
          return;
        } else {
          await interaction.reply(lang.language.removeReminder, {});
          return;
        }
      default:
        await interaction.reply(lang.language.reminderCommands, {});
        return;
    }
  };
}

module.exports = Commands;
