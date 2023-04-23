import { CHAR_RIGHT_ANGLE_BRACKET } from "https://deno.land/std@0.152.0/path/_constants.ts";
import {
	CommandClient,
	GatewayIntents,
	Command,
	Embed,
	CommandContext,
	userContextMenu,
} from "https://deno.land/x/harmony@v2.8.0/mod.ts";
import { parseXMessage } from "https://deno.land/x/redis@v0.25.1/stream.ts";

function RandomNumber(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

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
	prefix: ">",
	owners: ["319223591046742016"],
});

bot.on("ready", () => {
	console.log(
		`The bot is ready. The bot's info is the following:\nBot Username: ${
			bot.user!.tag
		}`
	);
});

bot.on("messageCreate", (msg) => {
	if (msg.author.bot) return;

	// if (msg.content.toLowerCase().includes("@everyone"))

	if (msg.content.toLowerCase().includes("i'm")) {
		const followingContent = msg.content.substring(
			msg.content.toLowerCase().indexOf("i'm") + 4
		);
		msg.reply(`Hi ${followingContent}! I'm dad!`, {
			allowedMentions: {
				replied_user: true,
				roles: [],
			},
		});
	}
});

class HelpCommand extends Command {
	name = "help";
	aliases = ["commands", "cmds"];
	async execute(ctx: CommandContext) {
		await ctx.message.reply(
			new Embed({
				title: "Help",
				description:
					"Here is a list of commands:\nhelp - What do you think it does? Take a guess.\nrps - Play a game of rock, paper, scissors",
			})
		);
	}
}

class Whoami extends Command {
	name = "whoami";
	aliases = ["imhavinganidentitycrisis"];

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

		const cmd = Deno.run({
			cmd: ctx.argString.split(" "),
			stdout: "piped",
			stderr: "piped",
		});

		if ((await cmd.status()).success) {
			await ctx.message.reply(
				new Embed({
					title: `Success (${(await cmd.status()).code})`,
					description: `Output: \`\`\`${new TextDecoder().decode(
						await cmd.output()
					)}\`\`\``,
					color: 0x00ff00,
				})
			);
		} else {
			await ctx.message.reply(
				new Embed({
					title: `Error! (${(await cmd.status()).code})`,
					description: `Output: \`\`\`${new TextDecoder().decode(
						await cmd.output()
					)}\`\`\``,
				})
			);
		}
		await ctx.message.reply(`${new TextDecoder().decode(await cmd.output())}`);
	}
}

class RockPaperScissorsCommand extends Command {
	name = "rps";
	aliases = ["rockpaperscissors"];

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
			);
			return;
		} else if (userChoice == "rock") {
			if (botChoice == "paper") {
				await ctx.message.reply(
					new Embed({
						title: "I Win!",
						description: `You picked ${userChoice}. I picked ${botChoice}. I win!`,
					})
				);
				return;
			} else if (botChoice == "scissors") {
				await ctx.message.reply(
					new Embed({
						title: "You Win!",
						description: `You picked ${userChoice}. I picked ${botChoice}. You win!`,
					})
				);
				return;
			}
		} else if (userChoice == "paper") {
			if (botChoice == "rock") {
				await ctx.message.reply(
					new Embed({
						title: "You Win!",
						description: `You picked ${userChoice}. I picked ${botChoice}. You win!`,
					})
				);
				return;
			} else if (botChoice == "scissors") {
				await ctx.message.reply(
					new Embed({
						title: "I Win!",
						description: `You picked ${userChoice}. I picked ${botChoice}. I win!`,
					})
				);
				return;
			}
		} else if (userChoice == "scissors") {
			if (botChoice == "rock") {
				await ctx.message.reply(
					new Embed({
						title: "I Win!",
						description: `You picked ${userChoice}. I picked ${botChoice}. I win!`,
					})
				);
				return;
			} else if (botChoice == "paper") {
				await ctx.message.reply(
					new Embed({
						title: "You Win!",
						description: `You picked ${userChoice}. I picked ${botChoice}. You win!`,
					})
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
				})
			);
			return;
		}
	}
}

class SayCommand extends Command {
	name = "say";
	aliases = ["echo"];
	ownerOnly = true;

	async execute(ctx: CommandContext) {
		await ctx.message.channel.send(`${ctx.argString}`);
	}
}

class SendEmbedCommand extends Command {
	name = "sendembed";
	aliases = ["embedsend"];
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

// class ShellCommand extends Command {
// 	name = "shell";
// 	aliases = ["sh", "shellcmd"];
// 	ownerOnly = true;

// 	async execute(ctx: CommandContext) {
// 		await ctx.message.reply(
// 			new Embed({
// 				title: "Executing",
// 				description: "Executing the command...",
// 				color: 0xff9e00,
// 			})
// 		);

// 		const cmd = Deno.run({
// 			cmd: ctx.argString.split(" "),
// 			stdout: "piped",
// 			stderr: "piped",
// 		});

// 		const [status, stdout, stderr] = await Promise.all([
// 			cmd.status(),
// 			cmd.output(),
// 			cmd.stderrOutput(),
// 		]);

// 		console.log(await cmd.output());

// 		if (status.success == true) {
// 			await ctx.message.reply(
// 				new Embed({
// 					title: "Success",
// 					description: `Exit Code: ${status.code}\nSuccess: ${status.success}\nOutput: \`\`\`temp\`\`\``,
// 					color: 0x00ff00,
// 				})
// 			);
// 		}
// 		else {
// 			await ctx.message.reply(
// 				new Embed({
// 					title: "Error",
// 					description: `Unfortunately, something went wrong.\nsuccess Status Boolean: ${status.success}\nStatus Code: ${status.code}`,
// 				})
// 			);
// 		}
// 		console.log("repeating");
// 		status.success == true;
// 		cmd.close();
// 	}
// }

bot.commands.add(HelpCommand);
bot.commands.add(Whoami);
bot.commands.add(Restart);
bot.commands.add(ShellCommand);
bot.commands.add(RockPaperScissorsCommand);
bot.commands.add(SayCommand);
bot.commands.add(SendEmbedCommand);

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
