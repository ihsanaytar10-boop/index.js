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

// ================= DATA =================

const coins = new Map();
const daily = new Map();

// ================= COINS =================

function getCoins(id) {
  if (!coins.has(id)) coins.set(id, 10000);
  return coins.get(id);
}

function setCoins(id, value) {
  coins.set(id, value);
}

function addCoins(id, amount) {
  setCoins(id, getCoins(id) + amount);
}

// ================= SYMBOLS =================

const symbols = [
  { icon: "🍒", multi: 2 },
  { icon: "🍋", multi: 3 },
  { icon: "🔔", multi: 5 },
  { icon: "💎", multi: 10 },
  { icon: "7️⃣", multi: 25 }
];

const randomSymbol = () =>
  symbols[Math.floor(Math.random() * symbols.length)];

// ================= COMMANDS =================

const commands = [
  new SlashCommandBuilder()
    .setName("slot")
    .setDescription("🎰 Slot Maschine")
    .addIntegerOption(o =>
      o.setName("einsatz")
        .setDescription("Coins setzen")
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
  await rest.put(
    Routes.applicationCommands(CLIENT_ID),
    { body: commands }
  );
  console.log("✅ Commands geladen");
})();

// ================= READY =================

client.once("ready", () => {
  console.log(`${client.user.tag} online`);
});

// ================= HELPERS =================

function makeGrid() {
  return Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => randomSymbol())
  );
}

function formatGrid(grid) {
  const r1 = `${grid[0][0].icon} │ ${grid[0][1].icon} │ ${grid[0][2].icon}`;
  const r2 = `${grid[1][0].icon} │ ${grid[1][1].icon} │ ${grid[1][2].icon}`;
  const r3 = `${grid[2][0].icon} │ ${grid[2][1].icon} │ ${grid[2][2].icon}`;
  return `${r1}\n${r2}\n${r3}`;
}

// ================= SLOT CHECK =================

function checkWins(grid, bet) {
  const lines = [
    [grid[0][0], grid[0][1], grid[0][2]],
    [grid[1][0], grid[1][1], grid[1][2]],
    [grid[2][0], grid[2][1], grid[2][2]],
    [grid[0][0], grid[1][1], grid[2][2]],
    [grid[0][2], grid[1][1], grid[2][0]]
  ];

  let win = 0;

  for (const l of lines) {
    if (l[0].icon === l[1].icon && l[1].icon === l[2].icon) {
      win += bet * l[0].multi;
    }
  }

  return win;
}

// ================= INTERACTION =================

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.channel.id !== ALLOWED_CHANNEL) {
    return interaction.reply({
      content: "❌ Nur im Casino-Channel",
      ephemeral: true
    });
  }

  const id = interaction.user.id;

  // ================= COINS =================

  if (interaction.commandName === "coins") {
    return interaction.reply({
      content: `💰 Du hast **${getCoins(id)} Coins**`,
      ephemeral: true
    });
  }

  // ================= DAILY =================

  if (interaction.commandName === "daily") {
    const now = Date.now();
    const cd = 24 * 60 * 60 * 1000;

    if (daily.has(id) && now - daily.get(id) < cd) {
      const t = cd - (now - daily.get(id));
      const h = Math.floor(t / 3600000);
      const m = Math.floor((t % 3600000) / 60000);

      return interaction.reply({
        content: `⏳ Warte ${h}h ${m}m`,
        ephemeral: true
      });
    }

    addCoins(id, 5000);
    daily.set(id, now);

    return interaction.reply(`🎁 +5000 Coins\n💰 Konto: ${getCoins(id)}`);
  }

  // ================= SLOT =================

  if (interaction.commandName === "slot") {
    const bet = interaction.options.getInteger("einsatz");

    if (bet <= 0)
      return interaction.reply({ content: "❌ Ungültiger Einsatz", ephemeral: true });

    if (getCoins(id) < bet)
      return interaction.reply({ content: "❌ Nicht genug Coins", ephemeral: true });

    addCoins(id, -bet);

    await interaction.reply("🎰 Dreht...");

    // ================= ANIMATION =================

    for (let i = 0; i < 4; i++) {
      const animGrid = makeGrid();
      await interaction.editReply(
        `🎰 Dreht...\n\n\`\`\`\n${formatGrid(animGrid)}\n\`\`\``
      );
      await new Promise(r => setTimeout(r, 500));
    }

    // ================= FINAL =================

    const grid = makeGrid();
    const win = checkWins(grid, bet);

    if (win > 0) addCoins(id, win);

    await interaction.editReply(
`🎰 SLOT RESULT

\`\`\`
${formatGrid(grid)}
\`\`\`

${win > 0 ? `🎉 Gewinn: ${win}` : `❌ Verloren: ${bet}`}

💰 Konto: ${getCoins(id)} Coins`
    );
  }
});

// ================= LOGIN =================

client.login(TOKEN);
