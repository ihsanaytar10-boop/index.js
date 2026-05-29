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
💾 SAVE SYSTEM
━━━━━━━━━━━━━━━━━━━━
*/

let coins = {};

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
  console.log(`✅ Bot online als ${client.user.tag}`);
});

/*
━━━━━━━━━━━━━━━━━━━━
📩 COMMANDS
━━━━━━━━━━━━━━━━━━━━
*/

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const id = message.author.id;

  // 💰 BALANCE
  if (message.content === '!coins') {
    return message.reply(`💰 Du hast **${getCoins(id)} Coins**`);
  }

  // 🎁 DAILY
  if (message.content === '!daily') {

    const now = Date.now();

    if (daily[id] && now - daily[id] < 24 * 60 * 60 * 1000) {
      return message.reply('⏳ Daily schon abgeholt!');
    }

    daily[id] = now;
    addCoins(id, 5000);

    return message.reply('🎁 +5000 Coins erhalten!');
  }

  // 🎰 SLOT
  if (message.content.startsWith('!slot')) {

    let bet = parseInt(message.content.split(' ')[1]);

    if (!bet) return message.reply('❌ !slot <einsatz>');
    if (getCoins(id) < bet) return message.reply('❌ Nicht genug Coins');

    removeCoins(id, bet);

    let msg = await message.reply('🎰 Spinning...');

    let grid;

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

    /*
    ━━━━━━━━━━━━━━━━━━━━━
    🏆 WIN LOGIC + VISUAL LINE
    ━━━━━━━━━━━━━━━━━━━━━
    */

    let win = 0;
    let result = "😢 Verloren";
    let winCells = [];

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
        result = "🔥 GEWINNLINIE!";
        winCells = line;
      }
    }

    // 💎 Bonus
    if (grid.flat().includes('7️⃣')) {
      win += bet * 2;
    }

    // 🎨 VISUAL HIGHLIGHT (LINE MARKED)
    if (winCells.length) {
      for (let [r, c] of winCells) {
        grid[r][c] = `🟡${grid[r][c]}🟡`;
      }
    }

    addCoins(id, win);

    await msg.edit(
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

client.login(process.env.TOKEN);
