const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");

console.log("Bot startet...");

// ENV CHECK
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.log("FEHLER: TOKEN oder CLIENT_ID fehlt!");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// SLOT SYMBOLS
const symbols = ["🍒", "🍋", "⭐", "7️⃣"];

// SLASH COMMAND
const commands = [
  new SlashCommandBuilder()
    .setName("slot")
    .setDescription("Slot Machine")
    .toJSON()
];

// REGISTER COMMAND
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("Registering slash command...");

    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );

    console.log("Slash Command ready");
  } catch (err) {
    console.error("Command error:", err);
  }
})();

// READY
client.once("ready", () => {
  console.log(`Online als ${client.user.tag}`);
});

// SLOT COMMAND
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "slot") {

    const r = () =>
      symbols[Math.floor(Math.random() * symbols.length)];

    const row1 = `${r()} ${r()} ${r()}`;
    const row2 = `${r()} ${r()} ${r()}`;
    const row3 = `${r()} ${r()} ${r()}`;

    await interaction.reply({
      content: "```txt\n" +
        row1 + "\n" +
        row2 + "\n" +
        row3 +
        "\n```"
    });
  }
});

// LOGIN
client.login(TOKEN);
