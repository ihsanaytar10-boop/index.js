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

// ================= SYMBOLS =================
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

// ================= REGISTER =================
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("Commands laden...");

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
      flags: 64
    });
  }

  const userId = interaction.user.id;

  // ================= COINS =================
  if (interaction.commandName === "coins") {
    return interaction.reply({
      content: `💰 Coins: ${getCoins(userId)}`,
      flags: 64
    });
  }

  // ================= DAILY =================
  if (interaction.commandName === "daily") {
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;

    if (daily.has(userId) && now - daily.get(userId) < cooldown) {
      return interaction.reply({
        content: "⏳ Daily schon benutzt!",
        flags: 64
      });
    }

    addCoins(userId, 5000);
    daily.set(userId, now);

    return interaction.reply({
      content: "🎁 +5000 Coins erhalten!",
      flags: 64
    });
  }

  // ================= SLOT =================
  if (interaction.commandName === "slot") {
    try {
      const bet = interaction.options.getInteger("einsatz");
      const userId = interaction.user.id;

      if (bet <= 0) {
        return interaction.reply({
          content: "❌ Ungültiger Einsatz",
          flags: 64
        });
      }

      if (getCoins(userId) < bet) {
        return interaction.reply({
          content: "❌ Nicht genug Coins",
          flags: 64
        });
      }

      addCoins(userId, -bet);

      const r = () =>
        symbols[Math.floor(Math.random() * symbols.length)];

      const grid = [
        [r(), r(), r()],
        [r(), r(), r()],
        [r(), r(), r()]
      ];

      const text =
`🎰 SLOT RESULT

${grid[0][0]} | ${grid[0][1]} | ${grid[0][2]}
${grid[1][0]} | ${grid[1][1]} | ${grid[1][2]}
${grid[2][0]} | ${grid[2][1]} | ${grid[2][2]}

💰 Coins: ${getCoins(userId)}`;

      return interaction.reply({
        content: text
      });

    } catch (err) {
      console.error(err);

      if (!interaction.replied) {
        return interaction.reply({
          content: "❌ Fehler im Slot System",
          flags: 64
        });
      }
    }
  }
});

// ================= LOGIN =================
client.login(TOKEN);
