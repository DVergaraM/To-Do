# To-Do Bot

## Discord Bot Configuration

This README file outlines how to set up your `config.example.json` for your Discord bot.

### Setup

First, rename the `config.example.json` file to `config.json`.

Then, replace the configuration values in the `config.json` file with your own:

- `token`: This is your Discord bot's token. You can get this token from the Discord developer portal.
- `testChannelID`: This is the ID of the Discord channel where you want your bot to perform tests.
- `channelID`: This is the ID of the Discord channel where you want your bot to operate.
- `guildID`: This is the ID of the Discord server where your bot is located.
- `userID`: This is your Discord user ID.

Additionally, you can set up reminders in the `recordatories` array. Each object in the array represents a reminder and has two properties:

- `hour`: The hour of the day (in 24-hour format) when you want the reminder to trigger.
- `minute`: The minute of the hour when you want the reminder to trigger.

For example, if you want a reminder at 9:00 and 12:00, your `recordatories` array would look like this:

```json
"recordatories": [
    {
        "hour": 9,
        "minute": 0
    },
    {
        "hour": 12,
        "minute": 0
    }
]