const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder
} = require("discord.js");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== COINS =====

const coins = new Map();

function getCoins(userId) {

  if (!coins.has(userId)) {
    coins.set(userId, 10000);
  }

  return coins.get(userId);
}

function addCoins(userId, amount) {
  coins.set(userId, getCoins(userId) + amount);
}

// ===== SYMBOLS =====

const symbols = [
  { icon: "🍋", multi: 1.5 },
  { icon: "🍒", multi: 2 },
  { icon: "🔔", multi: 5 },
  { icon: "BAR", multi: 10 },
  { icon: "7️⃣", multi: 25 }
];

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

// ===== SLASH COMMAND =====

const commands = [
  new SlashCommandBuilder()
    .setName("slot")
    .setDescription("🎰 Spiel Slot")
    .addIntegerOption(option =>
      option
        .setName("einsatz")
        .setDescription("Coins setzen")
        .setRequired(true)
    )
].map(command => command.toJSON());

// ===== REGISTER =====

const rest = new REST({ version: "10" }).setToken(TOKEN);

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

// ===== READY =====

client.once("ready", () => {
  console.log(`${client.user.tag} online`);
});

// ===== SLOT =====

client.on("interactionCreate", async interaction => {

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName !== "slot") return;

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
      content: "❌ Nicht genug Coins.",
      ephemeral: true
    });
  }

  addCoins(userId, -bet);

  await interaction.reply("🎰 Dreht...");

  // Animation
  for (let i = 0; i < 4; i++) {

    const a = randomSymbol().icon;
    const b = randomSymbol().icon;
    const c = randomSymbol().icon;

    await new Promise(r => setTimeout(r, 700));

    await interaction.editReply(
      `🎰 | ${a} | ${b} | ${c} |`
    );
  }

  // Final
  const s1 = randomSymbol();
  const s2 = randomSymbol();
  const s3 = randomSymbol();

  let winnings = 0;

  if (
    s1.icon === s2.icon &&
    s2.icon === s3.icon
  ) {

    winnings = Math.floor(
      bet * s1.multi
    );

    addCoins(userId, winnings);
  }

  const embed = new EmbedBuilder()
    .setTitle("🎰 SLOT RESULT")
    .setDescription(
      `| ${s1.icon} | ${s2.icon} | ${s3.icon} |`
    )
    .addFields(
      {
        name: "💰 Ergebnis",
        value:
          winnings > 0
            ? `Gewonnen: ${winnings}`
            : `Verloren: ${bet}`
      },
      {
        name: "🪙 Coins",
        value: `${getCoins(userId)}`
      }
    )
    .setColor(
      winnings > 0
        ? "Gold"
        : "Red"
    );

  await interaction.editReply({
    content: "",
    embeds: [embed]
  });

});

// ===== LOGIN =====

client.login(TOKEN);
