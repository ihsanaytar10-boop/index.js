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

// ================= SLOT SYMBOLS =================
const symbols = ["🍒", "🍋", "🔔", "⭐", "7️⃣"];

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

// ================= COMMANDS =================
const commands = [
  new SlashCommandBuilder()
    .setName("slot")
    .setDescription("🎰 Slot Machine")
    .addIntegerOption(opt =>
      opt.setName("einsatz")
        .setDescription("Coins setzen")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("coins")
    .setDescription("💰 Coins anzeigen"),

  new SlashCommandBuilder()
    .setName("daily")
    .setDescription("🎁 Daily Coins")
].map(c => c.toJSON());

// ================= REGISTER COMMANDS =================
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("Commands werden geladen...");

    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );

    console.log("Commands geladen.");
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

  // ================= SLOT =================
  if (interaction.commandName === "slot") {
    const bet = interaction.options.getInteger("einsatz");

    if (bet <= 0) {
      return interaction.reply("❌ Ungültiger Einsatz");
    }

    if (getCoins(userId) < bet) {
      return interaction.reply("❌ Nicht genug Coins");
    }

    addCoins(userId, -bet);

    const grid = [
      [randomSymbol(), randomSymbol(), randomSymbol()],
      [randomSymbol(), randomSymbol(), randomSymbol()],
      [randomSymbol(), randomSymbol(), randomSymbol()]
    ];

    const lines = [
      [grid[0][0], grid[0][1], grid[0][2]],
      [grid[1][0], grid[1][1], grid[1][2]],
      [grid[2][0], grid[2][1], grid[2][2]],
      [grid[0][0], grid[1][1], grid[2][2]],
      [grid[0][2], grid[1][1], grid[2][0]]
    ];

    let win = 0;

    for (const line of lines) {
      if (line[0] === line[1] && line[1] === line[2]) {
        win += bet * 3;
      }
    }

    if (win > 0) addCoins(userId, win);

    const text =
`🎰 SLOT RESULT

${grid[0][0]} | ${grid[0][1]} | ${grid[0][2]}
${grid[1][0]} | ${grid[1][1]} | ${grid[1][2]}
${grid[2][0]} | ${grid[2][1]} | ${grid[2][2]}

${win > 0 ? `🎉 GEWONNEN +${win}` : `❌ VERLOREN -${bet}`}

💰 Coins: ${getCoins(userId)}`;

    return interaction.reply(text);
  }
});

// ================= LOGIN =================
client.login(TOKEN);
