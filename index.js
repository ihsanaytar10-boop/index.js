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

// Nur dieser Channel
const ALLOWED_CHANNEL = "1509425466782646342";

// ================= BOT =================

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ================= COINS =================

const coins = new Map();

function getCoins(userId) {
  if (!coins.has(userId)) coins.set(userId, 10000);
  return coins.get(userId);
}

function setCoins(userId, value) {
  coins.set(userId, value);
}

function addCoins(userId, amount) {
  setCoins(userId, getCoins(userId) + amount);
}

// ================= SYMBOLS =================

const symbols = [
  { icon: "🍋", multi: 2 },
  { icon: "🍒", multi: 3 },
  { icon: "🔔", multi: 5 },
  { icon: "💎", multi: 10 },
  { icon: "7️⃣", multi: 25 }
];

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

// ================= DAILY =================

const dailyCooldown = new Map();

// ================= COMMANDS =================

const commands = [
  new SlashCommandBuilder()
    .setName("slot")
    .setDescription("🎰 Slot Maschine")
    .addIntegerOption(opt =>
      opt.setName("einsatz")
        .setDescription("Einsatz")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("coins")
    .setDescription("💰 Coins anzeigen"),

  new SlashCommandBuilder()
    .setName("daily")
    .setDescription("🎁 Daily holen")
].map(c => c.toJSON());

// ================= REGISTER =================

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

// ================= INTERACTION =================

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // CHANNEL LOCK
  if (interaction.channel.id !== ALLOWED_CHANNEL) {
    return interaction.reply({
      content: "❌ Nur im Casino-Channel nutzbar.",
      ephemeral: true
    });
  }

  const userId = interaction.user.id;

  // ================= COINS =================

  if (interaction.commandName === "coins") {
    return interaction.reply({
      content: `💰 Du hast **${getCoins(userId)} Coins**`,
      ephemeral: true
    });
  }

  // ================= DAILY =================

  if (interaction.commandName === "daily") {
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;

    if (dailyCooldown.has(userId) && now - dailyCooldown.get(userId) < cooldown) {
      const remaining = cooldown - (now - dailyCooldown.get(userId));
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);

      return interaction.reply({
        content: `⏳ Schon geholt. Warte ${h}h ${m}m`,
        ephemeral: true
      });
    }

    addCoins(userId, 5000);
    dailyCooldown.set(userId, now);

    return interaction.reply({
      content: `🎁 +5000 Coins\n💰 Konto: ${getCoins(userId)}`
    });
  }

  // ================= SLOT =================

  if (interaction.commandName === "slot") {
    const bet = interaction.options.getInteger("einsatz");

    if (bet <= 0) {
      return interaction.reply({ content: "❌ Ungültiger Einsatz", ephemeral: true });
    }

    if (getCoins(userId) < bet) {
      return interaction.reply({
        content: "❌ Nicht genug Coins",
        ephemeral: true
      });
    }

    addCoins(userId, -bet);

    await interaction.reply("🎰 Dreht...");

    // ================= ANIMATION =================

    for (let i = 0; i < 4; i++) {
      const anim = [
        `${randomSymbol().icon} │ ${randomSymbol().icon} │ ${randomSymbol().icon}`,
        `${randomSymbol().icon} │ ${randomSymbol().icon} │ ${randomSymbol().icon}`,
        `${randomSymbol().icon} │ ${randomSymbol().icon} │ ${randomSymbol().icon}`
      ].join("\n");

      await interaction.editReply(`🎰 Dreht...\n\`\`\`\n${anim}\n\`\`\``);
      await new Promise(r => setTimeout(r, 500));
    }

    // ================= GRID =================

    const grid = Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () => randomSymbol())
    );

    // ================= WIN CHECK =================

    const lines = [
      [grid[0][0], grid[0][1], grid[0][2]],
      [grid[1][0], grid[1][1], grid[1][2]],
      [grid[2][0], grid[2][1], grid[2][2]],
      [grid[0][0], grid[1][1], grid[2][2]],
      [grid[0][2], grid[1][1], grid[2][0]]
    ];

    let winnings = 0;

    for (const line of lines) {
      if (
        line[0].icon === line[1].icon &&
        line[1].icon === line[2].icon
      ) {
        winnings += bet * line[0].multi;
      }
    }

    if (winnings > 0) addCoins(userId, winnings);

    // ================= OUTPUT FIX =================

    const finalGrid = [
      `${grid[0][0].icon} │ ${grid[0][1].icon} │ ${grid[0][2].icon}`,
      `${grid[1][0].icon} │ ${grid[1][1].icon} │ ${grid[1][2].icon}`,
      `${grid[2][0].icon} │ ${grid[2][1].icon} │ ${grid[2][2].icon}`
    ].join("\n");

    return interaction.editReply(
`🎰 SLOT RESULT

\`\`\`
${finalGrid}
\`\`\`

${winnings > 0
  ? `🎉 Gewinn: ${winnings} Coins`
  : `❌ Verloren: ${bet} Coins`
}

🪙 Konto: ${getCoins(userId)} Coins`
    );
  }
});

// ================= LOGIN =================

client.login(TOKEN);
