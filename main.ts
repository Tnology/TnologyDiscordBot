import {
	CommandClient,
	GatewayIntents,
	Command,
	Embed,
	CommandContext,
	Webhook,
	TextChannel,
} from "https://raw.githubusercontent.com/harmonyland/harmony/daca400ae9feab19604381abddbdab16aa1ede2b/mod.ts";
import { isNumber, isString } from "https://deno.land/x/redis@v0.25.1/stream.ts";
import { config } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";
import { readCSV } from "https://deno.land/x/csv@v0.8.0/mod.ts";
import { encode } from "https://deno.land/std@0.175.0/encoding/base64.ts";

// TODO: Add a send webhook command.
// TODO: See if renaming variables works with VS Code. If not, disable Deno linting.

await config({ export: true });

const versionFile = await Deno.readTextFile("./version.txt");
const version = versionFile.split("\n")[0];

const developerMode = Deno.env.get("DEV_MODE") == "true";

let loggingLevel: string | undefined;

try {
	loggingLevel = Deno.env.get("LOGGING_LEVEL")!.toUpperCase();
}
catch (err) {
	if (err.message.includes("Cannot read properties of undefined")) {
		loggingLevel = undefined;
	}
	else {
		console.log(`Critical Error - The logging level cannot be properly set! Please contact the developer!\nError: ${err}\nError Message: ${err.message}\n`);
		loggingLevel = undefined;
	}
}


if (!["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"].includes(loggingLevel!) || loggingLevel == undefined) {
	console.log(`\n*****LOGGING ALERT*****\n\n\nAn invalid value (or no value at all) has been provided for LOGGING_LEVEL in the .env file.\nPlease set a proper value! For now, the logging level will be set to INFO.\n\n\n*****LOGGING ALERT*****\n`)
	loggingLevel = "INFO";
}

const criticalChannel = Deno.env.get("CRITICAL_LOGGING_CHANNEL");
const errorChannel = Deno.env.get("ERROR_LOGGING_CHANNEL");
const warningChannel = Deno.env.get("WARNING_LOGGING_CHANNEL");
const infoChannel = Deno.env.get("INFO_LOGGING_CHANNEL");
const debugChannel = Deno.env.get("DEBUG_LOGGING_CHANNEL");

const botStartLoggingChannel = Deno.env.get("BOT_START_CHANNEL");
const evalLoggingChannel = Deno.env.get("EVAL_LOGGING_CHANNEL");
const shellLoggingChannel = Deno.env.get("SHELL_LOGGING_CHANNEL");
const dmLoggingChannel = Deno.env.get("DM_LOGGING_CHANNEL");

function LogCritical(message: string) {
	// This will always log.
	console.log(`\n\n*****CRITICAL ERROR*****\n\nA critical error has occurred. Please contact the developer if this causes an issue!\nTime: ${GetFormattedTime(Date.now())}\nMessage:\n${message}\n\n************************`);
	if (criticalChannel != "-1" && criticalChannel != undefined) {
		SendEmbed(criticalChannel, "‼️ Critical Error!", `A critical error has occured. Please contact the developer if this causes an issue!\n**Time:** <t:${Date.now()}>\n**Message:**\n\`\`\`\n${message}\n\`\`\`\n`, 0x550000)
	}
	return;
}

function LogError(message: string) {
	// This will log if the logging level is: CRITICAL, ERROR
	if (!["ERROR", "WARNING", "INFO", "DEBUG"].includes(loggingLevel!)) {
		return -1;
	}
	if (errorChannel != "-1" && errorChannel != undefined) {
		SendEmbed(errorChannel, "⛔ Error", `An error has occured.\n**Time:** <t:${Date.now()}>\n**Message:** \n\`\`\`\n${message}\n\`\`\`\n`, 0xFF0000);
	}
	let messageArray = message.split("\n").slice(1);
	let finalOutput = `${GetFormattedTime(Date.now())} | [ERROR]: ${message.split("\n")[0]}\n`;
	for (let lineIndex in messageArray) {
		finalOutput += `  > ${GetFormattedTime(Date.now())} | [ERROR]: ${messageArray[lineIndex]}\n`;
	}
	console.log(finalOutput);
	return;
}

function LogWarning(message: string) {
	// This will log if the logging level is: CRITICAL, ERROR, WARNING
	if (!["WARNING", "INFO", "DEBUG"].includes(loggingLevel!)) {
		return -1;
	}
	if (warningChannel != "-1" && warningChannel != undefined) {
		SendEmbed(warningChannel, "⚠️ Warning", `A warning has occurred.\n**Time:** <t:${Date.now()}>\n**Message:** \n\`\`\`\n${message}\n\`\`\`\n`, 0xFFFF00);
	}
	let messageArray = message.split("\n").slice(1);
	let finalOutput = `${GetFormattedTime(Date.now())} | [WARNING]: ${message.split("\n")[0]}\n`;
	for (let lineIndex in messageArray) {
		finalOutput += `  > ${GetFormattedTime(Date.now())} | [WARNING]: ${messageArray[lineIndex]}\n`;
	}
	console.log(finalOutput);
	return;
}

function LogInfo(message: string) {
	// This will log if the logging level is: CRITICAL, ERROR, WARNING, INFO
	if (!["INFO", "DEBUG"].includes(loggingLevel!)) {
		return -1;
	}
	if (infoChannel != "-1" && infoChannel != undefined) {
		SendEmbed(infoChannel, "ℹ️ Info", `Information has been logged.\n**Time:** <t:${Date.now()}>\n**Message:** \n\`\`\`\n${message}\n\`\`\`\n`, 0x0000FF);
	}
	let messageArray = message.split("\n").slice(1);
	let finalOutput = `${GetFormattedTime(Date.now())} | [INFO]: ${message.split("\n")[0]}\n`;
	for (let lineIndex in messageArray) {
		finalOutput += `  > ${GetFormattedTime(Date.now())} | [INFO]: ${messageArray[lineIndex]}\n`;
	}
	console.log(finalOutput);
	return;
}

function LogDebug(message: string) {
	// This will log if the logging level is: CRITICAL, ERROR, WARNING, INFO, DEBUG
	if (loggingLevel != "DEBUG") {
		return -1;
	}
	if (debugChannel != "-1" && debugChannel != undefined) {
		SendEmbed(debugChannel, "🔰 Debug", `**Time:** <t:${Date.now()}>\n**Message:** \n\`\`\`\n${message}\n\`\`\`\n`, 0x5555FF);
	}
	let messageArray = message.split("\n").slice(1);
	let finalOutput = `${GetFormattedTime(Date.now())} | [DEBUG]: ${message.split("\n")[0]}\n`;
	for (let lineIndex in messageArray) {
		finalOutput += `  > ${GetFormattedTime(Date.now())} | [DEBUG]: ${messageArray[lineIndex]}\n`;
	}
	console.log(finalOutput);
	return;
}

let maximumRandomNumber: number;

if (Deno.env.get("MAXIMUM_RANDOM_NUMBER") == undefined || isNaN(Number(Deno.env.get("MAXIMUM_RANDOM_NUMBER")))) {
	console.log("NOTICE: Either an invalid value or no value at all was given for the MAXIMUM_RANDOM_NUMBER value in your .env file! The default of 1,000,000 has been set.\nTo stop seeing this message, please set a proper value!");
	maximumRandomNumber = 1000000;
}
else {
	maximumRandomNumber = Number(Deno.env.get("MAXIMUM_RANDOM_NUMBER"));
}

const discussionThreadsEnabled = Deno.env.get("ENABLE_DISCUSSION_THREADS") == "true";
const discussionChannels = Deno.env.get("DISCUSSION_CHANNELS")?.split(",");

let oneWordStoryChannels = Deno.env.get("ONE_WORD_STORY_CHANNELS")?.split(",");
const oneWordStoryLoggingChannel = Deno.env.get("ONE_WORD_STORY_LOGGING_CHANNEL");

let twoWordStoryChannels = Deno.env.get("TWO_WORD_STORY_CHANNELS")?.split(",");
const twoWordStoryLoggingChannel = Deno.env.get("TWO_WORD_STORY_LOGGING_CHANNEL");
const storyWebhooksEnabled = Deno.env.get("STORY_WEBHOOKS") == "true";
const botOverridesStoryChannels = Deno.env.get("BOT_OVERRIDES_STORY_CHANNELS") == "true";

const usernameChangeLoggingChannel = Deno.env.get("USERNAME_CHANGE_LOGGING_CHANNEL");

const disableBidomeStupidMessages = Deno.env.get("DISABLE_BIDOME_STUPID_MESSAGES") == "true";

let reminders = JSON.parse(await Deno.readTextFile("./reminders.json"));

try {
	for (let i = 0; i < oneWordStoryChannels!.length; i++) {
		if (twoWordStoryChannels!.includes(oneWordStoryChannels![i])) {
			LogError(
				`Error: Channel is used for both one-word and two-word story channel! Please fix this in your .env file!\nOne-Word and Two-Word Story Channels have been disabled.`
			);
			oneWordStoryChannels = ["-1"];
			twoWordStoryChannels = ["-1"];
		}
	}
}
catch (error) {
	if (error.message.includes("Cannot read properties of undefined")) {
		LogError(`Error checking for conflicting channels between one word and two word story channels! Please ensure you have proper values set. To disable this feature, set the values to -1. Refer to .env.example for more information.\nOne Word Story and Two Word Story have been disabled.`);
		oneWordStoryChannels = ["-1"];
		twoWordStoryChannels = ["-1"];
	}
	else {
		LogCritical(`An unknown error occurred while attempting to check for conflicting channels between one word story and two word story! Please contact the developer!\nError: ${error}\nError Message: ${error.message}\nError Stack: ${error.stack}`)
		oneWordStoryChannels = ["-1"];
		twoWordStoryChannels = ["-1"];
	}
}

function SendEmbed(channelid: string, title: string, description: string, color: number) {
	if (channelid == "-1") {
		return false;
	}

	try {
		bot.channels
		.sendMessage(
			channelid,
			new Embed({
				title: title,
				description: description,
				color: color,
			})
		)
		.catch((error) => {
			// if (String(error).includes("(10003) Unknown Channel")) {
			// 	if (channelid == usernameChangeLoggingChannel) {
			// 		console.error(
			// 			`*****Embed Error*****\nAn error occurred attempting to send an embed.\n\nProblem: It appears that the Username Change Logging Channel cannot be found. Please check your .env file and the bot's permissions.\n\nOther Error Info:\nAttempted Channel ID: ${channelid}\n\nAttempted Title: ${title}\n\nAttempted Description: \n-----Error Description-----\n${description}\n-----End Error Description-----\n\nAttempted Color: ${color}\n\nError: ${error}\nProblem (Repeated): It appears that the Username Change Logging Channel cannot be found. Please check your .env file and the bot's permissions.\n*****End Embed Error*****\n`
			// 		);
			// 		return false;
			// 	}
			// }
			// else {
				LogError(
					`Embed Error: An error occurred attempting to send an embed.\nAttempted Channel ID: ${channelid}\nAttempted Title: ${title}\n\n-----Attempted Description-----\n${description}\n-----End Attempted Description-----\n\nAttempted Color: ${color}\n\nError: ${error}\n*****End Embed Error*****\n`
				);
				return false;
			// }
		});
	}
	catch (error) {
		if (error.message.includes("Cannot access 'bot' before initialization")) {
			return false;
		}
		else {
			LogCritical(`A critical error occurred in the SendEmbed function!\nError: ${error}\nError Message: ${error.message}\nError Stack: ${error.stack}\n`)
		}
	}
	

	return true;
}

// TODO: Check if Harmony has a new version and update it if it does

const ownersArray = Deno.env.get("OWNERS")?.split(",");


// NEGATIVE RETURN VALUES:
// -1: The max parameter exceeded the maximumRandomNumber value.
// -2: The min parameter is greater than the max parameter.
// -3: A negative number was provided for the min or max parameter parameter.
// -4: A negative number was provided for the max parameter. This case probably won't activate.
// -5: Unknown Error.
function RandomNumber(min: number, max: number, channelid: string | undefined=undefined) {
	if (max > maximumRandomNumber) {
		if (channelid != undefined) {
			bot.channels.sendMessage(channelid, new Embed({
				title: "Number Error",
				description: `The maximum number provided is too high. You provided ${max}, but the maximum allowed is ${maximumRandomNumber}.`,
				color: 0xFF0000,
			}))
		}
		return -1;
	}
	else if (min > max) {
		if (channelid != undefined) {
			bot.channels.sendMessage(channelid, new Embed({
				title: "Number Error",
				description: "The minimum number provided is greater than the maximum number.",
				color: 0xFF0000,
			}))
		}
		return -2;
	}
	else if (min < 0) {
		if (channelid != undefined) {
			bot.channels.sendMessage(channelid, new Embed({
				title: "Number Error",
				description: "A negative number was provided for the minimum and/or maximum number.",
				color: 0xFF0000,
			}))
		}
		return -3;
	}
	else if (max < 0) {
		if (channelid != undefined) {
			bot.channels.sendMessage(channelid, new Embed({
				title: "Number Error",
				description: "A negative number was provided for the maximum number.",
				color: 0xFF0000,
			}))
		}
		return -4;
	}
	else if (max <= maximumRandomNumber) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	}
	else {
		if (channelid != undefined) {
			bot.channels.sendMessage(channelid, new Embed({
				title: "Unknown Number Error",
				description: `An unknown error has occured. If this continues happening, please contact the developer (T_nology).\n**min:** \`${min}\`\n**max:** \`${max}\`\n**maximumRandomNumber:** \`${maximumRandomNumber}\`\n**channelid:** ~${channelid}`,
				color: 0xFF0000,
			}))
		}
		return -5;
	}
}

const topicArray = [
	"the weather",
	"news about intel",
	"news about AMD",
	"news about NVIDIA",
	"news about Apple",
	"news about Samsung",
	"news about Google",
	"news about Microsoft",
	"news about Sony",
	"news about Nintendo",
	"news about Facebook/Meta",
	"news about Amazon",
	"talking about Elon Musk",
	"what programming language is the best",
	"what web development framework is the best",
	"what programming language is the worst",
	"what web development framework is the worst",
	"Minecraft",
	"An interesting fact that not everyone knows about you",
	"Your favorite video game(s)",
	"Your favorite movie(s)",
	"Do you have a 3D Printer? If so, what have you printed?",
	"Is Moore's law dead?",
	"Do you use GitHub Copilot?",
	"How important is responsive design in web develpment (for mobile devices and whatnot)?",
	"Are MacBooks/iMacs worth it?",
	"Which is better - iOS or Android?",
	"What email client do you use?",
	"What are some good Linux distributions?",
	"Which is better - Windows, macOS, or Linux?",
	"Are Chromebooks good?",
	"What is some software that you wish worked on Linux (properly)?",
	"Is TikTok a threat to national security?",
	"Is the US government spying on us?",
	"Should healthcare be free in the United States?",
	"Is Communism a good idea?",
	"Is Socialism a good idea?",
	"Is GitHub or GitLab better?",
	"Is Discord or Guilded better?",
	"Are Telegram or Signal good alternatives to SMS Messaging?",
	"Is TypeScript better than JavaScript?",
	"Is Deno better than Node.js?",
	"Is Rust better than C++?",
	"How many words per minute do you get typing on a keyboard?",
	"Should America's education system be revamped?",
	"How much memory do you have in your computer?",
	"What phone do you have?",
	"Is tax theft?",
	"Should land be a commodity to be bought and sold?",
	"Is Canada real?",
	"Is Australia real?",
	"What are some features that Discord should add?",
	"Is Discord Nitro worth it?",
	"Should prisons be based on rehabilitation as opposed to punishment?",
	"Is water wet?",
	"Who are some YouTubers that you watch?",
	"How are you?",
	"How did you come up with your username?",
	"What are your favorite foods?",
	"What are your favorite drinks?",
	"What are your favorite snacks?",
	"What are your favorite desserts?",
	"How many digits of pi do you memorize?",
	"What time zone are you in?",
	"Do you eat meat?",
	"Is your main computer a desktop or a laptop?",
	"Should seeds be able to be patented?",
	"Do you touch grass?",
	"Should teachers have guns at schools?",
	"What flavors of ice cream do you like?",
	"Should the United States disband political parties?",
	"Has Elon Musk made any good decisions for Twitter while owning it?",
	"Can macaroni and cheese be a Thanksgiving food?",
	"Is soup a drink?",
	"Is cereal a soup?",
	"Is a hot dog a taco?\nBy the way - https://cuberule.com/",
	"Do you use Guilded?",
	"What is a movie that has a sequel as good as the original?",
	"What books have you read?",
	"What web browser do you use?",
	"Should it be required by law for companies to give consumers the right to repair? If so, should consumers also get the right to documentation/instructions on how to repair the products?",
	"Are you good at math?",
	"What (spoken) languages do you know?",
	"Is Windows 11 better than Windows 10?",
	"Did you ever use Windows XP? If so, did you ever use it on an actual machine (outside of a VM)?",
	"Is it transphobic to have a preference to not date those who are transgender?",
	"Do you like s'mores?",
	"Do you like tacos?",
	"Do you like pizza?",
	"Do you like burgers?",
	"What's a popular food that you have never tried?",
	"Do you like salad?",
	"Do you sleep with any light on in the room (e.g. TV or lamp)?",
	"What FOV do you play Minecraft at?",
	"What's a good tip you have learned for software development?",
	"Should airplanes be legally required to always have a doctor on board?",
	"Do you have any USB Flash Drives?",
	"How do you feel about NFTs and cryptocurrency?",
	"Is hardware-based authentication (such as YubiKeys) a good idea for two-factor authentication?",
	"Is it a good idea to use a password manager?",
	"Do you use a VPN? If so, what VPN do you use?",
	"Should it be illegal to raise a child vegan?",
	"Should the US use the Metric System?",
	"Your username is now a shop, what do you sell?",
	"You are hanging down from a tall building, and you are holding onto your profile picture. Do you trust it to not let go?",
	"Should Discord allow client modifications?",
	"Is a 360Hz monitor worth it?",
	"What is the refresh rate of your monitor?",
	"Which is better: WinRaR or 7Zip?",
	"Is bacon good on cheeseburgers?",
	"Is pineapple good on pizza?",
	"Do you prefer your keyboard to have a numberpad or be TKL?",
	"Are oatmeal raisin cookies good?",
	"How many hours of sleep do you typically get each night?",
	'Does the "militia" in the Second Amendment of the United States Constitution refer to the people?',
	"Suppose you have an old boat, the wood of whioch starts to rot out every now and then. If you slowly replace the wood plank by plank, by the time every plank has been replaced, is it still the same boat?",
	"Is it okay to use a VPN to bypass a website's region lock?",
	"Have you ever donated to Wikipedia? Do you ever plan on donating to it in the future?",
	"Is it okay to pirate software if you own a license for it?",
	"Is it okay to pirate games if they are no longer obtainable?",
	"Have you ever built a PC? Do you ever plan on building a PC in the future?",
	"Should you strive to make code that is optimized for performance or readability?",
	"Are you in a relationship?",
	"Do you have an antivirus? If so, what antivirus do you have?",
	"Do you use an adblocker? If so, what adblocker do you use?",
];

function DetermineBotChoice(choiceNum: number) {
	switch (choiceNum) {
		case 1:
			return "rock";
		case 2:
			return "paper";
		case 3:
			return "scissors";
		default:
			LogError(`An error has occurred!\nError Details:\nFunction "DetermineBotChoice" returned an invalid value!\nExpected Values: 1, 2, 3\nReturned Value: ${choiceNum}\nPlease report this to the developer!`);
			return "error";
	}
}

async function SendWebhook(msg: any, allowedWords: number=0) {
	LogDebug("The SendWebhook (asynchronous) function has been called!")
	if (storyWebhooksEnabled) {
		const avatarURL = `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.jpeg`;
		const channelArg = msg.channel.id;
		const name = msg.author.username;
		let message = msg.content;

		if (msg.content.split(" ").length != allowedWords) {
			return;
		}

		try {
			message = message.trim()
		}
		catch (error) {
			if (error.message.includes("Cannot read properties of undefined (reading 'trim')")) {
				console.log(`story error that cannot read properties of undefined reading 'trim', make sure the message isn't undefined\n ${error}`)
				// await ctx.message.reply(new Embed({
				// 	title: "Webhook Error",
				// 	description: `An unexpected error has occurred.\n**Likely Cause of Error:** Entering an undefined message. Make sure you provide a message for the webhook to be sent!\n**For Developers:**\n\`\`\`js\n${error}\n\`\`\``,
				// 	color: 0xFF0000,
				// }))
			}
			else {
				console.log(`unexpected story error:\n${error}`)
			}
		}

		let channel;

		try {
			channel = (await msg.guild?.channels.fetch(msg.channel.id)) as unknown as TextChannel;
		}
		catch (error) {
			if (error.message.includes("NUMBER_TYPE_COERCE: Value") && error.message.includes("is not a snowflake")) {
				console.log("Send Webhook error")
				console.log(error)
				console.log(error.message)
				// await msg.message.reply(new Embed({
					// title: "Webhook Error",
					// description: "Please provide a valid channel to send a webhook in!",
					// color: 0xFF0000,
				// }))
			}
		}

		if (channelArg[0] == "<" && channelArg[1] == "#" && channelArg[channelArg.length - 1] == ">") {
			LogDebug(`SendWebhook Function 1.1: ${channelArg}`) // DEBUG
			channel = (await msg.guild?.channels.fetch(channelArg.slice(2, channelArg.length - 1))) as unknown as TextChannel;
		} else {
			LogDebug(`SendWebhook Function 1.2: ${channelArg}`) // DEBUG
			channel = (await msg.guild?.channels.fetch(channelArg)) as unknown as TextChannel;
		}

		LogDebug(`SendWebhook Function 2`); // DEBUG

		// const webhooks = await channel!.fetchWebhooks();
		// let webhook: Webhook | undefined = undefined;

		let webhook;
		const webhooks = (await channel!.fetchWebhooks());
		for (let webhookIndex in webhooks) {
			if (webhooks[webhookIndex].name == "TnologyBot") {
				webhook = webhooks[webhookIndex];
			}
		}
		LogDebug(`SendWebhook Function > Webhook is: ${webhook}`); // DEBUG

		LogDebug("SendWebhook Function 2.1") // DEBUG
		let createdWebhook: Webhook;

		const avatar = encode(new Uint8Array(await (await fetch(String(avatarURL))).arrayBuffer()));

		LogDebug(`SendWebhook Function 2.1.1`);

		if (webhook == undefined && String(avatarURL) == "default") {
			LogDebug("SendWebhook Function 2.2") // DEBUG
			createdWebhook = await Webhook.create(channel, bot, {
				name: "TnologyBot",
			});
			// console.log(4);
		} else if (webhook == undefined) {
			LogDebug("SendWebhook Function 2.3") // DEBUG
			createdWebhook = await Webhook.create(channel, bot, {
				name: "TnologyBot",
				// avatar: `data:image/png;base64,${avatar}`, // FIXME: See if this works for making the bot's webhook
			});
			// console.log(5);
		} else {
			LogDebug("SendWebhook Function 2.4") // DEBUG
			createdWebhook = webhook;
			// console.log(6);
		}

		// createdWebhook.send(message);
		createdWebhook.send(message, {
			avatar: msg.author.avatarURL(),
			name: name
		})
	}
}

function GetFormattedTime(timestamp: number | string) {
	timestamp = Number(timestamp);
	return new Date(timestamp).toString().split(" GMT")[0];
}


const bot = new CommandClient({
	caseSensitive: false,
	enableSlash: false,
	mentionPrefix: true,
	prefix: developerMode == false ? ">" : ">>",
	owners: ownersArray,
	isUserBlacklisted(id: string) {
		const victims = ["347083401141944333", "314166178144583682"];

		if (victims.includes(id)) {
			return RandomNumber(1, 100) < 10;
		}

		return false;
	},
});

bot.on("ready", () => {
	developerMode == false
		? LogInfo(
				`The bot is ready. The bot's info is the following:\nBot Username: ${bot.user!.tag}\nBot Owner(s): ${ownersArray}\nVersion: ${version}`
		  )
		: LogInfo(`The bot is ready and is in developer mode.\nBot Username: ${bot.user!.tag}\nBot Owner(s): ${ownersArray}\nVersion: ${version}`);
	botStartLoggingChannel != "-1"
		? SendEmbed(
				botStartLoggingChannel!,
				"Bot Started!",
				`The bot has started!\n**Username:** ${bot.user!.tag}\n**Owners:** ${
					bot.owners
				}\n**Developer Mode:** ${developerMode}\n\n**Eval Channel:** ${evalLoggingChannel} (<#${evalLoggingChannel}>)
				**Shell Channel:** ${shellLoggingChannel} (<#${shellLoggingChannel}>)\n
				**One Word Story Channels:** ${oneWordStoryChannels}
				**One Word Story Logging Channel:** ${oneWordStoryLoggingChannel} (<#${oneWordStoryLoggingChannel}>)\n
				**Two Word Story Channels:** ${twoWordStoryChannels}\n**Two Word Story Logging Channel:** ${twoWordStoryLoggingChannel} (<#${twoWordStoryLoggingChannel}>)\n
				`,
				0x00ff00
		  )
		: {};
});

bot.on("messageCreate", (msg) => {

	if (msg.webhookID) {
		return;
	}

	// try {
		if (discussionThreadsEnabled) {
			if (discussionChannels!.includes(msg.channel.id)) {
				msg.startThread({
					name: "Discussion Thread",
				});
			}
		}
	// }
	// catch (error) {
		// if (!error.message.includes("Cannot read properties of undefined")) {
			// LogCritical(`Critical Error in the bot.on messageCreate event!\nError: ${error}\nError Message: ${error.message}\nError Stack: ${error.stack}`)
		// }
	// }


	if (!oneWordStoryChannels?.includes("-1")) {
		let messageValid = true;
		if (oneWordStoryChannels!.includes(msg.channel.id)) {
			if (!(msg.content[0] == "/" && msg.content[1] == "/")) {
				if (
					msg.content.split(" ").length > 1 ||
					msg.content.includes("https://") ||
					msg.content.includes("http://") ||
					msg.content.includes("\n") ||
					msg.content.length >= 100
				) {
					//console.log(`Message has been deleted for having too many words\nType: One Word Story\nMessage Content: ${msg.content}`);
					if (botOverridesStoryChannels) {
						if (msg.author.bot) {
							return 1;
						}
					}
					if (oneWordStoryLoggingChannel != "-1") {
						SendEmbed(
							oneWordStoryLoggingChannel!,
							"One Word Story - Deleted",
							`A message has been deleted from <#${msg.channel.id}>\n**Author:** ${msg.author} ${msg.author.id})\n**Content:** ${msg.content}\n**Time:** ${msg.timestamp}`,
							0xff0000
						);
					}

					messageValid = false;
					msg.delete();
				}
			}
			if (storyWebhooksEnabled && messageValid && !(msg.content[0] == "/" && msg.content[1] == "/")) {
				SendWebhook(msg, 1);
				msg.delete();
			}
		}
	}

	if (!twoWordStoryChannels?.includes("-1")) {
		let messageValid = true;
		if (twoWordStoryChannels!.includes(msg.channel.id)) {
			if (
				!(
					(msg.content[0] == "/" && msg.content[1] == "/") ||
					msg.content.includes("https://") ||
					msg.content.includes("http://") ||
					msg.content.includes("\n") ||
					msg.content.length >= 100
				)
			) {
				if (msg.content.split(" ").length > 2) {
					if (botOverridesStoryChannels) {
						if (msg.author.bot) {
							return 1;
						}
					}
					if (twoWordStoryLoggingChannel != "-1") {
						SendEmbed(
							twoWordStoryLoggingChannel!,
							"Two Word Story - Deleted",
							`A message has been deleted from <#${msg.channel.id}>\n**Author:** ${msg.author} (${msg.author.id})\n**Content:** ${msg.content}\n**Time:** ${msg.timestamp}`,
							0xff0000
						);
					}
					// console.log(`Message has been deleted for having too many words\nType: Two Word Story\nMessage Content: ${msg.content}`);
					messageValid = false;
					msg.delete();
				}
			}
			if (storyWebhooksEnabled && messageValid && !(msg.content[0] == "/" && msg.content[1] == "/")) {
				SendWebhook(msg, 2);
				msg.delete();
			}
		}
	}

	if (disableBidomeStupidMessages) {
		if (msg.author.id == "778670182956531773" && msg.channel.id == "635483003686223913") {
			msg.delete();
			msg.author.send("nuh uh");
		}
	}

	if (msg.channel.isDM() && dmLoggingChannel != "-1") {
		SendEmbed(dmLoggingChannel!, "DM Received", `A DM has been received!\nUser: ${msg.author} (${msg.author.id})\nMessage Content: ${msg.content}`, 0x0000FF)
	}
});

bot.on("gatewayError", (error) => {
	LogError(`A gateway error has occurred!\nError Type: ${error.type}\nError Message: ${error.message}\nError Timestamp: ${error.timeStamp}\nError: ${error.error}\n`)
});

bot.on("commandError", (ctx, error) => {
	if (error.message.includes("No such file or directory (os error 2): open './rps_custom_options.csv'")) {
		LogError(
			"\n***** Error: No custom RPS options file found! To stop seeing this error, please create the file and leave it empty. Refer to README.md for more information.*****\n"
		);
		return;
	}
	LogError(`An error has occurred!\nName of Error: ${error.name}\nMessage of Error: ${error.message}\nCause of Error: ${error.cause}\nError: ${error}\nError Stack:\n${error.stack}\n\n`);
	ctx.message.reply(
		new Embed({
			title: "Error!",
			description: `An unexpected error has occurred. Please contact the developer if you believe this shouldn't happen!\n**Error:** \`${error.name}\`\n**Error Cause:** \`${error.cause}\`\n**Full Error:**\n\`\`\`js\n${error.stack}\n\`\`\``,
		})
	);
});

// bot.on("userUpdate", (before, after) => {
// 	if (before.tag != after.tag) {
// 		if (usernameChangeLoggingChannel == "-1") {
// 			return;
// 		} else if (usernameChangeLoggingChannel == undefined) {
// 			console.error(`Error - Username Change Logging Channel (${usernameChangeLoggingChannel}) is undefined. Please enter "-1" as your .env value if you wish to disable this.`);
// 			return;
// 		}
		
// 		SendEmbed(usernameChangeLoggingChannel, "Usernname Changed", `**Before:** ${before.tag}\n**After:** ${after.tag}`, 0x0000FFF);
// 	}
// 	else if (before.timestamp != after.timestamp || before.id != after.id) {
		// console.log(`This definitely shouldn't be happening! Somehow, a user updated their timestamp or ID!\nBefore Timestamp: ${before.timestamp}\nAfter Timestamp: ${after.timestamp}\nBefore ID: ${before.id}\nAfter ID: ${after.id}`)
		// TODO: Add this specific message to shell + eval logging channels
	// }
// })

class HelpCommand extends Command {
	name = "help";
	aliases = ["commands", "cmds"];
	description = "Shows available commands.\n**Syntax:** `help`";
	async execute(ctx: CommandContext) {
		const fullCommandsArray = [];
		let helpPage = Number(ctx.argString.split(" ")[0]);

		for (const commandIndex in ctx.client.commands.list.array()) {
			const thisCommand = ctx.client.commands.list.array()[commandIndex];
			fullCommandsArray.push(`**\n${thisCommand.name}**\nAliases: ${thisCommand.aliases}\nDescription: ${thisCommand.description}\n`); // 10/10 code
		}

		const maxHelpPage = Math.ceil(fullCommandsArray.length / 5);

		if (helpPage == 0) {
			helpPage = 1;
		} else if (helpPage < 0 || helpPage > maxHelpPage) {
			await ctx.message.reply(
				new Embed({
					title: "Error!",
					description: `Please enter a valid page number! Valid pages are **1** to **${maxHelpPage}**.`,
				})
			);
			return;
		}

		const arrayIndexStart = helpPage * 5 - 5;
		const arrayIndexEnd = helpPage * 5;

		const commandsArray = fullCommandsArray.slice(arrayIndexStart, arrayIndexEnd);

		const commandString = commandsArray.join("\n");

		await ctx.message.reply(
			new Embed({
				title: "Help",
				description: `${commandString}`,
				footer: {
					text: `Page ${helpPage}/${maxHelpPage}`,
				},
			})
		);
	}
}

class Whoami extends Command {
	name = "whoami";
	aliases = ["imhavinganidentitycrisis"];
	description = "Gets your username.\n**Syntax:** `whoami`";

	async execute(ctx: CommandContext) {
		await ctx.message.reply(
			new Embed({
				title: "Whoami",
				description: `Your username is ${ctx.author.username}${ctx.author.discriminator}\nYour User ID is ${ctx.author.id}`,
			})
		);
	}
}

class ShellCommand extends Command {
	name = "shell";
	aliases = ["sh", "shellcmd"];
	description = "Executes a shell command. Owner only.\n**Syntax:** `shell <shell command to execute>`";
	ownerOnly = true;

	async execute(ctx: CommandContext) {
		console.log(`**********\nA shell command has began execution.\n**********`);
		await ctx.message.reply(
			new Embed({
				title: "Executing",
				description: "Executing the command...",
				color: 0xff9e00,
			})
		);
		SendEmbed(
			shellLoggingChannel!,
			"Executing Shell Command",
			`**Author:** ${ctx.author} (**User ID:** \`${ctx.author.tag}\` // **User ID:** \`${ctx.author.id}\`\n**Command:**\n\`\`\`js\n${ctx.argString}\n\`\`\``,
			0x0000ff
		);
		//		try {
		const cmd = Deno.run({
			cmd: ctx.argString.split(" "),
			stdout: "piped",
			stderr: "piped",
		});

		const output = new TextDecoder().decode(await cmd.output());

		await ctx.message.reply(
			new Embed({
				title: `Success (${(await cmd.status()).code})`,
				description: `Output: \`\`\`\n${output}\n\`\`\``,
				color: 0x00ff00,
			})
		);
		SendEmbed(
			shellLoggingChannel!,
			"Executed Shell Command",
			`**Author:** ${ctx.author} (**User ID:** \`${ctx.author.tag}\` // **User ID:** \`${ctx.author.id}\`\n\n**Output:**\n\`\`\`\n${output}\n\`\`\`\n**Command:**\n\`\`\`js\n${ctx.argString}\n\`\`\``,
			0x00ff00
		);
		// await ctx.message.reply(`${new TextDecoder().decode(await cmd.output())}`);
	}
}

class RockPaperScissorsCommand extends Command {
	name = "rps";
	aliases = ["rockpaperscissors"];
	description = "Lets you play a game of Rock, Paper, Scissors with the bot.\n**Syntax:** `rps <rock|paper|scissors>`";

	async execute(ctx: CommandContext) {
		LogDebug(`The RockPaperScissors command has begun execution! (Command Author ID: ${ctx.author.id})`);
		const userChoice = ctx.argString.split(" ")[0].toLowerCase();
		let customOptionsDisabled = false;
		LogDebug(`RockPaperScissorsCommand userChoice: ${userChoice}`); // DEBUG

		const _file = await Deno.open("./rps_custom_options.csv").catch((error) => {
			if (error.message.includes("No such file or directory (os error 2): open './rps_custom_options.csv'")) {
				console.log(
					"\n***** Error: No custom RPS options file found! To stop seeing this error, please create the file and leave it empty. Refer to README.md for more information.*****\n"
				);
				customOptionsDisabled = true;
			}
		});

		if (!customOptionsDisabled) {
			var customOptions = [];
			var acceptableCustomOptions = ["rock", "paper", "scissors", "everything", "nothing"];
			const file = await Deno.open("./rps_custom_options.csv");
			for await (const row of readCSV(file)) {
				// console.log("row:");
				// console.log(row);
				let tempCounter = 1;
				let tempName = "";
				let tempWinsAgainst = "";
				let tempLosesAgainst = "";
				for await (const cell of row) {
					if (tempCounter > 3) {
						LogError(`RPS Error - Invalid CSV Format, please refer to \"./rps_custom_options.csv.example\".\nRPS custom options will not work!`);
						customOptionsDisabled = true;
						break;
					} else if (tempCounter == 1) {
						tempName = cell;
					} else if (tempCounter == 2) {
						if (!acceptableCustomOptions.includes(cell)) {
							LogError(`RPS Error - Invalid CSV Format. ${cell} of ${row} is not rock/paper/scissors/everything/nothing. 
							Unfortunately, you cannot set custom options for what custom options win/lose against.\nRPS custom options will not work!`);
							customOptionsDisabled = true;
							break;
						}
						tempWinsAgainst = cell;
					} else if (tempCounter == 3) {
						if (!acceptableCustomOptions.includes(cell)) {
							LogError(`Error - Invalid CSV Format. ${cell} of ${row} is not rock/paper/scissors/everything/nothing. 
							Unfortunately, you cannot set custom options for what custom options win/lose against.\nRPS custom options will not work!`);
							customOptionsDisabled = true;
							break;
						}
						tempLosesAgainst = cell;
					}
					LogDebug(`RockPaperScissors Command > cell: ${cell}`); // DEBUG
					LogDebug(`RockPaperScissors Command > the cell is of type ${typeof cell}`); // DEBUG
					LogDebug(`RockPaperScissors Command > the temp counter is ${tempCounter}`); // DEBUG
					tempCounter++;
				}
				if (tempWinsAgainst == tempLosesAgainst && tempWinsAgainst != "") {
					LogError(`RPS Error - Invalid CSV Format. ${tempName} both wins against ${tempWinsAgainst}, but also loses against ${tempLosesAgainst}.
					RPS custom options will not work!`);
					customOptionsDisabled = true;
				} else if (
					(tempWinsAgainst == "everything" && tempLosesAgainst != "nothing") ||
					(tempWinsAgainst == "nothing" && tempLosesAgainst != "everything")
				) {
					LogError(`RPS Error - Invalid CSV Format. ${tempName} wins against ${tempWinsAgainst}, but the opposite is ${tempLosesAgainst}.
					If everything or nothing is used for one option, the opposite must be used for the other option. So, if the bot wins against 
					everything, it must lose against specifically nothing, and vice versa. RPS custom options will not work!`);
				}
				customOptions.push({
					name: tempName,
					winsAgainst: tempWinsAgainst,
					losesAgainst: tempLosesAgainst,
				});
			}

			file.close();
		}

		const botChoice = DetermineBotChoice(RandomNumber(1, 3)!);
		let winner = "";
		if (userChoice.length == 0 || !["rock", "paper", "scissors"].includes(userChoice)) {
			await ctx.message.reply(
				new Embed({
					title: "Error!",
					description: "Please make a choice between rock, paper, and scissors.",
					color: 0xff0000,
				})
			);
			return;
		}

		// await ctx.message.reply(`user: ${userChoice}\nbot: ${botChoice}`); // DEBUG
		LogDebug(`RockPaperScissorsCommand > userChoice: ${userChoice} | botChoice: ${botChoice}`);
		if (userChoice == botChoice) {
			winner = "tie";
		}
		else if (userChoice == "rock" && botChoice == "paper" ||
				userChoice == "paper" && botChoice == "scissors" || 
				userChoice == "scissors" && botChoice == "rock" )
			{
				winner = "bot"
			}
		else if (userChoice == "rock" && botChoice == "scissors" || 
				userChoice == "paper" && botChoice == "rock" || 
				userChoice == "scissors" && botChoice == "paper")
			{
				winner == "user"
			}
		// if (userChoice == botChoice) {
		// 	winner = "tie";
		// } else if (userChoice == "rock") {
		// 	if (botChoice == "paper") {
		// 		winner = "bot";
		// 	} else if (botChoice == "scissors") {
		// 		winner = "user";
		// 	}
		// } else if (userChoice == "paper") {
		// 	if (botChoice == "rock") {
		// 		winner = "user";
		// 	} else if (botChoice == "scissors") {
		// 		winner = "bot";
		// 	}
		// } else if (userChoice == "scissors") {
		// 	if (botChoice == "rock") {
		// 		winner = "bot";
		// 	} else if (botChoice == "paper") {
		// 		winner = "user";
		// 	}
		// }
		 else if (!customOptionsDisabled) {
			let customOptionFound = false;
			let customOption: any;
			for (const optionIndex in customOptions) {
				const optionIndexNum = Number(optionIndex);
				if (customOptions[optionIndexNum].name == userChoice) {
					customOptionFound = true;
					customOption = customOptions[optionIndexNum];
					break;
				}
			}
			if (customOptionFound && !customOptionsDisabled) {
				if (customOption.losesAgainst == botChoice || customOption.losesAgainst == "everything") {
					winner = "bot";
				} else if (customOption.winsAgainst == botChoice || customOption.winsAgainst == "everything") {
					winner = "user";
				} else {
					winner = "tie";
				}
			} else {
				await ctx.message.reply(
					new Embed({
						title: "Error!",
						description: "Please make a choice between rock, paper, and scissors.",
						color: 0xff0000,
					}),
					{
						allowedMentions: {
							replied_user: true,
							roles: [],
						},
					}
				);
				return;
			}
		}
		if (winner == "bot") {
			await ctx.message.reply(
				new Embed({
					title: "I Win!",
					description: `You picked ${userChoice}. I picked ${botChoice}. I win!`,
				}),
				{
					allowedMentions: {
						replied_user: true,
						roles: [],
					},
				}
			);
		} else if (winner == "user") {
			await ctx.message.reply(
				new Embed({
					title: "You Win!",
					description: `You picked ${userChoice}. I picked ${botChoice}. You win!`,
				}),
				{
					allowedMentions: {
						replied_user: true,
						roles: [],
					},
				}
			);
		} else if (winner == "tie") {
			await ctx.message.reply(
				new Embed({
					title: "Tie!",
					description: `You picked ${userChoice}. I also picked ${botChoice}. We tied!`,
				})
			),
				{
					allowedMentions: {
						replied_user: true,
						roles: [],
					},
				};
		} else {
			await ctx.message.reply(
				new Embed({
					title: "Error!",
					description: `An unexpected error has occured. Please contact the developer.\n**winner:** \`${winner}\`\n**userChoice:** \`${userChoice}\`\n**botChoice:** \`${botChoice}\`\n**customOptionsDisabled:** \`${customOptionsDisabled}\`\n`,
					color: 0xff0000,
				})
			);
		}
	}
}

class SayCommand extends Command {
	name = "say";
	aliases = ["echo"];
	description = "Makes the bot say something. Owner only.\n**Syntax:** `say <thing to say>`";
	ownerOnly = true;

	async execute(ctx: CommandContext) {
		LogDebug(`The SayCommand command has begun execution! (Command Author ID: ${ctx.author.id})`);
		await ctx.message.channel.send(`${ctx.argString}`);
	}
}

class SendEmbedCommand extends Command {
	name = "sendembed";
	aliases = ["embedsend"];
	description =
		"Makes the bot send an embed. Owner only.\n**Syntax:** `sendembed <channel> <title, ending before a newline> <description, beginning with a newline>`";
	ownerOnly = true;

	async execute(ctx: CommandContext) {
		LogDebug(`The SendEmbedCommand command has begun execution! (Command Author ID: ${ctx.author.id})`);
		// const channelArg = ctx.argString.split(" ")[0]; // DEBUG
		const channel = ctx.message.mentions.channels.first();
		const cmdArgs: string = ctx.argString.split(" ").splice(1).join(" ");
		LogDebug(`SendEmbedCommand > cmdArgs: ${cmdArgs}`); // DEBUG
		const title = cmdArgs.split("\n")[0];
		LogDebug("SendEmbedCommand > A"); // DEBUG
		console.log(title);
		LogDebug("SendEmbedCommand > B"); // DEBUG
		const description = cmdArgs.split("\n")[1];
		await channel!.send(
			new Embed({
				title: title,
				description: description,
			})
		);
	}
}

class UserInfoCommand extends Command {
	// FIXME: Members who are not in the guild might not able to be fetched
	// This is indeed the case. ^
	name = "userinfo";
	aliases = ["ui", "whois", "about", "aboutuser"];
	description = "Lets you get information about a user.\n**Syntax:** `userinfo <user>`";

	async execute(ctx: CommandContext) {
		LogDebug(`The UserInfoCommand command has begun execution! (Command Author ID: ${ctx.author.id})`);
		try {
			user = await ctx.guild!.members.fetch(ctx.argString.split(" ")[0]);
		} catch {
			// await ctx.message.reply(`${e}`) // TODO: Add to logging
		}
		// console.log("start"); // DEBUG
		// console.log(user); // DEBUG

		if (ctx.argString == "") {
			LogDebug(`UserInfoCommand > ctx.argString is equal to "" (ctx.argString == "")`)
			user = await ctx.guild!.members.fetch(ctx.author.id);
		} else if (ctx.message.mentions.users.first() == undefined) {
			LogDebug(`UserInfoCommand > This condition is true: ctx.message.mentions.users.first() == undefined`)
			if (ctx.argString.split(" ")[0].length > 1) {
				LogDebug(`UserInfoCommand > Within the previous condition, this condition is true: ctx.argString.split(" ")[0].length > 1`)
				LogDebug(`UserInfoCommand > ctx.argString.split(" ")[0].length > 1 - True // Argument: ${ctx.argString.split(" ")[0]} // Length: ${ctx.argString.split(" ")[0].length}`)
				var user = (await ctx.guild!.members.resolve(ctx.argString.split(" ")[0]))!;
				if (user == undefined) {
					await ctx.message.reply(
						new Embed({
							title: "Error",
							description: "The user could not be found. Please make sure you are providing the right user.",
							color: 0xff0000,
						})
					);
				}
			}
		} else if (isString(ctx.message.mentions.users.first()!.username)) {
			LogDebug(`SendEmbedCommand > ctx.message.mentions.users.first()!.username is a string, is returned true.`) // DEBUG
			user = await ctx.guild!.members.fetch(ctx.message.mentions.users.first()!.id);
			LogDebug("SendEmbedCommand > next") // DEBUG
			LogDebug(`SendEmbedCommand > user: ${user}`) // DEBUG
		}
		LogDebug("SendEmbedCommand > now mentions") // DEBUG
		LogDebug(`SendEmbedCommand > first message mention: ${ctx.message.mentions.users.first()}`) // DEBUG
		LogDebug(`SendEmbedCommand > typeof = ${typeof(ctx.message.mentions.users.first())}`) // DEBUG

		LogDebug(`SendEmbedCommand > user id: ${user!.id}`); // DEBUG
		LogDebug(`SendEmbedCommand > typeof user: \n${typeof(user!)}`); // DEBUG
		const serverJoinDate = `<t:${(new Date(user!.joinedAt).getTime() / 1000).toFixed(0)}:F>`;
		const userJoinDate = `<t:${(new Date(user!.timestamp).getTime() / 1000).toFixed(0)}:F>`;
		const userStatus = (await ctx.guild!.presences.fetch(user!.id))!.status;

		LogDebug(`SendEmbedCommand > \n\n\n\n\n\n\n\n\n\n${user!.user}\n\n${user!}\n\n${user!.user.id}\n\n${user!.user.tag}\n\n\n`) // DEBUG
		LogDebug(`SendEmbedCommand > \n\n\nnow the user\n\n${user!}\ntypeof = ${typeof(user!)}\n\n`) // DEBUG

		// if (user!.user.username == undefined) {
		// await ctx.message.reply(`user.user == undefined (double equals)\n value: ${user!.user.username}`)
		// } // DEBUG

		await ctx.message.reply(
			new Embed({
				title: `${user!.user.username}#${user!.user.discriminator}`,
				description: `Information about ${user!.user.mention}:`,
				thumbnail: {
					url: user!.user.avatarURL("png"),
				},
				fields: [
					{
						name: "User ID:",
						value: `${user!.user.id}`,
						inline: true,
					},
					{
						name: "Account Created:",
						value: `${userJoinDate}`,
						inline: true,
					},
					{
						name: "Joined Server:",
						value: `${serverJoinDate}`,
						inline: true,
					},
					{
						name: "Status",
						value: `${userStatus[0].toUpperCase()}${userStatus.slice(1)}`,
						inline: true,
					},
				],
			}),
			{
				allowedMentions: {
					replied_user: true,
					roles: [],
				},
			}
		);
	}
}

class EvalCommand extends Command {
	name = "eval";
	description = "Lets you run TypeScript code with the bot. Owner only.\n**Syntax:** `eval <code to evaluate>`";
	ownerOnly = true;

	async execute(ctx: CommandContext) {
		LogDebug(`The EvalCommand has begun execution! (Command Author ID: ${ctx.author.id})`);
		console.log(`\n\n*****\nExecuting Eval Code!\n\nCommand Executed By: ${ctx.author}\nExecuting: ${ctx.argString}\n*****\n\n`);
		if (developerMode) {
			SendEmbed(
				evalLoggingChannel!,
				"Executing Eval Command (Dev)",
				`**Author:** ${ctx.author} (**User:** \`${ctx.author.tag}\` // **User ID:** \`${ctx.author.id}\`\n**Code:**\n\`\`\`js\n${ctx.argString}\n\`\`\``,
				0x0000ff
			);
		}
		else {
			SendEmbed(
				evalLoggingChannel!,
				"Executing Eval Command",
				`**Author:** ${ctx.author} (**User:** \`${ctx.author.tag}\` // **User ID:** \`${ctx.author.id}\`\n**Code:**\n\`\`\`js\n${ctx.argString}\n\`\`\``,
				0x0000ff
			);
		}
		try {
			const evaluatedCode = eval(ctx.argString.replace("```js", "").replace("```", ""));
			await ctx.message.reply(
				new Embed({
					title: "Output",
					description: `\`\`\`${evaluatedCode}\`\`\``,
					color: 0x00ff00,
				})
			);
			if (developerMode) {
				SendEmbed(
					evalLoggingChannel!,
					"Executed Eval Command (Dev)",
					`**Author:** ${ctx.author} (**User:** \`${ctx.author.tag}\` // **User ID:** \`${ctx.author.id}\`\n\n**Output:**\n\`\`\`js\n${evaluatedCode}\n\`\`\`\n**Code:**\n\`\`\`js\n${ctx.argString}\n\`\`\``,
					0x00ff00
				);
			}
			else {
				SendEmbed(
					evalLoggingChannel!,
					"Executed Eval Command",
					`**Author:** ${ctx.author} (**User:** \`${ctx.author.tag}\` // **User ID:** \`${ctx.author.id}\`\n\n**Output:**\n\`\`\`js\n${evaluatedCode}\n\`\`\`\n**Code:**\n\`\`\`js\n${ctx.argString}\n\`\`\``,
					0x00ff00
				);
			}
		} catch (err) {
			await ctx.message.reply(
				new Embed({
					title: "Error",
					description: `\`\`\`${err}\`\`\``,
					color: 0xff0000,
				})
			);
			if (developerMode) {
				SendEmbed(
					evalLoggingChannel!,
					"Eval Command Error (Dev)",
					`Error Executing Code!\n**Author:** \`${ctx.author}\`\n**Error:** \`\`\`js\n${err}\n\`\`\``,
					0xff0000
				);
			}
			else {
				SendEmbed(
					evalLoggingChannel!,
					"Eval Command Error",
					`Error Executing Code!\n**Author:** \`${ctx.author}\`\n**Error:** \`\`\`js\n${err}\n\`\`\``,
					0xff0000
				);
			}
		}
	}
}

class AwaitEvalCommand extends Command {
	name = "aval";
	description = "Lets you run awaited TypeScript code with the bot. Owner only.\n**Syntax:** `aval <code to evaluate>`";
	ownerOnly = true;

	async execute(ctx: CommandContext) {
		LogDebug(`The Aval command has begun execution! (Command Author ID: ${ctx.author.id})`);
		console.log(`\n\n*****\nExecuting Aval Code!\n\nCommand Executed By: ${ctx.author}\nExecuting: ${ctx.argString}\n*****\n\n`);
		if (developerMode) {
			SendEmbed(
				evalLoggingChannel!,
				"Executing Aval Command (Dev)",
				`**Author:** ${ctx.author} (**User:** \`${ctx.author.tag}\` // **User ID:** \`${ctx.author.id}\`\n**Code:**\n\`\`\`js\n${ctx.argString}\n\`\`\``,
				0x0000ff
			);
		}
		else {
			SendEmbed(
				evalLoggingChannel!,
				"Executing Aval Command",
				`**Author:** ${ctx.author} (**User:** \`${ctx.author.tag}\` // **User ID:** \`${ctx.author.id}\`\n**Code:**\n\`\`\`js\n${ctx.argString}\n\`\`\``,
				0x0000ff
			);
		}

		try {
			const evaluatedCode = await eval(ctx.argString.replace("```js", "").replace("```", ""));
			await ctx.message.reply(
				new Embed({
					title: "Output",
					description: `\`\`\`${evaluatedCode}\`\`\``,
					color: 0x00ff00,
				})
			);
			if (developerMode) {
				SendEmbed(
					evalLoggingChannel!,
					"Executed Aval Command (Dev)",
					`**Author:** ${ctx.author} (**User:** \`${ctx.author.tag}\` // **User ID:** \`${ctx.author.id}\`\n\n**Output:**\n\`\`\`js\n${evaluatedCode}\n\`\`\`\n**Code:**\n\`\`\`js\n${ctx.argString}\n\`\`\``,
					0x00ff00
				);
			}
			else {
				SendEmbed(
					evalLoggingChannel!,
					"Executed Aval Command",
					`**Author:** ${ctx.author} (**User:** \`${ctx.author.tag}\` // **User ID:** \`${ctx.author.id}\`\n\n**Output:**\n\`\`\`js\n${evaluatedCode}\n\`\`\`\n**Code:**\n\`\`\`js\n${ctx.argString}\n\`\`\``,
					0x00ff00
				);
			}
		} catch (err) {
			await ctx.message.reply(
				new Embed({
					title: "Error",
					description: `\`\`\`${err}\`\`\``,
					color: 0xff0000,
				})
			);
			if (developerMode) {
				SendEmbed(
					evalLoggingChannel!,
					"Eval Command Error (Dev)",
					`Error Executing Code!\n**Author:** \`${ctx.author}\`\n**Error:** \`\`\`js\n${err}\n\`\`\``,
					0xff0000
				);
			}
			else {
				SendEmbed(
					evalLoggingChannel!,
					"Eval Command Error",
					`Error Executing Code!\n**Author:** \`${ctx.author}\`\n**Error:** \`\`\`js\n${err}\n\`\`\``,
					0xff0000
				);
			}
		}
	}
}

class CoinflipCommand extends Command {
	name = "coinflip";
	description = "Chooses between heads and tails.\n**Syntax:** `coinflip`";
	aliases = ["flipcoin", "iamtryingtoresolveadebateaboutsomethingwithafriend"];

	async execute(ctx: CommandContext) {
		LogDebug(`The CoinflipCommand has begun execution! (Command Author ID: ${ctx.author.id})`);
		const result = RandomNumber(1, 2);

		result == 1
			? await ctx.message.reply(new Embed({ title: "Heads!", description: "The result is heads." }))
			: await ctx.message.reply(new Embed({ title: "Tails!", description: "The result is tails." }));
	}
}

class TopicCommand extends Command {
	name = "topic";
	aliases = ["generatetopic", "gentopic", "topicgenerate", "topicgen", "topicidea"];
	description = "Picks a topic from a list of topics that T_nology has created.\n**Syntax:** `topic`";

	async execute(ctx: CommandContext) {
		LogDebug(`The TopicCommand has begun execution! (Command Author ID: ${ctx.author.id})`);
		const pickedTopic = topicArray[RandomNumber(0, topicArray.length - 1)!];

		await ctx.message.reply(
			new Embed({
				title: "Topic",
				description: `${pickedTopic}`,
			})
		);
	}
}

class PingCommand extends Command {
	name = "ping";
	aliases = ["pong", "latency"];
	description = "Gets the latency of the bot.\n**Syntax:** `ping`";

	async execute(ctx: CommandContext) {
		LogDebug(`The PingCommand has begun execution! (Command Author ID: ${ctx.author.id})`);
		const messageCreatedTime = new Date();
		await ctx.message.reply(
			new Embed({
				title: "🏓 **Pong!**",
				description: `**Ping:** \`${Date.now() - messageCreatedTime.getTime()}\` ms\n**Websocket/Gateway Ping:** \`${
					ctx.message.client.gateway.ping
				}\``,
			})
		);
	}
}

class RandomNumberCommand extends Command {
	name = "randomnumber";
	aliases = ["rng", "choosenumber"];
	description = "Chooses a number between the two parameters provided.\n**Syntax:** `randomnumber <minimum> <maximum>`";

	async execute(ctx: CommandContext) {
		LogDebug(`The RandomNumberCommand has begun execution! (Command Author ID: ${ctx.author.id})`);
		const lNum = Number(ctx.argString.split(" ")![0]);
		const hNum = Number(ctx.argString.split(" ")[1]);
		if (isNaN(lNum) || isNaN(hNum)) {
			await ctx.message.reply(
				new Embed({
					title: "Error!",
					description: `Please enter two numbers.`,
					color: 0xff0000,
				})
			);
			return;
		}

		let randomNumber = RandomNumber(lNum, hNum, ctx.channel.id);

		if (randomNumber < 0) {
			return;
		}

		await ctx.message.reply(
			new Embed({
				title: "Random Number",
				description: `I picked a number between ${lNum} and ${hNum}. The result is ${randomNumber}`,
			})
		);
	}
}

class RemindmeCommand extends Command {
	name = "remindme";
	aliases = ["setreminder", "reminderset"];
	description = "Sets a reminder for you.\n**Syntax:** `remindme <timestamp> <reason>`";

	async execute(ctx: CommandContext) {
		LogDebug(`The RemindmeCommand has begun execution! (Command Author ID: ${ctx.author.id})`);
		const preTimestamp = Math.floor(Date.now() / 1000);
		const userTimestamp = ctx.argString.split(" ")[0];
		const reason = ctx.argString.split(" ").slice(1).join(" ");
		const currentReminderId = reminders.id;

		if (userTimestamp == "") {
			await ctx.message.reply(
				new Embed({
					title: "Error",
					description: "Please enter a valid timestamp (e.g. 1h5s)",
					color: 0xff0000,
				})
			);
			return;
		} else if (reason == undefined) {
			await ctx.message.reply(
				new Embed({
					title: "Error",
					description: "Please enter a valid reason",
					color: 0xff0000,
				})
			);
			return;
		}

		let seconds = 0;
		let minutes = 0;
		let hours = 0;
		let days = 0;

		// Note: I honestly don't see why being able to use a timestamp like "1d1d" would hurt.

		let temporaryNumber = "0";

		LogDebug(`RemindmeCommand > userTimestamp.length: ${userTimestamp.length}`) // DEBUG
		LogDebug(`RemindmeCommand > whether or not userTimestamp.length < 0: ${userTimestamp.length < 0}`) // DEBUG

		const letterArray = ["s", "m", "h", "d"];

		for (let index = 0; userTimestamp.length > index; index++) {
			LogDebug(`RemindmeCommand > We are currently at index ${index} - The character is ${ctx.argString[index]}`) // DEBUG
			if (!letterArray.includes(userTimestamp[index])) {
				LogDebug(`RemindmeCommand > Not equals, ${userTimestamp[index]} @ index ${index}`) // DEBUG
				temporaryNumber += userTimestamp[index];
			}
			if (userTimestamp[index] == "s") {
				seconds += 1 * Number(temporaryNumber);
				temporaryNumber = "0";
			} else if (userTimestamp[index] == "m") {
				minutes += 60 * Number(temporaryNumber);
				temporaryNumber = "0";
			} else if (userTimestamp[index] == "h") {
				hours += 3600 * Number(temporaryNumber);
				temporaryNumber = "0";
			} else if (userTimestamp[index] == "d") {
				LogDebug(`RemindmeCommand > temporaryNumber: ${temporaryNumber}`) // DEBUG
				LogDebug(`RemindmeCommand > Number(temporaryNumber): ${Number(temporaryNumber)}`) // DEBUG
				days += 86400 * Number(temporaryNumber);
				LogDebug(`RemindmeCommand > days: ${days}`) // DEBUG
				temporaryNumber = "0";
			}
		}

		const timestamp = preTimestamp + seconds + minutes + hours + days;

		reminders.reminders[currentReminderId + 1] = {
			UserId: ctx.author.id,
			Timestamp: timestamp,
			Reason: reason,
			Expired: false,
			ChannelId: ctx.channel.id,
		};

		LogDebug(`RemindmeCommand > reminders.reminders[(currentReminderId + 1)]: ${reminders.reminders[(currentReminderId + 1)]}`) // DEBUG

		reminders.id += 1;

		Deno.writeTextFile("./reminders.json", JSON.stringify(reminders));

		await ctx.message
			.reply(
				new Embed({
					title: "Reminder Set!",
					description: `You will be reminded at <t:${timestamp}:F> (<t:${timestamp}:R>)\n**Reason:** \`${reason}\`\n**Reminder ID:** \`${reminders.id}\``,
					color: 0x00ff00,
				})
			)
			.catch(() => {
				try {
					ctx.message.addReaction("❗");
				} catch {
					console.log("nope");
				}
			});
	}
}

class CancelReminderCommand extends Command {
	name = "cancelreminder";
	aliases = ["remindercancel"];
	description = "Cancels a reminder.\n**Syntax:** `cancelreminder <reminder id>`";

	async execute(ctx: CommandContext) {
		LogDebug(`The CancelReminderCommand has begun execution! (Command Author ID: ${ctx.author.id})`);
		const userReminder = ctx.argString.split(" ")[0];

		if (userReminder == "") {
			await ctx.message.reply(
				new Embed({
					title: "Error",
					description: "Please provide a valid Reminder ID!",
					color: 0xff0000,
				})
			);
			return;
		}

		try {
			if (reminders.reminders[userReminder].UserId != ctx.author.id) {
				await ctx.message.reply(
					new Embed({
						title: "Error",
						description: "Please provide a valid Reminder ID! Make sure this Reminder ID belongs to you if it exists",
						color: 0xff0000,
					})
				);
				return;
			} else if (reminders.reminders[userReminder].expired) {
				await ctx.message.reply(
					new Embed({
						title: "Error",
						description: "That reminder has already expired!",
						color: 0xff0000,
					})
				);
				return;
			}
		} catch (error) {
			if (error.message.includes("Cannot read properties of undefined")) {
				await ctx.message.reply(
					new Embed({
						title: "Error",
						description: "Please provide a valid Reminder ID!",
						color: 0xff0000,
					})
				);
				return;
			} else {
				throw error;
			}
		}

		reminders.reminders[userReminder].expired = true;
		Deno.writeTextFile("./reminders.json", JSON.stringify(reminders));
		await ctx.message.reply(
			new Embed({
				title: "Success",
				description: `The reminder with the ID of **${userReminder}** has been cancelled.`,
				color: 0x00ff00,
			})
		);
	}
}

class ListRemindersCommand extends Command {
	name = "listreminders";
	aliases = ["listreminder", "reminderlist", "reminderslist"];
	description = "Lists current reminders\n**Syntax:** `listreminders`";

	async execute(ctx: CommandContext) {
		LogDebug(`The ListRemindersCommand has begun execution! (Command Author ID: ${ctx.author.id})`);
		const unslicedUserReminders = [];
		let userPage = Number(ctx.argString.split(" ")[0]);

		if (!isNumber(Number(userPage)) || userPage < 0) {
			await ctx.message.reply(
				new Embed({
					title: "Error",
					description: "Please enter a valid page number!",
					color: 0xff0000,
				})
			);
			return;
		} else if (userPage == 0) {
			userPage = 1;
		}

		for (const reminder in reminders.reminders) {
			// console.log(reminders.reminders[reminder]); // DEBUG
			if (reminders.reminders[reminder].UserId == ctx.author.id) {
				unslicedUserReminders.push([
					`**Reminder ID:** ${reminder}`,
					`**Time:** <t:${reminders.reminders[reminder].Timestamp}:F>`,
					`**Reason:** ${reminders.reminders[reminder].Reason}`,
				]);
			}
		}

		const maxReminderPage = Math.ceil(unslicedUserReminders.length / 5);

		if (userPage > maxReminderPage) {
			await ctx.message.reply(
				new Embed({
					title: "Error",
					description: `Please enter a valid page! Valid pages are from 1 to ${maxReminderPage}`,
					color: 0xff0000,
				})
			);
			return;
		}

		const arrayIndexStart = Number(userPage) * 5 - 5;
		const arrayIndexEnd = Number(userPage) * 5 - 1;

		const userReminders = unslicedUserReminders.slice(arrayIndexStart, arrayIndexEnd);

		let reminderString = "Here is a list of your reminders: \n";

		for (let i = 0; i < userReminders.length; i++) {
			reminderString += `\n${userReminders[i][0]}\n${userReminders[i][1]}\n${userReminders[i][2]}\n`;
		}

		await ctx.message.reply(
			new Embed({
				title: "Reminders",
				description: reminderString,
				color: 0x00ff00,
				footer: {
					text: `Page ${userPage}/${maxReminderPage}`,
				},
			})
		);
	}
}

class TimestampCommand extends Command {
	name = "timestamp";
	aliases = ["timestampgen", "gentimestamp", "generatetimestamp"];
	description = "Generates a timestamp based on the input provided.\n**Syntax:** `timestamp <timestamp>`";

	async execute(ctx: CommandContext) {
		LogDebug(`The TimestampCommand has begun execution! (Command Author ID: ${ctx.author.id})`);
		const userTimestamp = ctx.argString.split(" ")[0];
		const preTimestamp = Math.floor(Date.now() / 1000);

		let temporaryNumber = "0";

		LogDebug(`TimestampCommand > userTimestamp.length: ${userTimestamp.length}`) // DEBUG
		LogDebug(`TimestampCommand > userTimestamp.length < 0: ${userTimestamp.length < 0}`) // DEBUG

		let seconds = 0;
		let minutes = 0;
		let hours = 0;
		let days = 0;

		const letterArray = ["s", "m", "h", "d"];

		for (let index = 0; userTimestamp.length > index; index++) {
			LogDebug(`TimestampCommand > We are currently at index ${index} - The character is ${ctx.argString[index]}`) // DEBUG
			if (!letterArray.includes(userTimestamp[index])) {
				LogDebug(`TimestampCommand > Not equals, ${userTimestamp[index]} @ index ${index}`) // DEBUG
				temporaryNumber += userTimestamp[index];
			}
			if (userTimestamp[index] == "s") {
				seconds += 1 * Number(temporaryNumber);
				temporaryNumber = "0";
			} else if (userTimestamp[index] == "m") {
				minutes += 60 * Number(temporaryNumber);
				temporaryNumber = "0";
			} else if (userTimestamp[index] == "h") {
				hours += 3600 * Number(temporaryNumber);
				temporaryNumber = "0";
			} else if (userTimestamp[index] == "d") {
				LogDebug(`TimestampCommand > temporaryNumber: ${temporaryNumber}`) // DEBUG
				LogDebug(`TimestampCommand > Number(temporaryNumber): ${Number(temporaryNumber)}`) // DEBUG
				days += 86400 * Number(temporaryNumber);
				LogDebug(`TimestampCommand > days: ${days}`) // DEBUG
				temporaryNumber = "0";
			}
		}

		const timestamp = preTimestamp + seconds + minutes + hours + days;

		if (isNaN(timestamp)) {
			await ctx.message.reply(
				new Embed({
					title: "Error",
					description: "Please enter a valid timestamp! (Examples: `30m` or `1h`) ",
				})
			);
			return;
		}

		await ctx.message.reply(
			new Embed({
				title: "Result",
				description: `<t:${timestamp}:d> \`<t:${timestamp}:d\`
<t:${timestamp}:D> \`<t:${timestamp}:D>\`
<t:${timestamp}:t> \`<t:${timestamp}:t>\`
<t:${timestamp}:T> \`<t:${timestamp}:T>\`
<t:${timestamp}:f> \`<t:${timestamp}:f>\`
<t:${timestamp}:F> \`<t:${timestamp}:F>\`
<t:${timestamp}:R> \`<t:${timestamp}:R>\`
				`,
				color: 0x00ff00,
			})
		);
	}
}

class SuCommand extends Command {
	name = "su";
	aliases = ["runas"];
	description = "Runs a command as another user. Owner only.\n**Syntax:** `su <user mention> <command>`";
	ownerOnly = true;

	async execute(ctx: CommandContext) {
		LogDebug(`The SuCommand has begun execution! (Command Author ID: ${ctx.author.id})`);
		const user: string = ctx.argString.split(" ")[0];
		const command: string = ctx.argString.split(" ")[1];
		const commandArgs: string = ctx.argString.split(" ").slice(2).join(" ");
		console.log(commandArgs);

		ctx.author = (await bot.users.get(user))!;
		ctx.argString = commandArgs;

		bot.commands.find(command)!.execute(ctx);
	}
}

class VersionCommand extends Command {
	name = "version";
	description = "Gets the version of the bot.\n**Syntax:** `version`";

	async execute(ctx: CommandContext) {
		LogDebug(`The VersionCommand has begun execution! (Command Author ID: ${ctx.author.id})`);
		await ctx.message.reply(
			new Embed({
				title: "Version",
				description: `The description of the bot is version ${version}.`,
				color: 0x00ff00,
			})
		);
	}
}

class SendWebhookCommand extends Command {
	name = "sendwebhook";
	aliases = ["webhook", "createwebhook"];
	ownerOnly = true;

	async execute(ctx: CommandContext) {
		LogDebug(`The SendWebhookCommand has begun execution! (Command Author ID: ${ctx.author.id})`);
		const avatarURL = ctx.argString.split("\n")[0];
		const channelArg = ctx.argString.split("\n")[1];
		const name = ctx.argString.split("\n")[2];
		let message = ctx.argString.split("\n")[3];
		LogDebug(`SendWebhookCommand > 1`);
		LogDebug(`SendWebhookCommand > channelArg: ${channelArg}`);

		let undefinedError: string | undefined;

		if (name == undefined) {
			undefinedError = "Please enter a message to be sent!";
		} else if (message == undefined) {
			undefinedError = "Please enter a name to use for the webhook!"
		}

		if (undefinedError != undefined) {
			await ctx.message.reply(new Embed({
				title: "Webhook Error",
				description: undefinedError,
				color: 0xFF0000,
			}));
			return;
		}

		try {
			message = message.trim()
		}
		catch (error) {
			if (error.message.includes("Cannot read properties of undefined (reading 'trim')")) {
				await ctx.message.reply(new Embed({
					title: "Webhook Error",
					description: `An unexpected error has occurred.\n**Likely Cause of Error:** Entering an undefined message. Make sure you provide a message for the webhook to be sent!\n**For Developers:**\n\`\`\`js\n${error}\n\`\`\``,
					color: 0xFF0000,
				}))
			}
		}

		let channel;

		try { // FIXME: TEMPORARY CHECKPOINT: I put the error handling in the wrong spot but I have to go now
			channel = (await ctx.guild?.channels.fetch(ctx.channel.id)) as TextChannel;
		}
		catch (error) {
			if (error.message.includes("NUMBER_TYPE_COERCE: Value") && error.message.includes("is not a snowflake")) {
				await ctx.message.reply(new Embed({
					title: "Webhook Error",
					description: "Please provide a valid channel to send a webhook in!",
					color: 0xFF0000,
				}))
			}
		}

		LogDebug(`SendWebhookCommand > channelArg[0]: ${channelArg[0]}`)
		LogDebug(`SendWebhookCommand > channelArg[1]: ${channelArg[1]}`)
		LogDebug(`SendWebhookCommand > channelArg[channelARg.length - 1]: ${channelArg[channelArg.length - 1]}`)

		if (channelArg[0] == "<" && channelArg[1] == "#" && channelArg[channelArg.length - 1] == ">") {
			LogDebug("SendWebhookCommand > 1.1")
			channel = (await ctx.guild?.channels.fetch(channelArg.slice(2, channelArg.length - 1))) as TextChannel;
		} else {
			LogDebug("SendWebhookCommand > 1.2")
			channel = (await ctx.guild?.channels.fetch(channelArg)) as TextChannel;
		}

		LogDebug(`SendWebhookCommand > 2`);

		// const webhooks = await channel!.fetchWebhooks();
		// let webhook: Webhook | undefined = undefined;

		const webhooks = (await channel!.fetchWebhooks());
		const webhook = webhooks.find(
			(hook: Webhook) => {hook?.token != undefined} // Credit to @Blocksnmore (Bloxs) for the code
		)

		LogDebug("SendWebhookCommand > 2.1")
		let createdWebhook: Webhook;

		const avatar = encode(new Uint8Array(await (await fetch(avatarURL)).arrayBuffer()));

		LogDebug("SendWebhookCommand > 3");

		if (webhook == undefined && avatarURL == "default") {
			createdWebhook = await Webhook.create(channel, bot, {
				name: name,
			});
			// console.log(4);
		} else if (webhook == undefined) {
			createdWebhook = await Webhook.create(channel, bot, {
				name: name,
				avatar: `data:image/png;base64,${avatar}`,
			});
			// console.log(5);
		} else {
			createdWebhook = webhook;
			// console.log(6);
		}

		createdWebhook.send(message);
		// console.log(7);
	}
}

class DiceCommand extends Command {
	name = "dice";
	aliases = ["rolldice", "roll"];
	description = "Rolls X amount of dice of Y sides.\n**Syntax:** `dice <Number of Dice>d<Number of Sides>`\n**Example:** `dice 2d6` (Rolls 2 dice with 6 sides)\n**Example 2:** `dice 2d6,2d4` (Rolls 2 dice with 6 sides, 2 dice with 4 sides)"

	async execute(ctx: CommandContext) {
		LogDebug(`The DiceCommand has begun execution! (Command Author ID: ${ctx.author.id})`);
		const diceSets = ctx.argString.split(","); // FIXME: What if there's no commas? Figure this out please.
		LogDebug(`DiceCommand > diceSets is: ${diceSets}\ndiceSets joined: ${diceSets.join(", ")}\n`); // DEBUG

		const finalSetsArray: any = []

		for (const setIndex in diceSets) {
			const set = diceSets[setIndex];
			LogDebug(`DiceCommand > We are in the first for loop (const set in diceSets) - set is: ${set}\n`); // DEBUG

			let setArray = set.split(""); // This takes the set and split each character into an array
			LogDebug(`DiceCommand > setArray is equal to: ${setArray}`) // DEBUG
			
			let tempNumberOfDice = "";
			let tempSides = ""; // This will be used after tempArray to determine the number of sides of the dice
			let tempFinalArray: any = [] // This will be merged with the tempNumberofDice so the final array is:
			// [
			// 6, 4
			//]
			let reachedNumber = false;
			for (const charIndex in setArray) {
				const char = setArray[charIndex]
				if (!reachedNumber && Number.isInteger(Number(char))) {
					LogDebug(`DiceCommand > First if statement in the nested for loop. The char is: ${char}\n`); // DEBUG
					tempNumberOfDice += char;
				}
				else if (!reachedNumber && char == "d") {
					LogDebug(`DiceCommand > We've reached the number. The char is: ${char}\nThe tempNumberOfDice is: ${tempNumberOfDice}\n`); // DEBUG
					tempFinalArray.push(Number(tempNumberOfDice))
					reachedNumber = true;
				}
				else if (reachedNumber) {
					LogDebug(`DiceCommand > We are in the reachedNumber else if statement. The char is: ${char}`) ;// DEBUG
					tempSides += char;
				}
				else {
					LogError(`DiceCommand Error!\nreachedNumber: ${reachedNumber}\ntempNumberOfDice: ${tempNumberOfDice}\ntempSides: ${tempSides}\ntempFinalArray: ${tempFinalArray}\nsetArray: ${setArray}`)
				}
			}
			LogDebug(`DiceCommand > We have exited the nested for loop. The tempFinalArray is: ${tempFinalArray}\nThe tempSides is: ${tempSides}\n`); // DEBUG
			tempFinalArray.push(Number(tempSides));
			finalSetsArray.push(tempFinalArray);
			LogDebug(`DiceCommand > We have just pushed tempFinalArray to setsArray. The setsArray is: ${finalSetsArray}\n`); // DEBUG
		}

		let finalResult = ""

		for (const diceSetIndex in finalSetsArray) {
			const diceSet = finalSetsArray[diceSetIndex];
			LogDebug(`DiceCommand > We are now iterating for const diceSet in setsArray. diceSet is: ${diceSet} // setsArray is: ${finalSetsArray}\n`) // DEBUG
			let diceResult: any = [];
			for (let i = 0; i < Number(diceSet[1]); i++) {
				LogDebug(`DiceCommand > We are now in the nested for loop. i is: ${i}`); // DEBUG
				if (diceSet[0] > 10000) {
					await ctx.message.reply(new Embed({
						title: "Too Many Sides",
						description: "I'm sorry, please use < 10000 sides.",
						color: 0xFF0000,
					}));
					return;
				}
				const chosenNumber = RandomNumber(1, Number(diceSet[0]), ctx.channel.id);
				LogDebug(`DiceCommand > We now have the chosen number. chosenNumber is: ${chosenNumber}`); // DEBUG
				diceResult.push(chosenNumber);
				LogDebug(`DiceCommand > We just pushed chosenNumber to diceResult. diceResult is: ${diceResult}\n`); // DEBUG
			}
			if (Number(diceSet[1]) < 1 || isNaN(Number(diceSet[1]))) {
				await ctx.message.reply(new Embed({
					title: "Dice Error",
					description: "Please enter a valid amount of dice to roll!",
					color: 0xFF0000,
				}));
				return;
			}
			else if (isNaN(Number(diceSet[0])) || diceSet[0] == "0") { // It appears that isNaN doesn't seem to work as a condition here because it seems to be 0 if a user does ">>dice d6"
				await ctx.message.reply(new Embed({
					title: "Dice Error",
					description: "Please enter a valid amount of sides for the dice!",
					color: 0xFF0000,
				}));
				return;
			}
			else if (diceSet[1] == "1") {
				LogDebug(`DiceCommand > diceSet[1] is equal to 1 - diceSet is: ${diceSet}`); // DEBUG
				finalResult += `I rolled a ${diceSet[0]} sided die. The result is ${diceResult[0]}.\n`
			}
			else {
				LogDebug(`DiceCommand > diceSet[1] is not equal to 1 - diceSet is: ${diceSet}`); // DEBUG
				finalResult += `I rolled ${diceSet[1]} ${diceSet[0]} sided dice. The results are ${diceResult.join(", ")}.\n`
			}
		}

		await ctx.message.reply(new Embed({
			title: "Dice Result",
			description: `${finalResult}`,
			color: 0x00FF00,
		}))
	}
}

bot.commands.add(HelpCommand);
bot.commands.add(Whoami);
bot.commands.add(ShellCommand);
bot.commands.add(RockPaperScissorsCommand);
bot.commands.add(SayCommand);
bot.commands.add(SendEmbedCommand);
bot.commands.add(UserInfoCommand);
bot.commands.add(EvalCommand);
bot.commands.add(TopicCommand);
bot.commands.add(CoinflipCommand);
bot.commands.add(PingCommand);
bot.commands.add(RandomNumberCommand);
bot.commands.add(RemindmeCommand);
bot.commands.add(CancelReminderCommand);
bot.commands.add(ListRemindersCommand);
bot.commands.add(TimestampCommand);
bot.commands.add(SuCommand);
bot.commands.add(VersionCommand);
bot.commands.add(AwaitEvalCommand);
bot.commands.add(SendWebhookCommand);
bot.commands.add(DiceCommand);

const token = await Deno.readTextFile("./token.txt");

bot.connect(token, [
	GatewayIntents.GUILDS,
	GatewayIntents.GUILD_MESSAGES,
	GatewayIntents.GUILD_VOICE_STATES,
	GatewayIntents.GUILD_PRESENCES,
	GatewayIntents.GUILD_MEMBERS,
	GatewayIntents.MESSAGE_CONTENT,
	GatewayIntents.GUILD_EMOJIS_AND_STICKERS,
	GatewayIntents.DIRECT_MESSAGES,
]);

setInterval(async () => {
	const currentTime = Math.floor(Date.now() / 1000);

	for (const reminder in reminders.reminders) {
		// console.log("checking") // DEBUG
		// console.log(reminders.reminders[reminder].Expired == false); // DEBUG
		// console.log(reminders.reminders[reminder].Timestamp >= currentTime); // DEBUG
		// console.log(currentTime); // DEBUG
		// console.log(reminders.reminders[reminder].Timestamp); // DEBUG
		if (reminders.reminders[reminder].Expired == false && currentTime >= reminders.reminders[reminder].Timestamp) {
			// console.log("attempting")
			const user = await bot.users.fetch(reminders.reminders[reminder].UserId);
			const embed = new Embed({
				title: "Reminder",
				description: `<t:${reminders.reminders[reminder].Timestamp}:R> you asked to be reminded about:\n\`\`\`\n${reminders.reminders[reminder].Reason}\n\`\`\``,
				color: 0x00ff00,
			});
			user
				.send(
					new Embed({
						title: "Reminder",
						description: `<t:${reminders.reminders[reminder].Timestamp}:R> you asked to be reminded about:\n\`\`\`\n${reminders.reminders[reminder].Reason}\n\`\`\``,
						color: 0x00ff00,
					})
				)
				.catch(async () => {
					console.log("hi");
					await bot.channels.sendMessage(reminders.reminders[reminder].ChannelId, {
						content: `${user}`,
						embeds: [embed],
					});
				});
			reminders.reminders[reminder].Expired = true;
			// console.log("expired? yep") // DEBUG
		}
		Deno.writeTextFile("./reminders.json", JSON.stringify(reminders));
	}
}, 2500);
