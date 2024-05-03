/**
 * Represents a command object.
 */
class CommandManager {
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

module.exports = CommandManager;