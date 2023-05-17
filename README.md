# TnologyDiscordBot
This is the source code to my Discord bot, which is written in TypeScript. It uses Harmony, which is a Discord library that uses Deno as its runtime.<br>

# I'd like to request a feature
If you'd like to request a feature, please create a GitHub suggestion with the "suggestion" label.<br>


# I found a security vulnerability!
If you have found a security vulnerability, please let T_nology know (preferably privately). You may contact T_nology through the following methods:
- **Preferred Method:** Creation of a Management Ticket in T_Cord (https://discord.gg/vKbjwMw) by going to the "#bot-commands" channel, running "-new Security Vulnerability," and selecting "Management Ticket."<br>
- **Alternative Method:** If you do not wish to create a Management Ticket in the Discord server, or you are unable to do so, you can email T_nology at `tnology55@gmail.com`.<br>
- **Other Alternative Method:** You can create a GitHub issue with the "Security Vulnerability" label.<br>


# Configuring the Bot

To configure the bot, please create a `.env` file (with this specific name). I will add documentation later, but for now, there is a `.env.example` file you can use.<br>
`_LOGGING_CHANNEL` values can be set to -1 to be disabled.


# How do I refer to versions of the bot?

- For any version of the bot before Monday, May 15th, 2023, refer to it by the first seven (7) letters of the hash of that commit, a dot, and the commit summary in quotes.
  - **Example 1:** 1f1a66f."Add Shell Command + Bot Start Logging"
  - **Example 2:** fd80eda."Initial commit"
- For any version from Monday, May 15th, 2023, up until now, refer to it by the version found in `version.txt`(e.g. Pre-Alpha v0.0.1)


# Custom RPS Options

Create a file called `rps_custom_options.csv`. You can leave it empty if you don't want any options. If you wish to add custom options, here is how the data is laid out: `Name,<What it beats (rock|paper|scissors|everything|nothing)>,<What it loses against (rock|paper|scissors|everything|nothing)>`. The bot will tie with the option not specified to win/lose against if everything and nothing are not used. Refer to `rps_custom_options.csv.example` for more information.