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

// TODO: Add a ping (latency) command
// TODO: Add user avatar to userinfo command
// TODO: Use Discord timestamp feature (figure out how to convert time to unix timestamp) in userinfo command
// TODO: Add user join server date to userinfo command

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
	name = "userinfo";
	aliases = ["ui", "whois", "about", "aboutuser"];
	description =
		"Lets you get information about a user.\n**Syntax:** `whois <user>`";

	async execute(ctx: CommandContext) {
		const user = ctx.message.mentions.users.first();
		if (user == undefined) {
			await ctx.message.reply(
				new Embed({
					title: "Error!",
					description: "Please provide a user to get information about.",
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
		await ctx.message.reply(
			new Embed({
				title: "User Info",
				description: `Information about user ${user.mention}\n\n**Username:**\n${user.username}#${user.discriminator}\n\n**User ID:**\n${user.id}\n\n**Account Created:**\n${user.timestamp},`,
				color: 0x0000ff,
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
	description =
		"Lets you run TypeScript code with the bot. Owner only.\n`eval <code to evaluate>`";
	ownerOnly = true;

	async execute(ctx: CommandContext) {
		// and my brain is farting again fantastic, i think it has some diarrhea idek
		// i am mentally fucked rn
		// maybe i put a little too much crack in those three sandwiches i ate (ask zack, i really did eat three sandwiches)
		// what was i gonna do here
		// oh lol
		console.log(
			`\n\n*****\nExecuting Eval Code!\n\nCommand Executed By: ${ctx.author}\nExecuting: ${ctx.argString}\n*****\n\n`
		);
		try {
			const evaluatedCode = eval(ctx.argString);
			await ctx.message.reply(
				new Embed({
					title: "Output",
					description: `${evaluatedCode}`,
					color: 0x00FF00
				})
			);
		}
		catch (err) {
			await ctx.message.reply(
				new Embed({
					title: "Error",
					description: `\`\`\`${err}\`\`\``,
					color: 0xFF0000
				})
			)
		}

	}
}





/*
class EvalCommand extends Command {
	name = "eval";
	description =
		"Lets you run TypeScript code with the bot. Owner only.\n`eval <code to evaluate>`";
	ownerOnly = true;

	async execute(ctx: CommandContext) {
		// and my brain is farting again fantastic, i think it has some diarrhea idek
		// i am mentally fucked rn
		// maybe i put a little too much crack in those three sandwiches i ate (ask zack, i really did eat three sandwiches)
		// what was i gonna do here
		// oh lol
		console.log(
			`\n\n*****\nExecuting Eval Code!\n\nCommand Executed By: ${ctx.author}\nExecuting: ${ctx.argString}\n*****\n\n`
		);
		try{
			const evaluatedCode = eval(ctx.argString);
		}
		catch (e) {
			await ctx.message.reply(new Embed({
				title: "Error!",
				description: `${e}`,
			}))
		}
		await ctx.message.reply(
			new Embed({
				title: "Output",
				description: `${evaluatedCode}`,
			})
		);
	}
}
*/


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
bot.commands.add(UserInfoCommand);
bot.commands.add(EvalCommand);

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
