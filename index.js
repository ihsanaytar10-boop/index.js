console.log("🔥 CASINO BOT START (STABLE JSON FIX)");

const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

/*
━━━━━━━━━━━━━━━━━━━━
💾 STORAGE FIX (IMPORTANT)
━━━━━━━━━━━━━━━━━━━━
*/

const FILE = './coins.json';

let coins = {};

// LOAD
function load() {
  try {
    coins = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    coins = {};
  }
}
load();

// SAVE (SAFE VERSION)
function save() {
  fs.writeFileSync(FILE, JSON.stringify(coins, null, 2));
}

// AUTO BACKUP (VERY IMPORTANT FOR RAILWAY)
setInterval(() => {
  save();
}, 10000);

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
🎰 SLOT SYSTEM
━━━━━━━━━━━━━━━━━━━━
*/

const symbols = ['🍒','🍋','🍉','🍇','🍓','🍍','7️⃣'];
const rand = () => symbols[Math.floor(Math.random() * symbols.length)];

client.once('ready', () => {
  console.log(`🎰 Online als ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  const id = msg.author.id;
  const user = getUser(id);

  /*
  💰 COINS
  */
  if (msg.content === '!coins') {
    return msg.reply(`💰 Du hast **${user.balance} Coins**`);
  }

  /*
  🎁 DAILY
  */
  if (msg.content === '!daily') {
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
  🎰 SLOT
  */
  if (msg.content.startsWith('!slot')) {

    let bet = parseInt(msg.content.split(' ')[1]);
    if (!bet) return msg.reply("❌ !slot <einsatz>");

    if (user.balance < bet) {
      return msg.reply("❌ zu wenig Coins");
    }

    user.balance -= bet;
    save();

    let message = await msg.reply("🎰 Spinning...");

    let grid;

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

      await new Promise(r => setTimeout(r, 200));
    }

    /*
    🏆 WIN LOGIC
    */
    let win = 0;
    let winRow = null;
    let result = "😢 Verloren";

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
        winRow = [a, b, c];
        result = "🔥 GEWINN!";
      }
    }

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
💰 Kontostand: ${user.balance}

${winRow ? "🎉 GEWINN: " + winRow.join(" | ") : ""}`
    );
  }
});

client.login(process.env.TOKEN);
