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

const coins = new Map();
const symbols = ["🍒", "🍋", "🔔", "⭐", "7️⃣"];

function getCoins(id) {
  if (!coins.has(id)) coins.set(id, 1000);
  return coins.get(id);
}

function addCoins(id, amount) {
  coins.set(id, getCoins(id) + amount);
}

// COMMANDS
const commands = [
  new SlashCommandBuilder()
    .setName("slot")
    .setDescription("🎰 Slot")
    .addIntegerOption(opt =>
      opt
        .setName("einsatz")
        .setDescription("Coins")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("coins")
    .setDescription("💰 Kontostand")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  await rest.put(
    Routes.applicationCommands(CLIENT_ID),
    { body: commands }
  );

  console.log("Commands geladen");
})();

client.once("clientReady", () => {
  console.log(`${client.user.tag} online`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id;

  // COINS
  if (interaction.commandName === "coins") {
    return interaction.reply({
      content: `💰 Coins: ${getCoins(userId)}`,
      flags: 64
    });
  }

  // SLOT
  if (interaction.commandName === "slot") {
    const bet = interaction.options.getInteger("einsatz");

    if (bet <= 0 || getCoins(userId) < bet) {
      return interaction.reply({
        content: "❌ Ungültiger Einsatz",
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

    let won = false;
    let reward = 0;

    // Reihen prüfen
    for (const row of grid) {
      if (row[0] === row[1] && row[1] === row[2]) {
        won = true;
        reward += bet * 3;
      }
    }

    if (won) addCoins(userId, reward);

    const text = `
🎰 SLOT

\`\`\`
${grid[0][0]} | ${grid[0][1]} | ${grid[0][2]}
${grid[1][0]} | ${grid[1][1]} | ${grid[1][2]}
${grid[2][0]} | ${grid[2][1]} | ${grid[2][2]}
\`\`\`

${won ? `🎉 Gewonnen: ${reward}` : "❌ Verloren"}

💰 Kontostand: ${getCoins(userId)}
`;

    interaction.reply({
      content: text
    });
  }
});

client.login(TOKEN);
