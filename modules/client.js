const { Client, EmbedBuilder, GatewayIntentBits } = require("discord.js");
const CommandManager = require("./commands/manager");
const CommandExecutor = require("./commands/executor");

const { isReminderTime, changeStatus } = require("./methods");
const { getLanguage } = require("./requests/language.js");
const {
  getGuilds,
  getChannel,
  getUser,
  createCommands,
  deleteCommands,
} = require("./requests/others");
const { getTasksByGuild, deleteTask } = require("./requests/task");
const { createConfig, deleteConfig } = require("./requests/config");

class ToDoClient extends Client {
  /**
   * Represents the client object.
   * @constructor
   */
  constructor() {
    super({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    });
    this.commandExecutor = new CommandExecutor(this);
    this.commandManager = new CommandManager();
    this.commandManager.set("add", this.commandExecutor.addTask.bind(this));
    this.commandManager.set("list", this.commandExecutor.listTasks.bind(this));
    this.commandManager.set("ping", this.commandExecutor.ping.bind(this));
    this.commandManager.set(
      "delete",
      this.commandExecutor.deleteTask.bind(this)
    );
    this.commandManager.set("help", this.commandExecutor.help.bind(this));
    this.commandManager.set("setdone", this.commandExecutor.setDone.bind(this));
    this.commandManager.set(
      "setundone",
      this.commandExecutor.setUndone.bind(this)
    );
    this.commandManager.set("config", this.commandExecutor.config.bind(this));
    this.commandManager.set(
      "reminder",
      this.commandExecutor.reminder.bind(this)
    );
  }

  /**
   * Starts the bot and sets up event listeners for interaction commands, ready event, guild create event, and guild delete event.
   * @param {boolean} sure - A boolean value indicating whether the bot should start.
   * @returns {Promise<void>} A promise that resolves once the bot is ready.
   */
  async start(sure) {
    this.on("interactionCreate", async (interaction) => {
      if (!interaction.isCommand()) return;
      const { commandName, options } = interaction;
      if (this.commandManager.has(commandName.toLowerCase())) {
        this.commandManager.execute(
          commandName.toLowerCase(),
          interaction,
          options
        );
      }
    });

    this.once("ready", async () => {
      await this.commands(sure);
      console.log("Bot is ready.");
      let embed = new EmbedBuilder();
      embed.setColor("DarkAqua");
      embed.setTitle("To-Do Bot is ready.");
      embed.setTimestamp();
      let date = new Date();
      let [today, condition] = await isReminderTime(new Date());

      this.channels.cache.get("1230190057684734124").send({ embeds: [embed] });
      setInterval(async () => {
        date = new Date();
        [today, condition] = await isReminderTime(date);
        await changeStatus(this);
        await this.reminder(today, condition);
      }, 60000);
    });

    this.on("guildCreate", (guild) => {
      createConfig(guild.id);
    });

    this.on("guildDelete", (guild) => {
      deleteConfig(guild.id);
    });
  }

  /**
   * Executes the commands based on the given parameter.
   * If `sure` is true, it creates the commands.
   * If `sure` is false, it deletes the commands.
   *
   * @param {boolean} sure - Determines whether to create or delete the commands.
   * @returns {Promise<void>} - A promise that resolves when the commands are created or deleted.
   */
  async commands(sure) {
    if (sure) {
      await createCommands(this);
    } else {
      await deleteCommands(this);
    }
  }
  /**
   * Sends reminders to all guilds if it is the reminder time.
   * @param {Date} today - The current date.
   * @param {boolean} isReminderTime - Indicates whether it is the reminder time.
   * @returns {Promise<void>} - A promise that resolves when all reminders have been sent.
   */
  async reminder(today, isReminderTime) {
    if (isReminderTime) {
      try {
        let guilds = await getGuilds();
        for (let guild of guilds) {
          await this.sendReminders(guild, today);
        }
      } catch (error) {
        console.error("Error:", error);
        this.channels.cache
          .get("1230190057684734124")
          .send({ content: error.message });
      }
    }
  }

  /**
   * Sends reminders for tasks in a guild.
   * @param {string} guildID - The ID of the guild.
   * @param {string} today - The current date in string format.
   * @returns {Promise<void>} - A promise that resolves when the reminders are sent.
   */
  async sendReminders(guildID, today) {
    let lang = await getLanguage(guildID);
    let channelInDB = await getChannel(guildID);
    let user = await getUser(guildID);
    let tasks = await getTasksByGuild(guildID);
    let tasksToSend = tasks.filter((t) => t.status === false);
    let tasksToDelete = tasks.filter(
      (t) => t.date < today && t.status === true
    );
    let guild = this.guilds.cache.get(guildID);
    let embed = new EmbedBuilder();
    embed.setTitle("Reminders");
    if (!guild) {
      embed
        .setColor("Red")
        .setDescription(lang.language.guildNotFound.replace("{0}", guildID));
      this.channels.cache.get("1230190057684734124").send({ embeds: [embed] });
      return;
    }
    let channel = guild.channels.cache.get(channelInDB.channelID);
    if (!channel) {
      embed
        .setColor("Red")
        .setDescription(
          lang.language.channelNotFound.replace("{0}", channelInDB.channelID)
        );
      this.channels.cache.get("1230190057684734124").send({ embeds: [embed] });
      return;
    }
    if (tasksToSend.length > 0) {
      let tasksMessage = tasksToSend
        .map((t) => {
          let dueDate = new Date(t.date + "T12:00:00Z");
          dueDate.setHours(dueDate.getHours() + 5);
          let epochTimestamp = Math.floor(dueDate.getTime() / 1000);
          return `- ${t.id}. ${t.task} | <t:${epochTimestamp}:F>`;
        })
        .join("\n");

      let message = lang.language.reminder.replace("{0}", tasksToSend.length);
      await channel.send({
        content: `<@!${user.userID}> **${message}**:\n${tasksMessage}`,
      });
      embed.setColor("Green");
      embed.setDescription(
        `Reminders sent for guild "${guild.name}"\n${tasksMessage}`
      );
      this.channels.cache.get("1230190057684734124").send({ embeds: [embed] });
    } else {
      embed.setColor("Red");
      embed.setDescription(`No reminders to send for guild "${guild.name}"`);
      this.channels.cache.get("1230190057684734124").send({ embeds: [embed] });
    }

    for (let t of tasksToDelete) {
      await deleteTask(t.id);
    }
  }

  async stop() {
    await deleteCommands(this);
    this.destroy();
  }
}

module.exports = { ToDoClient };
