console.log("🔥 CASINO BOT STARTED");

const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const FILE = "./coins.json";

// LOAD
let coins = {};
try {
  coins = JSON.parse(fs.readFileSync(FILE, "utf8"));
} catch {
  coins = {};
}

// SAVE
function save() {
  fs.writeFileSync(FILE, JSON.stringify(coins, null, 2));
}

// USER
function getUser(id) {
  if (!coins[id]) coins[id] = { balance: 1000 };
  return coins[id];
}

// SYMBOLS
const symbols = ["🍒", "🍋", "🍉", "🍇", "🍓", "🍍", "7️⃣"];
const rand = () => symbols[Math.floor(Math.random() * symbols.length)];

client.once("ready", () => {
  console.log("🎰 Bot online:", client.user.tag);
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  const user = getUser(msg.author.id);

  // COINS
  if (msg.content === "!coins") {
    return msg.reply(`💰 Coins: ${user.balance}`);
  }

  // SLOT
  if (msg.content.startsWith("!slot")) {
    let bet = parseInt(msg.content.split(" ")[1]);

    if (!bet || bet <= 0) return msg.reply("❌ !slot <einsatz>");
    if (user.balance < bet) return msg.reply("❌ zu wenig Coins");

    user.balance -= bet;

    let grid = [];

    for (let i = 0; i < 3; i++) {
      grid.push([rand(), rand(), rand()]);
    }

    let win = 0;
    let result = "😢 verloren";

    // einfache win line (3 gleiche in middle row)
    if (grid[1][0] === grid[1][1] && grid[1][1] === grid[1][2]) {
      win = bet * 5;
      result = "🔥 GEWONNEN!";
    }

    user.balance += win;
    save();

    return msg.reply(
`🎰 SLOT 🎰

${grid[0].join(" | ")}
${grid[1].join(" | ")}
${grid[2].join(" | ")}

${result}
💰 +${win}
💰 Balance: ${user.balance}`
    );
  }
});

client.login(process.env.TOKEN);
