console.log("🎰 CASINO BOT START");

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

/*
━━━━━━━━━━━━━━━━━━━━
💾 STORAGE
━━━━━━━━━━━━━━━━━━━━
*/

let coins = {};

function load() {
  try {
    coins = JSON.parse(fs.readFileSync(FILE, "utf8"));
    console.log("📂 Coins geladen");
  } catch {
    coins = {};
    console.log("📂 Neue coins.json erstellt");
  }
}

function save() {
  fs.writeFileSync(FILE, JSON.stringify(coins, null, 2));
}

load();
setInterval(save, 5000);

/*
━━━━━━━━━━━━━━━━━━━━
💰 USER SYSTEM
━━━━━━━━━━━━━━━━━━━━
*/

function getUser(id) {
  if (!coins[id]) {
    coins[id] = {
      balance: 1000,
      lastDaily: 0
    };
  }
  return coins[id];
}

/*
━━━━━━━━━━━━━━━━━━━━
🎰 SYMBOLS
━━━━━━━━━━━━━━━━━━━━
*/

const symbols = ["🍒", "🍋", "🍉", "🍇", "🍓", "🍍", "7️⃣"];
const rand = () => symbols[Math.floor(Math.random() * symbols.length)];

/*
━━━━━━━━━━━━━━━━━━━━
🤖 READY
━━━━━━━━━━━━━━━━━━━━
*/

client.once("ready", () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
});

/*
━━━━━━━━━━━━━━━━━━━━
📩 COMMANDS
━━━━━━━━━━━━━━━━━━━━
*/

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  const user = getUser(msg.author.id);

  /*
  💰 COINS
  */
  if (msg.content === "!coins") {
    return msg.reply(`💰 Coins: ${user.balance}`);
  }

  /*
  🎁 DAILY
  */
  if (msg.content === "!daily") {
    const now = Date.now();

    if (now - user.lastDaily < 86400000) {
      return msg.reply("⏳ Daily schon geholt!");
    }

    user.balance += 5000;
    user.lastDaily = now;
    save();

    return msg.reply("🎁 +5000 Coins erhalten!");
  }

  /*
  🎰 SLOT MACHINE
  */
  if (msg.content.startsWith("!slot")) {
    const bet = parseInt(msg.content.split(" ")[1]);

    if (!bet || bet <= 0) return msg.reply("❌ !slot <einsatz>");
    if (user.balance < bet) return msg.reply("❌ zu wenig Coins");

    user.balance -= bet;

    let message = await msg.reply("🎰 Spinning...");

    let grid;

    // 🎬 ANIMATION
    for (let i = 0; i < 6; i++) {
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

      await new Promise(r => setTimeout(r, 250));
    }

    /*
    🏆 WIN LOGIC
    */
    let win = 0;
    let result = "😢 Verloren";
    let winLine = null;

    const middle = grid[1];

    if (middle[0] === middle[1] && middle[1] === middle[2]) {
      win = bet * 5;
      result = "🔥 GEWINN!";
      winLine = middle;
    }

    if (grid.flat().includes("7️⃣")) {
      win += bet * 2;
    }

    user.balance += win;
    save();

    await message.edit(
`🎰 SLOT 🎰

${grid[0].join(" | ")}
${grid[1].join(" | ")}
${grid[2].join(" | ")}

${result}
💰 Gewinn: +${win}
💰 Coins: ${user.balance}

${winLine ? "🍓 GEWINN FRÜCHTE: " + winLine.join(" | ") : ""}`
    );
  }
});

client.login(process.env.TOKEN);
