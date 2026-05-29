const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

console.log("Bot startet...");

// 🔥 SAFE CHECK (WICHTIG gegen "Completed")
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.log("❌ FEHLER: TOKEN oder CLIENT_ID fehlt!");
  process.exit(1);
}

console.log("✅ ENV OK");

// Bot Client
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

// REST
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("Registriere Commands...");

    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );

    console.log("Commands geladen");
  } catch (err) {
    console.error("Command Fehler:", err);
  }
})();

// Ready
client.once("ready", () => {
  console.log(`Online als ${client.user.tag}`);
});

// Errors verhindern
client.on("error", console.error);
client.on("shardError", console.error);

// Interaction
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "slot") {

    const r = () =>
      symbols[Math.floor(Math.random() * symbols.length)];

    const row1 = `${r()} ${r()} ${r()}`;
    const row2 = `${r()} ${r()} ${r()}`;
    const row3 = `${r()} ${r()} ${r()}`;

    await interaction.reply({
      content:
"```txt\n" +
row1 + "\n" +
row2 + "\n" +
row3 +
"\n```"
    });
  }
});

// Login
client.login(TOKEN);
