const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const fruits = ['🍒', '🍋', '🍉', '🍇', '🍓', '🍍', '7️⃣'];

/*
━━━━━━━━━━━━━━━━━━━━
💰 COINS SYSTEM (FIXED)
━━━━━━━━━━━━━━━━━━━━
*/

const coins = {};

function getCoins(id) {
  if (!coins[id]) coins[id] = 1000;
  return coins[id];
}

function addCoins(id, amount) {
  if (!coins[id]) coins[id] = 1000;
  coins[id] += amount;
}

function removeCoins(id, amount) {
  if (!coins[id]) coins[id] = 1000;
  coins[id] -= amount;
}

/*
━━━━━━━━━━━━━━━━━━━━
🎁 DAILY COOLDOWN
━━━━━━━━━━━━━━━━━━━━
*/

const dailyCooldown = {};

/*
━━━━━━━━━━━━━━━━━━━━
🎲 RANDOM
━━━━━━━━━━━━━━━━━━━━
*/

function rand() {
  return fruits[Math.floor(Math.random() * fruits.length)];
}

/*
━━━━━━━━━━━━━━━━━━━━
🤖 READY
━━━━━━━━━━━━━━━━━━━━
*/

client.once('ready', () => {
  console.log(`Online als ${client.user.tag}`);
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
      return message.reply('⏳ Daily schon abgeholt!');
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
    🧠 WIN LOGIC
    ━━━━━━━━━━━━━━━━━━━━━
    */

    let win = 0;
    let result = "😢 Verloren";

    const rows = grid;
    const flat = grid.flat();

    const row1 = rows[0];
    const row2 = rows[1];
    const row3 = rows[2];

    // 🥇 3 gleiche in einer Zeile (GEWINNLINIE)
    if (row1[0] === row1[1] && row1[1] === row1[2]) {
      win += bet * 5;
      result = "🔥 Gewinnlinie 1 (Top Row)";
    }

    if (row2[0] === row2[1] && row2[1] === row2[2]) {
      win += bet * 5;
      result = "🔥 Gewinnlinie 2 (Middle Row)";
    }

    if (row3[0] === row3[1] && row3[1] === row3[2]) {
      win += bet * 5;
      result = "🔥 Gewinnlinie 3 (Bottom Row)";
    }

    // 💎 Diagonale 1
    if (rows[0][0] === rows[1][1] && rows[1][1] === rows[2][2]) {
      win += bet * 8;
      result = "💎 Diagonale Gewinn!";
    }

    // 💎 Diagonale 2
    if (rows[0][2] === rows[1][1] && rows[1][1] === rows[2][0]) {
      win += bet * 8;
      result = "💎 Diagonale Gewinn!";
    }

    // 🔥 Lucky 7 Bonus
    if (flat.includes('7️⃣')) {
      win += bet * 2;
    }

    addCoins(id, win);

    msg.edit(
`🎰 SLOT MACHINE 🎰

${rows[0].join(' | ')}
${rows[1].join(' | ')}
${rows[2].join(' | ')}

${result}
💰 Gewinn: +${win}
💰 Kontostand: ${getCoins(id)}`
    );
  }
});

client.login(process.env.TOKEN);
