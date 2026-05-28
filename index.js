const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const coins = new Map();
const symbols = ["🍒", "🍋", "⭐", "7️⃣"];

function getCoins(id) {
  if (!coins.has(id)) coins.set(id, 1000);
  return coins.get(id);
}

const commands = [
  new SlashCommandBuilder()
    .setName("slot")
    .setDescription("Slot spielen")
    .addIntegerOption(o =>
      o.setName("einsatz")
       .setDescription("Coins")
       .setRequired(true)
    )
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
  console.log("Bot online");
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "slot") {

    const user = interaction.user.id;
    const bet = interaction.options.getInteger("einsatz");

    if (bet <= 0 || getCoins(user) < bet) {
      return interaction.reply({
        content: "❌ Fehler"
      });
    }

    coins.set(user, getCoins(user) - bet);

    const r = () =>
      symbols[Math.floor(Math.random() * symbols.length)];

    const a = r();
    const b = r();
    const c = r();

    const d = r();
    const e = r();
    const f = r();

    const g = r();
    const h = r();
    const i = r();

    let text = "❌ Verloren";

    if (d === e && e === f) {
      coins.set(user, getCoins(user) + bet * 3);
      text = "🎉 Gewonnen";
    }

    interaction.reply({
      content:
`🎰

${a} ${b} ${c}
${d} ${e} ${f}
${g} ${h} ${i}

${text}

💰 ${getCoins(user)}`
    });
  }
});

client.login(TOKEN);
