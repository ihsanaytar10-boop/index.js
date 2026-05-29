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
💾 COINS SYSTEM
━━━━━━━━━━━━━━━━━━━━
*/

let coins = {};

if (fs.existsSync('./coins.json')) {
  coins = JSON.parse(fs.readFileSync('./coins.json'));
}

function save() {
  fs.writeFileSync('./coins.json', JSON.stringify(coins, null, 2));
}

function get(id) {
  if (!coins[id]) coins[id] = 1000;
  return coins[id];
}

function add(id, a) {
  if (!coins[id]) coins[id] = 1000;
  coins[id] += a;
  save();
}

function remove(id, a) {
  if (!coins[id]) coins[id] = 1000;
  coins[id] -= a;
  save();
}

/*
━━━━━━━━━━━━━━━━━━━━
🎁 DAILY
━━━━━━━━━━━━━━━━━━━━
*/

const daily = {};

/*
━━━━━━━━━━━━━━━━━━━━
🎰 SLOT
━━━━━━━━━━━━━━━━━━━━
*/

const fruits = ['🍒', '🍋', '🍉', '🍇', '🍓', '🍍', '7️⃣'];

function rand() {
  return fruits[Math.floor(Math.random() * fruits.length)];
}

/*
━━━━━━━━━━━━━━━━━━━━
🤖 READY
━━━━━━━━━━━━━━━━━━━━
*/

client.once('ready', () => {
  console.log(`✅ Online als ${client.user.tag}`);
});

/*
━━━━━━━━━━━━━━━━━━━━
📩 COMMANDS
━━━━━━━━━━━━━━━━━━━━
*/

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const id = message.author.id;

  // 💰 COINS
  if (message.content === '!coins') {
    return message.reply(`💰 ${get(id)} Coins`);
  }

  // 🎁 DAILY
  if (message.content === '!daily') {

    const now = Date.now();

    if (daily[id] && now - daily[id] < 86400000) {
      return message.reply('⏳ Schon geholt!');
    }

    daily[id] = now;
    add(id, 5000);

    return message.reply('🎁 +5000 Coins');
  }

  // 🎰 SLOT
  if (message.content.startsWith('!slot')) {

    let bet = parseInt(message.content.split(' ')[1]);

    if (!bet) return message.reply('❌ !slot <einsatz>');
    if (get(id) < bet) return message.reply('❌ Zu wenig Coins');

    remove(id, bet);

    let msg = await message.reply('🎰 Spinning...');

    let grid;
    let winLine = null;

    // 🎯 35% Win Chance
    let willWin = Math.random() < 0.35;

    const lines = [
      [[0,0],[0,1],[0,2]],
      [[1,0],[1,1],[1,2]],
      [[2,0],[2,1],[2,2]],
      [[0,0],[1,1],[2,2]],
      [[0,2],[1,1],[2,0]]
    ];

    if (willWin) {
      winLine = lines[Math.floor(Math.random() * lines.length)];
    }

    // 🎰 ANIMATION
    for (let i = 0; i < 8; i++) {

      grid = [
        [rand(), rand(), rand()],
        [rand(), rand(), rand()],
        [rand(), rand(), rand()]
      ];

      await msg.edit(
`🎰 SLOT MACHINE 🎰

${grid[0].join(' | ')}
${grid[1].join(' | ')}
${grid[2].join(' | ')}`
      );

      await new Promise(r => setTimeout(r, 200));
    }

    // 🏆 WIN FORCE LINE
    let win = 0;
    let result = "😢 Verloren";

    if (winLine) {

      let symbol = rand();

      for (let [r, c] of winLine) {
        grid[r][c] = symbol;
      }

      win = bet * 5;
      result = "🔥 GEWINNLINIE!";
    }

    // 💎 BONUS
    if (grid.flat().includes('7️⃣')) {
      win += bet * 2;
    }

    add(id, win);

    await msg.edit(
`🎰 SLOT MACHINE 🎰

${grid[0].join(' | ')}
${grid[1].join(' | ')}
${grid[2].join(' | ')}

${result}
💰 +${win}
💰 Total: ${get(id)}`
    );
  }
});

client.login(process.env.TOKEN);
