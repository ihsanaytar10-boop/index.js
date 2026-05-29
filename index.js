console.log("🎰 SLOT BOT START");

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

let coins = {};
try {
  coins = JSON.parse(fs.readFileSync(FILE, "utf8"));
} catch {
  coins = {};
}

function save() {
  fs.writeFileSync(FILE, JSON.stringify(coins, null, 2));
}

function get(id) {
  if (!coins[id]) coins[id] = { balance: 1000 };
  return coins[id];
}

const fruits = ["🍒", "🍋", "🍉", "🍇", "🍓", "🍍"];

const rand = () => fruits[Math.floor(Math.random() * fruits.length)];

client.once("ready", () => {
  console.log("✅ Bot online:", client.user.tag);
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  const user = get(msg.author.id);

  // COINS
  if (msg.content === "!coins") {
    return msg.reply(`💰 ${user.balance} Coins`);
  }

  // SLOT
  if (msg.content.startsWith("!slot")) {
    const bet = parseInt(msg.content.split(" ")[1]);
    if (!bet) return msg.reply("❌ !slot <einsatz>");
    if (user.balance < bet) return msg.reply("❌ zu wenig Coins");

    user.balance -= bet;

    let message = await msg.reply("🎰 Start...");

    let grid;

    // 🎬 ANIMATION
    for (let i = 0; i < 5; i++) {
      grid = [
        [rand(), rand(), rand()],
        [rand(), rand(), rand()],
        [rand(), rand(), rand()]
      ];

      await message.edit(
`🎰 SLOT 🎰

${grid[0].join(" | ")}
${grid[1].join(" | ")}
${grid[2].join(" | ")}`
      );

      await new Promise(r => setTimeout(r, 300));
    }

    // 🏆 WIN CHECK
    let win = 0;
    let winLine = null;
    let result = "😢 Verloren";

    const line = grid[1];

    if (line[0] === line[1] && line[1] === line[2]) {
      win = bet * 5;
      result = "🔥 GEWINN!";
      winLine = line;
    }

    user.balance += win;
    save();

    // 🎯 FINAL OUTPUT
    await message.edit(
`🎰 SLOT 🎰

${grid[0].join(" | ")}
${grid[1].join(" | ")}
${grid[2].join(" | ")}

${result}
💰 +${win}
💰 Balance: ${user.balance}

${winLine ? "🍓 GEWONNENE FRÜCHTE: " + winLine.join(" | ") : ""}`
    );
  }
});

client.login(process.env.TOKEN);
