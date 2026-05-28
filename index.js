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

// NUR DIESER CHANNEL
const ALLOWED_CHANNEL = "1509425466782646342";

// ================= BOT =================

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ================= COINS =================

const coins = new Map();

function getCoins(userId) {

  if (!coins.has(userId)) {
    coins.set(userId, 10000);
  }

  return coins.get(userId);
}

function addCoins(userId, amount) {

  coins.set(
    userId,
    getCoins(userId) + amount
  );
}

// ================= SYMBOLS =================

const symbols = [
  { icon: "🍋", multi: 2 },
  { icon: "🍒", multi: 3 },
  { icon: "🔔", multi: 5 },
  { icon: "BAR", multi: 10 },
  { icon: "7️⃣", multi: 25 }
];

function randomSymbol() {

  return symbols[
    Math.floor(Math.random() * symbols.length)
  ];
}

// ================= DAILY =================

const dailyCooldown = new Map();

// ================= REGELN =================

const rulesText = `
🎰 **SLOT REGELN**

💰 Spielen:
\`/slot einsatz:100\`

━━━━━━━━━━━━━━━━━━

🎯 Gewinn bei:

➡️ 3 gleiche horizontal
➡️ 3 gleiche diagonal

━━━━━━━━━━━━━━━━━━

💎 Multiplikatoren:

🍋 = x2
🍒 = x3
🔔 = x5
BAR = x10
7️⃣ = x25

━━━━━━━━━━━━━━━━━━

🎁 DAILY:
\`/daily\`

Gibt alle 24h:
5000 Coins

━━━━━━━━━━━━━━━━━━

💸 Verlierst du:
→ Einsatz weg

🏆 Gewinnst du:
→ Coins automatisch addiert

━━━━━━━━━━━━━━━━━━

🪙 Startcoins:
10000
`;

// ================= COMMANDS =================

const commands = [

  new SlashCommandBuilder()
    .setName("slot")
    .setDescription("🎰 3x3 Slotmaschine")
    .addIntegerOption(option =>
      option
        .setName("einsatz")
        .setDescription("Coins setzen")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("coins")
    .setDescription("💰 Zeigt deine Coins"),

  new SlashCommandBuilder()
    .setName("daily")
    .setDescription("🎁 Tägliche Coins"),

  new SlashCommandBuilder()
    .setName("slotregeln")
    .setDescription("📜 Zeigt die Regeln")

].map(c => c.toJSON());

// ================= REGISTER =================

const rest = new REST({
  version: "10"
}).setToken(TOKEN);

(async () => {

  try {

    console.log("Lade Commands...");

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

  // ================= CHANNEL CHECK =================

  if (interaction.channel.id !== ALLOWED_CHANNEL) {

    return interaction.reply({
      content: "❌ Der Bot funktioniert nur im Casino-Channel.",
      ephemeral: true
    });
  }

  // ================= REGELN =================

  if (interaction.commandName === "slotregeln") {

    const embed = new EmbedBuilder()
      .setTitle("📜 SLOT REGELN")
      .setDescription(rulesText)
      .setColor("Gold");

    return interaction.reply({
      embeds: [embed]
    });
  }

  // ================= COINS =================

  if (interaction.commandName === "coins") {

    return interaction.reply({
      content: `💰 Du hast ${getCoins(interaction.user.id)} Coins`,
      ephemeral: true
    });
  }

  // ================= DAILY =================

  if (interaction.commandName === "daily") {

    const userId = interaction.user.id;

    const now = Date.now();

    const cooldown = 24 * 60 * 60 * 1000;

    if (
      dailyCooldown.has(userId) &&
      now - dailyCooldown.get(userId) < cooldown
    ) {

      const remaining =
        cooldown - (now - dailyCooldown.get(userId));

      const hours = Math.floor(
        remaining / (1000 * 60 * 60)
      );

      const minutes = Math.floor(
        (remaining % (1000 * 60 * 60))
        / (1000 * 60)
      );

      return interaction.reply({
        content:
`⏳ Du hast dein Daily schon geholt.

Warte:
${hours}h ${minutes}m`,
        ephemeral: true
      });
    }

    addCoins(userId, 5000);

    dailyCooldown.set(userId, now);

    return interaction.reply({
      content:
`🎁 Du hast 5000 Coins erhalten!

💰 Kontostand:
${getCoins(userId)} Coins`
    });
  }

  // ================= SLOT =================

  if (interaction.commandName === "slot") {

    const bet = interaction.options.getInteger("einsatz");

    const userId = interaction.user.id;

    if (bet <= 0) {

      return interaction.reply({
        content: "❌ Ungültiger Einsatz.",
        ephemeral: true
      });
    }

    if (getCoins(userId) < bet) {

      return interaction.reply({
        content:
`❌ Nicht genug Coins.

Nutze:
/daily`,
        ephemeral: true
      });
    }

    // COINS ABZIEHEN
    addCoins(userId, -bet);

    await interaction.reply("🎰 Dreht...");

    // ================= ANIMATION =================

    for (let i = 0; i < 5; i++) {

      const tempGrid = [];

      for (let row = 0; row < 3; row++) {

        let rowText = "";

        for (let col = 0; col < 3; col++) {

          rowText += randomSymbol().icon + " ";

        }

        tempGrid.push(rowText);

      }

      await interaction.editReply({
        content:
`🎰 Dreht...

\`\`\`
${tempGrid.join("\n")}
\`\`\``
      });

      await new Promise(r => setTimeout(r, 500));
    }

    // ================= FINAL GRID =================

    const grid = [];

    for (let row = 0; row < 3; row++) {

      const currentRow = [];

      for (let col = 0; col < 3; col++) {

        currentRow.push(randomSymbol());

      }

      grid.push(currentRow);
    }

    // ================= WIN CHECK =================

    const lines = [

      // horizontal
      [grid[0][0], grid[0][1], grid[0][2]],
      [grid[1][0], grid[1][1], grid[1][2]],
      [grid[2][0], grid[2][1], grid[2][2]],

      // diagonal
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

    // GEWINN GEBEN

    if (winnings > 0) {

      addCoins(userId, winnings);

    }

    // ================= FINAL GRID =================

    const finalGrid =
`╔════════════════════╗
║ ${grid[0][0].icon} │ ${grid[0][1].icon} │ ${grid[0][2].icon} ║
║────────────────────║
║ ${grid[1][0].icon} │ ${grid[1][1].icon} │ ${grid[1][2].icon} ║
║────────────────────║
║ ${grid[2][0].icon} │ ${grid[2][1].icon} │ ${grid[2][2].icon} ║
╚════════════════════╝`;

    // ================= EMBED =================

    const embed = new EmbedBuilder()
      .setTitle("🎰 SLOT RESULT")
      .setDescription(
`# 🎰 SLOT MACHINE

\`\`\`
${finalGrid}
\`\`\`

━━━━━━━━━━━━━━━━━━

${
  winnings > 0
    ? `🎉 Gewinn: ${winnings} Coins`
    : `❌ Verloren: ${bet} Coins`
}

🪙 Kontostand:
${getCoins(userId)} Coins`
      )
      .setColor(
        winnings > 0
          ? "Gold"
          : "Red"
      );

    // ================= SEND =================

    await interaction.editReply({

      content: "",

      embeds: [embed]

    });
  }
});

// ================= LOGIN =================

client.login(TOKEN);
