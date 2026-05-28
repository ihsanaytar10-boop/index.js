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

const commands = [
  new SlashCommandBuilder()
    .setName("slot")
    .setDescription("🎰 Slot")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  await rest.put(
    Routes.applicationCommands(CLIENT_ID),
    { body: commands }
  );

  console.log("Commands geladen");
})();

client.once("ready", () => {
  console.log("Bot online");
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "slot") {

    const r = () =>
      symbols[Math.floor(Math.random() * symbols.length)];

    const row1 = `${r()} ${r()} ${r()}`;
    const row2 = `${r()} ${r()} ${r()}`;
    const row3 = `${r()} ${r()} ${r()}`;

    interaction.reply({
      content:
"```txt\n" +
row1 + "\n" +
row2 + "\n" +
row3 +
"\n```"
    });
  }
});

client.login(TOKEN);
