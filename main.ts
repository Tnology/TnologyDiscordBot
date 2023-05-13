import { CHAR_RIGHT_ANGLE_BRACKET } from "https://deno.land/std@0.152.0/path/_constants.ts";
import {
	CommandClient,
	GatewayIntents,
	Command,
	Embed,
	CommandContext,
	userContextMenu,
Option,
} from "https://deno.land/x/harmony@v2.8.0/mod.ts";
import { isNumber, isString, parseXMessage } from "https://deno.land/x/redis@v0.25.1/stream.ts";
import { config, ConfigOptions, DotenvConfig } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";

// TODO: Add user avatar to userinfo command
// TODO: Use Discord timestamp feature (figure out how to convert time to unix timestamp) in userinfo command
// TODO: Add user join server date to userinfo command
// TODO: Add a send webhook command.
// TODO: Add a private logging channel for when the bot comes online and/or eval commands and/or shell commands, by having "EVAL_COMMANDS_CHANNEL" (for example) 
// as a .env variable that can be set to -1 to be disabled or a channel ID to post eval command usage with info. Same with a "SHELL_COMMANDS_CHANNEL" and 
// a "BOT_START_CHANNEL" and whatnot.

// let oneWordStoryChannels: any = [] // TODO: Stop using any type FIXME: Checkpoint 1
// let twoWordStoryChannels: any = [] // TODO: Stop using any type FIXME: Checkpoint 1

await config({export: true});

const developerMode = Deno.env.get("DEV_MODE") == "true" ? true : false;

const evalLoggingChannel = Deno.env.get("EVAL_LOGGING_CHANNEL");
const shellLoggingChannel = Deno.env.get("SHELL_LOGGING_CHANNEL")

const discussionThreadsEnabled = Deno.env.get("ENABLE_DISCUSSION_THREADS") == "true";
const discussionChannels = Deno.env.get("DISCUSSION_CHANNELS")?.split(",");

const oneWordStoryChannels = Deno.env.get("ONE_WORD_STORY_CHANNELS")?.split(",");
const oneWordStoryLoggingChannel = Deno.env.get("ONE_WORD_STORY_LOGGING_CHANNEL");

const twoWordStoryChannels = Deno.env.get("TWO_WORD_STORY_CHANNELS")?.split(",");
const twoWordStoryLoggingChannel = Deno.env.get("TWO_WORD_STORY_LOGGING_CHANNEL");
const botOverridesStoryChannels = Deno.env.get("BOT_OVERRIDES_STORY_CHANNELS") == "true";

function SendEmbed(channelid: string, title: string, description: string, color: number) {
	if (channelid == "-1") {return false}

	bot.channels.sendMessage(channelid, new Embed({
		title: title,
		description: description,
		color: color,
	}))

	return true;
}

// TODO: Add an error if a channel is both a one-word story and a two word story, and remove it from both arrays 
// if it is (hence why the array is using let instead of const). Then, if no channels are left in the array, add 
// an element to the array of -1, which in the code for one/two word story will just cancel it (in the on message handling).
// Maybe a for loop can be used for this, check later.

// TODO: Add a "BOT_OVERRIDE" .env variable for one and two word story channels, for whether or not a bot can bypass the restriction.

// TODO: Check if Harmony has a new version and update it if it does


const ownersArray = Deno.env.get("OWNERS")?.split(",");

function RandomNumber(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1) + min);
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
	"Does the \"militia\" in the Second Amendment of the United States Constitution refer to the people?",
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
]

function DetermineBotChoice(choiceNum: number) {
	switch (choiceNum) {
		case 1:
			return "rock";
		case 2:
			return "paper";
		case 3:
			return "scissors";
		default:
			console.log("yeah this wasn't meant to happen lol");
			return "error";
	}
}

const bot = new CommandClient({
	caseSensitive: false,
	enableSlash: false,
	mentionPrefix: true,
	prefix: developerMode == false ? ">" : ">>",
	// owners: ["319223591046742016"],
	owners: ownersArray
});

bot.on("ready", () => {
	developerMode == false ? 
	console.log(
		`The bot is ready. The bot's info is the following:\nBot Username: ${bot.user!.tag}\nBot Owner(s): ${ownersArray}`
	) : 
	console.log(
		`The bot is ready and is in developer mode.\nBot Username: ${bot.user!.tag}\nBot Owner(s): ${ownersArray}`
	)
});

bot.on("messageCreate", (msg) => {
	// if (msg.author.bot || developerMode) return;

	
	// if (msg.content.toLowerCase().includes("@everyone"))

	if (discussionThreadsEnabled) {
		if (discussionChannels!.includes(msg.channel.id)) {
			msg.startThread({
				name: "Discussion Thread",
			})
		}
	}

	if (!(oneWordStoryChannels?.includes("-1"))) {
		if (oneWordStoryChannels!.includes(msg.channel.id)) {
			if (!(msg.content[0] == "/" && msg.content[1] == "/")) {
				if (msg.content.split(" ").length > 1 || msg.content.includes("https://") || msg.content.includes("http://") || msg.content.includes("\n") || msg.content.length >= 100) {
				//console.log(`Message has been deleted for having too many words\nType: One Word Story\nMessage Content: ${msg.content}`);
				if (botOverridesStoryChannels) {
					if (msg.author.bot) {
						return 1;
					}
				}
				if (oneWordStoryLoggingChannel != "-1") {
					SendEmbed(oneWordStoryLoggingChannel!, "One Word Story - Deleted", `A message has been deleted from ${msg.channel.id}\n**Author:** ${msg.author}\n**Content:** ${msg.content}\n**Time:** ${msg.timestamp}`, 0xFF0000)
				}
				
				msg.delete();
				}
			}
		}
	}

	if (!(twoWordStoryChannels?.includes("-1"))) {
		if (twoWordStoryChannels!.includes(msg.channel.id)) {
			if (!(msg.content[0] == "/" && msg.content[1] == "/" || msg.content.includes("https://") || msg.content.includes("http://") || msg.content.includes("\n") || msg.content.length >= 100)) {
				if (msg.content.split(" ").length > 2) {
					if (botOverridesStoryChannels) {
						if (msg.author.bot) {
							return 1;
						}
					}
					if (twoWordStoryLoggingChannel != "-1") {
						SendEmbed(twoWordStoryLoggingChannel!, "Two Word Story - Deleted", `A message has been deleted from ${msg.channel.id}\n**Author:** ${msg.author}\n**Content:** ${msg.content}\n**Time:** ${msg.timestamp}`, 0xFF0000)
					}
					console.log(`Message has been deleted for having too many words\nType: Two Word Story\nMessage Content: ${msg.content}`);
					msg.delete();	
				}
			}
		}
	}
	}
);

bot.on("gatewayError", (err) => {
	console.log("An error has occurred! Please implement proper error handling!"); // TODO: Add this
	console.log(err);
})

class HelpCommand extends Command {
	name = "help";
	aliases = ["commands", "cmds"];
	description = "Shows available commands.\n**Syntax:** `help`";
	async execute(ctx: CommandContext) {
		let commands = "";
		for (let commandIndex in ctx.client.commands.list.array()) {
			let thisCommand = ctx.client.commands.list.array()[commandIndex];
			commands += `**\n${thisCommand.name}**\nAliases: ${thisCommand.aliases}\nDescription: ${thisCommand.description}\n`; // 10/10 code
		}

		await ctx.message.reply(
			new Embed({
				title: "Help",
				description: `${commands}`,
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

class Restart extends Command {
	name = "restart";
	aliases = ["reboot"];
	description = "This command doesn't even work.";
	ownerOnly = true;

	async execute(ctx: CommandContext) {
		await ctx.message.reply(
			new Embed({
				title: "Restarting...",
				description: "The bot is now restarting...",
			})
		);
		bot.destroy();
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
	}
}

class ShellCommand extends Command {
	name = "shell";
	aliases = ["sh", "shellcmd"];
	description =
		"Executes a shell command. Owner only.\n**Syntax:** `shell <shell command to execute>`";
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
		//		try {
		const cmd = Deno.run({
			cmd: ctx.argString.split(" "),
			stdout: "piped",
			stderr: "piped",
		});
		//		}
		//		catch (e) { // the reason why this code is formatted so badly is because i wrote this via the Termius mobile app, using nano via SSH tp my VPS, while on a tour bus. I wrote this comment at 12:02 PM on 4/26/2023
		//			await ctx.message.reply(new Embed({
		//			title: "Error!",
		//			description: `{e}`,
		//			color: 0xff0000
		//			}))
		//		}

		//if ((await cmd.status()).success) {
		await ctx.message.reply(
			new Embed({
				title: `Success (${(await cmd.status()).code})`,
				description: `Output: \`\`\`${new TextDecoder().decode(
					await cmd.output()
				)}\`\`\``,
				color: 0x00ff00,
			})
		);
		//}// else {
		// await ctx.message.reply(
		//		new Embed({
		//			title: `Error! (${(await cmd.status()).code})`,
		//			description: `Output: \`\`\`${new TextDecoder().decode(
		//				await cmd.output()
		//			)}\`\`\``,
		//		})
		//	);
		//}
		await ctx.message.reply(`${new TextDecoder().decode(await cmd.output())}`);
	}
}

class RockPaperScissorsCommand extends Command {
	name = "rps";
	aliases = ["rockpaperscissors"];
	description =
		"Lets you play a game of Rock, Paper, Scissors with the bot.\n**Syntax:** `rps <rock|paper|scissors>`";

	async execute(ctx: CommandContext) {
		const userChoice = ctx.argString.split(" ")[0];
		console.log(userChoice);
		const botChoice = DetermineBotChoice(RandomNumber(1, 3));
		if (userChoice.length == 0) {
			await ctx.message.reply(
				new Embed({
					title: "Error!",
					description:
						"Please make a choice between rock, paper, and scissors.",
					color: 0xff0000,
				})
			);
			return;
		}

		if (userChoice == botChoice) {
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
			return;
		} else if (userChoice == "rock") {
			if (botChoice == "paper") {
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
				return;
			} else if (botChoice == "scissors") {
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
				return;
			}
		} else if (userChoice == "paper") {
			if (botChoice == "rock") {
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
				return;
			} else if (botChoice == "scissors") {
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
				return;
			}
		} else if (userChoice == "scissors") {
			if (botChoice == "rock") {
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
				return;
			} else if (botChoice == "paper") {
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
				return;
			}
		} else {
			await ctx.message.reply(
				new Embed({
					title: "Error!",
					description:
						"Please make a choice between rock, paper, and scissors.",
					color: 0x00ff00,
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
}

class SayCommand extends Command {
	name = "say";
	aliases = ["echo"];
	description =
		"Makes the bot say something. Owner only.\n**Syntax:** `say <thing to say>`";
	ownerOnly = true;

	async execute(ctx: CommandContext) {
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
		// const channelArg = ctx.argString.split(" ")[0];
		const channel = ctx.message.mentions.channels.first();
		const cmdArgs: any = ctx.argString.split(" ").splice(1).join(" ");
		console.log(cmdArgs);
		const title = cmdArgs.split("\n")[0];
		console.log("A");
		console.log(title);
		console.log("B");
		const description = cmdArgs.split("\n")[1];
		await channel!.send(
			new Embed({
				title: title,
				description: description,
				// title: ctx.argString.split(" ")[0],
				// description: ctx.argString.split(" ").slice(1).join(" "),
			})
		);
	}
}

class UserInfoCommand extends Command {
	// FIXME: Members who are in the guild might not able to be fetched
	// This is indeed the case. ^
	name = "userinfo";
	aliases = ["ui", "whois", "about", "aboutuser"];
	description =
		"Lets you get information about a user.\n**Syntax:** `whois <user>`";

	async execute(ctx: CommandContext) {
		try {
			var user = (await ctx.guild!.members.fetch(ctx.argString.split(" ")[0]));
		}
		catch (e) {
			// await ctx.message.reply(`${e}`) // TODO: Add to logging
		}
		// console.log("start") // DEBUG
		// console.log(user) // DEBUG

		if (ctx.argString == "") {
			user = (await ctx.guild!.members.fetch(ctx.author.id));
		}
		else if (ctx.message.mentions.users.first() == undefined) {
			if (ctx.argString.split(" ")[0].length > 1) {
				// DEBUG // console.log(`Debug: ctx.argString.split(" ")[0].length > 1 - True // Argument: ${ctx.argString.split(" ")[0]} // Length: ${ctx.argString.split(" ")[0].length}`)
				var user = (await ctx.guild!.members.resolve(ctx.argString.split(" ")[0]))!;
				if (user == undefined) {
					await ctx.message.reply(new Embed({
						title: "Error",
						description: "The user could not be found. Please make sure you are providing the right user.",
						color: 0xFF0000,
					}))
				}
			}
		}
		else if (isString((ctx.message.mentions.users.first()!.username))) {
			// console.log(`ctx.message.mentions.users.first()!.username is a string, is returned true.`) // DEBUG
			user = (await ctx.guild!.members.fetch(ctx.message.mentions.users.first()!.id))
			// console.log("\n\nnext") // DEBUG
			// console.log(user) // DEBUG
		}
		// console.log("now mentions") // DEBUG
		// console.log(ctx.message.mentions.users.first()) // DEBUG
		// console.log(`typeof = ${typeof(ctx.message.mentions.users.first())}`) // DEBUG

		// console.log(user!.id); // DEBUG
		// console.log(`\n${typeof(user!)}`); // DEBUG
		const serverJoinDate = `<t:${(new Date(user!.joinedAt).getTime() / 1000).toFixed(0)}:F>`
		const userJoinDate = `<t:${(new Date(user!.timestamp).getTime() / 1000).toFixed(0)}:F>`
		const userStatus = (await ctx.guild!.presences.fetch(user!.id))!.status

		// console.log(`\n\n\n\n\n\n\n\n\n\n${user!.user}\n\n${user!}\n\n${user!.user.id}\n\n${user!.user.tag}\n\n\n`) // DEBUG
		// console.log(`\n\n\nnow the user\n\n${user!}\ntypeof = ${typeof(user!)}\n\n`) // DEBUG

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
						inline: true
					}
				]
			}),
			{
				allowedMentions: {
					replied_user: true,
					roles: [],
				},
			},
		);
	}
}

class EvalCommand extends Command {
	name = "eval";
	description =
		"Lets you run TypeScript code with the bot. Owner only.\n`eval <code to evaluate>`";
	ownerOnly = true;

	async execute(ctx: CommandContext) {
		console.log(
			`\n\n*****\nExecuting Eval Code!\n\nCommand Executed By: ${ctx.author}\nExecuting: ${ctx.argString}\n*****\n\n`
		);
		// TODO: Add error handling if the message is not sent
		// try {
			SendEmbed(evalLoggingChannel!, "Executing Eval Command", `**Author:** \`${ctx.author}\`\n**Code:**\n\`\`\`js\n${ctx.argString}\n\`\`\``, 0x0000FF)
		// }
		// catch (err) {
			// console.log(`An error occurred while attempting to send a message.\nThe message attempted was: Log Message for Executing Eval Command.`)
			// console.log(err)
			// console.log("Error, might be 50001 Missing Access") // TODO: Add this
		// }
		try {
			const evaluatedCode = eval(ctx.argString.replace("```js", "").replace("```", ""));
			await ctx.message.reply(
				new Embed({
					title: "Output",
					description: `\`\`\`${evaluatedCode}\`\`\``,
					color: 0x00ff00,
				})
			);
		} catch (err) {
			await ctx.message.reply(
				new Embed({
					title: "Error",
					description: `\`\`\`${err}\`\`\``,
					color: 0xff0000,
				})
			);
			// TODO: Add error handling if the message is not sent
			SendEmbed(evalLoggingChannel!, "Eval Command Error", `Error Executing Code!\n**Author:** \`${ctx.author}\`\n**Error:** \`\`\`js\n${err}\n\`\`\``, 0xFF0000)
		}
	}
}

class CoinflipCommand extends Command {
	name = "coinflip";
	description = "Chooses between heads and tails.\n**Syntax:** `coinflip`"
	aliases = ["flipcoin", "iamtryingtoresolveadebateaboutsomethingwithafriend"];

	async execute(ctx: CommandContext) {
		const result = RandomNumber(1, 2);

		result == 1
			? await ctx.message.reply(
					new Embed({ title: "Heads!", description: "The result is heads." })
			  )
			: await ctx.message.reply(
					new Embed({ title: "Tails!", description: "The result is tails." })
			  );
	}
}

class TopicCommand extends Command {
	name = "topic"
	aliases = ["generatetopic", "gentopic", "topicgenerate", "topicgen", "topicidea"]
	description = "Picks a topic from a list of topics that T_nology has created."

	async execute(ctx: CommandContext) {
		const pickedTopic = topicArray[RandomNumber(0, (topicArray.length - 1))];

		await ctx.message.reply(new Embed({
			title: "Topic",
			description: `${pickedTopic}`,
		}))
	}
}

class PingCommand extends Command {
	name = "ping";
	aliases = ["pong", "latency"];
	description = "Gets the latency of the bot."

	async execute(ctx: CommandContext) {
		const messageCreatedTime = new Date();
		await ctx.message.reply(new Embed({
			title: "🏓 **Pong!**",
			description: `**Ping:** \`${Date.now() - messageCreatedTime.getTime()}\` ms\n**Websocket/Gateway Ping:** \`${ctx.message.client.gateway.ping}\``
		}))
	}
}

class RandomNumberCommand extends Command {
	name = "randomnumber";
	aliases = ["rng", "choosenumber"]
	description = "Chooses a number between the two parameters provided."

	async execute(ctx: CommandContext) {
		const lNum = Number(ctx.argString.split(" ")![0]);
		const hNum = Number(ctx.argString.split(" ")[1]);
		if (isNaN(lNum) || isNaN(hNum)) {
			await ctx.message.reply(new Embed({
				title: "Error!",
				description: `Please enter two numbers.`,
				color: 0xFF0000,
			}))
			return;
		}

		await ctx.message.reply(new Embed({
			title: "Random Number",
			description: `I picked a number between ${lNum} and ${hNum}. The result is ${RandomNumber(lNum, hNum)}`
		}))
	}
}

bot.commands.add(HelpCommand);
bot.commands.add(Whoami);
bot.commands.add(Restart);
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

const token = await Deno.readTextFile("./token.txt");

//const token = await Deno.env.get("TOKEN") // Use this when ready!

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

