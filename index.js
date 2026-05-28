const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder
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
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
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

  // Nur Casino Channel
  if (interaction.channel.id !== ALLOWED_CHANNEL) {
    return interaction.reply({
      content: "❌ Nur im Casino Channel!",
      flags: 64
    });
  }

  const userId = interaction.user.id;

  // ================= COINS =================
  if (interaction.commandName === "coins") {
    const embed = new EmbedBuilder()
      .setTitle("💰 Kontostand")
      .setDescription(`Du hast **${getCoins(userId)} Coins**`)
      .setColor(0xf1c40f);

    return interaction.reply({ embeds: [embed], flags: 64 });
  }

  // ================= DAILY =================
  if (interaction.commandName === "daily") {
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;

    if (daily.has(userId) && now - daily.get(userId) < cooldown) {
      const remaining = cooldown - (now - daily.get(userId));
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);

      const embed = new EmbedBuilder()
        .setTitle("⏳ Daily bereits abgeholt")
        .setDescription(`Noch **${hours}h ${minutes}m** warten`)
        .setColor(0xe74c3c);

      return interaction.reply({ embeds: [embed], flags: 64 });
    }

    addCoins(userId, 5000);
    daily.set(userId, now);

    const embed = new EmbedBuilder()
      .setTitle("🎁 Daily Bonus")
      .setDescription("Du hast **+5000 Coins** erhalten!")
      .addFields({ name: "💰 Kontostand", value: `${getCoins(userId)} Coins` })
      .setColor(0x2ecc71);

    return interaction.reply({ embeds: [embed], flags: 64 });
  }

  // ================= SLOT =================
  if (interaction.commandName === "slot") {
    try {
      const bet = interaction.options.getInteger("einsatz");

      if (bet <= 0) {
        const embed = new EmbedBuilder()
          .setTitle("❌ Ungültiger Einsatz")
          .setDescription("Der Einsatz muss größer als 0 sein.")
          .setColor(0xe74c3c);

        return interaction.reply({ embeds: [embed], flags: 64 });
      }

      if (getCoins(userId) < bet) {
        const embed = new EmbedBuilder()
          .setTitle("❌ Nicht genug Coins")
          .setDescription(`Du hast nur **${getCoins(userId)} Coins**`)
          .setColor(0xe74c3c);

        return interaction.reply({ embeds: [embed], flags: 64 });
      }

      // Coins abziehen
      addCoins(userId, -bet);

      // 3x3 Grid
      const grid = [
        [randomSymbol(), randomSymbol(), randomSymbol()],
        [randomSymbol(), randomSymbol(), randomSymbol()],
        [randomSymbol(), randomSymbol(), randomSymbol()]
      ];

      let won = false;
      let winnings = 0;

      // Gewinnprüfung Reihen
      for (const row of grid) {
        if (row[0] === row[1] && row[1] === row[2]) {
          won = true;

          if (row[0] === "7️⃣") {
            winnings += bet * 10;
          } else if (row[0] === "⭐") {
            winnings += bet * 5;
          } else {
            winnings += bet * 3;
          }
        }
      }

      // Gewinn auszahlen
      if (won) {
        addCoins(userId, winnings);
      }

      // Embed aufbauen
      const embed = new EmbedBuilder()
        .setTitle("🎰 SLOT RESULT")
        .addFields(
          { name: "\u200b", value: `${grid[0][0]}  ${grid[0][1]}  ${grid[0][2]}` },
          { name: "\u200b", value: `${grid[1][0]}  ${grid[1][1]}  ${grid[1][2]}` },
          { name: "\u200b", value: `${grid[2][0]}  ${grid[2][1]}  ${grid[2][2]}` },
          {
            name: "Ergebnis",
            value: won ? `🎉 Gewonnen: **+${winnings} Coins**` : "❌ Verloren"
          },
          {
            name: "💰 Kontostand",
            value: `${getCoins(userId)} Coins`
          }
        )
        .setColor(won ? 0x2ecc71 : 0xe74c3c);

      return interaction.reply({ embeds: [embed] });

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
