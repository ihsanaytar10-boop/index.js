const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const symbols = ["🍒", "🍋", "⭐", "7️⃣"];

// Slash Command
const commands = [
  new SlashCommandBuilder()
    .setName("slot")
    .setDescription("🎰 Slot Machine")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );

    console.log("Commands geladen");
  } catch (err) {
    console.error("Command Fehler:", err);
  }
})();

client.once("ready", () => {
  console.log("Bot online");
});

client.on("error", console.error);
client.on("shardError", console.error);

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "slot") {
    try {

      // 🔥 WICHTIG: verhindert "Anwendung reagiert nicht"
      await interaction.deferReply();

      const r = () =>
        symbols[Math.floor(Math.random() * symbols.length)];

      const row1 = `${r()} ${r()} ${r()}`;
      const row2 = `${r()} ${r()} ${r()}`;
      const row3 = `${r()} ${r()} ${r()}`;

      await interaction.editReply(
        "```txt\n" +
        row1 + "\n" +
        row2 + "\n" +
        row3 +
        "\n```"
      );

    } catch (err) {
      console.error(err);

      if (interaction.deferred) {
        await interaction.editReply("❌ Fehler beim Slot");
      } else {
        await interaction.reply({
          content: "❌ Fehler beim Slot",
          ephemeral: true
        });
      }
    }
  }
});

client.login(TOKEN);
