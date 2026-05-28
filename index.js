const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

// ================= CONFIG =================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const ALLOWED_CHANNEL = "1509425466782646342";

// ================= BOT =================
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ================= COINS =================
const coins = new Map();

function getCoins(id) {
  if (!coins.has(id)) coins.set(id, 10000);
  return coins.get(id);
}

function addCoins(id, amount) {
  coins.set(id, getCoins(id) + amount);
}

// ================= DAILY =================
const daily = new Map();

// ================= COMMANDS =================
const commands = [
  new SlashCommandBuilder()
    .setName("slot")
    .setDescription("🎰 Slot Machine"),

  new SlashCommandBuilder()
    .setName("coins")
    .setDescription("💰 Coins anzeigen"),

  new SlashCommandBuilder()
    .setName("daily")
    .setDescription("🎁 Daily Coins")
].map(c => c.toJSON());

// ================= REGISTER =================
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("Commands laden...");

    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );

    console.log("Commands geladen");
  } catch (err) {
    console.error(err);
  }
})();

// ================= READY =================
client.once("ready", () => {
  console.log(`${client.user.tag} online`);
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.channel.id !== ALLOWED_CHANNEL) {
    return interaction.reply({
      content: "❌ Nur im Casino Channel!",
      ephemeral: true
    });
  }

  const userId = interaction.user.id;

  // ================= COINS =================
  if (interaction.commandName === "coins") {
    return interaction.reply(`💰 Coins: ${getCoins(userId)}`);
  }

  // ================= DAILY =================
  if (interaction.commandName === "daily") {
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;

    if (daily.has(userId) && now - daily.get(userId) < cooldown) {
      return interaction.reply({
        content: "⏳ Daily schon benutzt!",
        ephemeral: true
      });
    }

    addCoins(userId, 5000);
    daily.set(userId, now);

    return interaction.reply(`🎁 +5000 Coins`);
  }

  // ================= SLOT (FIX 3 ROWS) =================
  if (interaction.commandName === "slot") {
    const symbols = ["🍒", "🍋", "🔔", "⭐", "7️⃣"];

    const r = () => symbols[Math.floor(Math.random() * symbols.length)];

    const row1 = `${r()} | ${r()} | ${r()}`;
    const row2 = `${r()} | ${r()} | ${r()}`;
    const row3 = `${r()} | ${r()} | ${r()}`;

    return interaction.reply(
`🎰 SLOT

${row1}
${row2}
${row3}`
    );
  }
});

// ================= LOGIN =================
client.login(TOKEN);
