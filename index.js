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
💾 SAFE STORAGE
━━━━━━━━━━━━━━━━━━━━
*/

const FILE = './coins.json';

let coins = {};

function load() {
  try {
    coins = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    coins = {};
  }
}

function save() {
  fs.writeFileSync(FILE, JSON.stringify(coins, null, 2));
}

load();

/*
━━━━━━━━━━━━━━━━━━━━
💰 COINS
━━━━━━━━━━━━━━━━━━━━
*/

function get(id) {
  if (!coins[id]) coins[id] = 1000;
  return coins[id];
}

function add(id, amt) {
  if (!coins[id]) coins[id] = 1000;
  coins[id] += amt;
  save();
}

function remove(id, amt) {
  if (!coins[id]) coins[id] = 1000;
  coins[id] -= amt;
  save();
}

/*
━━━━━━━━━━━━━━━━━━━━
🎰 SLOT
━━━━━━━━━━━━━━━━━━━━
*/

const fruits = ['🍒','🍋','🍉','🍇','🍓','🍍','7️⃣'];

const rand = () => fruits[Math.floor(Math.random()*fruits.length)];

/*
━━━━━━━━━━━━━━━━━━━━
🤖 BOT READY
━━━━━━━━━━━━━━━━━━━━
*/

client.once('ready', () => {
  console.log("BOT ONLINE ✔");
});

/*
━━━━━━━━━━━━━━━━━━━━
🎮 COMMANDS
━━━━━━━━━━━━━━━━━━━━
*/

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  const id = msg.author.id;

  // 💰 BALANCE
  if (msg.content === '!coins') {
    return msg.reply(`💰 ${get(id)} Coins`);
  }

  // 🎁 DAILY (simpel, kein Cooldown Speicher)
  if (msg.content === '!daily') {
    add(id, 5000);
    return msg.reply('🎁 +5000 Coins');
  }

  // 🎰 SLOT
  if (msg.content.startsWith('!slot')) {

    let bet = parseInt(msg.content.split(' ')[1]);

    if (!bet) return msg.reply("❌ !slot <einsatz>");
    if (get(id) < bet) return msg.reply("❌ zu wenig Coins");

    remove(id, bet);

    let message = await msg.reply("🎰 spinning...");

    let grid;

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

      await new Promise(r => setTimeout(r, 200));
    }

    /*
    ━━━━━━━━━━━━━━━━━━━━━
    🏆 WIN CHECK (EINFACH + STABIL)
    ━━━━━━━━━━━━━━━━━━━━━
    */

    let win = 0;
    let result = "😢 verloren";

    const check = (a,b,c) => a === b && b === c;

    // Reihen
    if (check(...grid[0])) { win = bet * 5; result = "🔥 Reihe oben"; }
    else if (check(...grid[1])) { win = bet * 5; result = "🔥 Reihe mitte"; }
    else if (check(...grid[2])) { win = bet * 5; result = "🔥 Reihe unten"; }

    // Diagonale
    else if (grid[0][0] === grid[1][1] && grid[1][1] === grid[2][2]) {
      win = bet * 8;
      result = "💎 Diagonale!";
    }
    else if (grid[0][2] === grid[1][1] && grid[1][1] === grid[2][0]) {
      win = bet * 8;
      result = "💎 Diagonale!";
    }

    // Bonus
    if (grid.flat().includes("7️⃣")) win += bet * 2;

    add(id, win);

    await message.edit(
`🎰 SLOT 🎰

${grid[0].join(" | ")}
${grid[1].join(" | ")}
${grid[2].join(" | ")}

${result}
💰 +${win}
💰 ${get(id)} Coins`
    );
  }
});

client.login(process.env.TOKEN);
