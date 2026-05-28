const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
  console.log("Bot online");
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "slot") {
    await interaction.reply({
      content:
`🍒 | 🍋 | 🔔
🍋 | 🍒 | 🔔
🔔 | 🍋 | 🍒`
    });
  }
});

client.login(process.env.TOKEN);
