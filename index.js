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

// nur dieser Channel
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

// ================= SLOT =================
const symbols = [
  { icon: "🍋", multi: 2 },
  { icon: "🍒", multi: 3 },
  { icon: "🔔", multi: 5 },
  { icon: "⭐", multi: 8 },
  { icon: "7️⃣", multi: 15 }
];

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

// ================= INTERACTION =================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.channel.id !== ALLOWED_CHANNEL) {
    return interaction.reply({
      content: "❌ Nur im Casino-Channel!",
      ephemeral: true
    });
  }

  const userId = interaction.user.id;

  // ================= COINS =================
  if (interaction.commandName === "coins") {
    return interaction.reply(`💰 Du hast ${getCoins(userId)} Coins`);
  }

  // ================= DAILY =================
  if (interaction.commandName === "daily") {
    const now = Date.now();
    const cd = 24 * 60 * 60 * 1000;

    if (daily.has(userId) && now - daily.get(userId) < cd) {
      return interaction.reply({
        content: "⏳ Daily schon benutzt!",
        ephemeral: true
      });
    }

    addCoins(userId, 5000);
    daily.set(userId, now);

    return interaction.reply(`🎁 +5000 Coins! Jetzt: ${getCoins(userId)}`);
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

    await interaction.reply("🎰 Dreht...");

    // 3x3 Grid
    const grid = [];
    for (let r = 0; r < 3; r++) {
      const row = [];
      for (let c = 0; c < 3; c++) {
        row.push(randomSymbol());
      }
      grid.push(row);
    }

    const lines = [
      [grid[0][0], grid[0][1], grid[0][2]],
      [grid[1][0], grid[1][1], grid[1][2]],
      [grid[2][0], grid[2][1], grid[2][2]],
      [grid[0][0], grid[1][1], grid[2][2]],
      [grid[0][2], grid[1][1], grid[2][0]]
    ];

    let win = 0;

    for (const line of lines) {
      if (
        line[0].icon === line[1].icon &&
        line[1].icon === line[2].icon
      ) {
        win += bet * line[0].multi;
      }
    }

    if (win > 0) addCoins(userId, win);

    const text =
`🎰 SLOT RESULT

${grid[0][0].icon} | ${grid[0][1].icon} | ${grid[0][2].icon}
${grid[1][0].icon} | ${grid[1][1].icon} | ${grid[1][2].icon}
${grid[2][0].icon} | ${grid[2][1].icon} | ${grid[2][2].icon}

${win > 0 ? `🎉 Gewinn: ${win}` : `❌ Verloren: ${bet}`}
💰 Coins: ${getCoins(userId)}`;

    await interaction.editReply(text);
  }
});

client.login(TOKEN);
