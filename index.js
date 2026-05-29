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

/*
━━━━━━━━━━━━━━━━━━━━
💾 STORAGE
━━━━━━━━━━━━━━━━━━━━
*/

const FILE = "./coins.json";

let coins = {};

// LOAD SAFE
function load() {
  try {
    coins = JSON.parse(fs.readFileSync(FILE, "utf8"));
    console.log("📂 Coins geladen");
  } catch {
    coins = {};
    console.log("📂 Neue coins.json erstellt");
  }
}

// SAVE SAFE
function save() {
  fs.writeFileSync(FILE, JSON.stringify(coins, null, 2));
}

// AUTO SAVE (wichtig für Railway)
setInterval(save, 5000);

load();

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
🎰 SLOT SYMBOLS
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
  console.log("✅ Bot online:", client.user.tag);
});

/*
━━━━━━━━━━━━━━━━━━━━
📩 COMMANDS
━━━━━━━━━━━━━━━━━━━━
*/

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  const id = msg.author.id;
  const user = getUser(id);

  // 💰 COINS
  if (msg.content === "!coins") {
    return msg.reply(`💰 Du hast **${user.balance} Coins**`);
  }

  // 🎁 DAILY
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

  // 🎰 SLOT
  if (msg.content.startsWith("!slot")) {
    let bet = parseInt(msg.content.split(" ")[1]);

    if (!bet || bet <= 0) return msg.reply("❌ !slot <einsatz>");
    if (user.balance < bet) return msg.reply("❌ zu wenig Coins");

    user.balance -= bet;
    save();

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
`🎰 SLOT MACHINE 🎰

${grid[0].join(" | ")}
${grid[1].join(" | ")}
${grid[2].join(" | ")}`
      );

      await new Promise(r => setTimeout(r, 250));
    }

    /*
    🏆 WIN CHECK
    */
    let win = 0;
    let result = "😢 Verloren";
    let winLine = null;

    const lines = [
      [[0,0],[0,1],[0,2]],
      [[1,0],[1,1],[1,2]],
      [[2,0],[2,1],[2,2]],
      [[0,0],[1,1],[2,2]],
      [[0,2],[1,1],[2,0]]
    ];

    for (let line of lines) {
      const a = grid[line[0][0]][line[0][1]];
      const b = grid[line[1][0]][line[1][1]];
      const c = grid[line[2][0]][line[2][1]];

      if (a === b && b === c) {
        win = bet * 5;
        result = "🔥 GEWINN!";
        winLine = [a, b, c];
      }
    }

    // BONUS
    if (grid.flat().includes("7️⃣")) {
      win += bet * 2;
    }

    user.balance += win;
    save();

    await message.edit(
`🎰 SLOT MACHINE 🎰

${grid[0].join(" | ")}
${grid[1].join(" | ")}
${grid[2].join(" | ")}

${result}
💰 Gewinn: +${win}
💰 Balance: ${user.balance}

${winLine ? "🍓 GEWINN FRÜCHTE: " + winLine.join(" | ") : ""}`
    );
  }
});

client.login(process.env.TOKEN);
