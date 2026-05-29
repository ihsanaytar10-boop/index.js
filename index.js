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
💾 COINS SPEICHER (FIX)
━━━━━━━━━━━━━━━━━━━━
*/

let coins = {};

// load coins file
if (fs.existsSync('./coins.json')) {
  coins = JSON.parse(fs.readFileSync('./coins.json'));
}

function saveCoins() {
  fs.writeFileSync('./coins.json', JSON.stringify(coins, null, 2));
}

function getCoins(id) {
  if (!coins[id]) coins[id] = 1000;
  return coins[id];
}

function addCoins(id, amount) {
  if (!coins[id]) coins[id] = 1000;
  coins[id] += amount;
  saveCoins();
}

function removeCoins(id, amount) {
  if (!coins[id]) coins[id] = 1000;
  coins[id] -= amount;
  saveCoins();
}

/*
━━━━━━━━━━━━━━━━━━━━
🎁 DAILY SYSTEM
━━━━━━━━━━━━━━━━━━━━
*/

const dailyCooldown = {};

/*
━━━━━━━━━━━━━━━━━━━━
🎰 SLOT SETTINGS
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
    return message.reply(`💰 Du hast **${getCoins(id)} Coins**`);
  }

  // 🎁 DAILY
  if (message.content === '!daily') {

    const now = Date.now();

    if (dailyCooldown[id] && now - dailyCooldown[id] < 24 * 60 * 60 * 1000) {
      return message.reply('⏳ Du hast dein Daily schon geholt!');
    }

    dailyCooldown[id] = now;
    addCoins(id, 5000);

    return message.reply('🎁 +5000 Coins erhalten!');
  }

  // 🎰 SLOT
  if (message.content.startsWith('!slot')) {

    let bet = parseInt(message.content.split(' ')[1]);

    if (!bet) return message.reply('❌ !slot <einsatz>');
    if (getCoins(id) < bet) return message.reply('❌ Nicht genug Coins!');

    removeCoins(id, bet);

    let msg = await message.reply('🎰 Spinning...');

    let grid;

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

      await new Promise(r => setTimeout(r, 250));
    }

    /*
    ━━━━━━━━━━━━━━━━━━━━━
    🏆 WIN LINES
    ━━━━━━━━━━━━━━━━━━━━━
    */

    let win = 0;
    let result = "😢 Verloren";

    const lines = [
      [grid[0][0], grid[0][1], grid[0][2]],
      [grid[1][0], grid[1][1], grid[1][2]],
      [grid[2][0], grid[2][1], grid[2][2]],
      [grid[0][0], grid[1][1], grid[2][2]],
      [grid[0][2], grid[1][1], grid[2][0]]
    ];

    for (let line of lines) {
      if (line[0] === line[1] && line[1] === line[2]) {
        win += bet * 5;
        result = "🔥 Gewinnlinie getroffen!";
      }
    }

    // Lucky 7 bonus
    if (grid.flat().includes('7️⃣')) {
      win += bet * 2;
    }

    addCoins(id, win);

    msg.edit(
`🎰 SLOT MACHINE 🎰

${grid[0].join(' | ')}
${grid[1].join(' | ')}
${grid[2].join(' | ')}

${result}
💰 Gewinn: +${win}
💰 Kontostand: ${getCoins(id)}`
    );
  }
});

/*
━━━━━━━━━━━━━━━━━━━━
🔑 LOGIN
━━━━━━━━━━━━━━━━━━━━
*/

client.login(process.env.TOKEN);
