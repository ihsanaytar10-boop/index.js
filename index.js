console.log("BOT STARTET JETZT");
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
💾 STORAGE (RESTART SAFE)
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
💰 COINS SYSTEM
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
🎁 DAILY
━━━━━━━━━━━━━━━━━━━━
*/

const daily = {};

/*
━━━━━━━━━━━━━━━━━━━━
🎰 SLOT SYSTEM
━━━━━━━━━━━━━━━━━━━━
*/

const symbols = ['🍒','🍋','🍉','🍇','🍓','🍍','7️⃣'];

const rand = () => symbols[Math.floor(Math.random() * symbols.length)];

/*
━━━━━━━━━━━━━━━━━━━━
🤖 READY
━━━━━━━━━━━━━━━━━━━━
*/

client.once('ready', () => {
  console.log(`🎰 Casino Bot online: ${client.user.tag}`);
});

/*
━━━━━━━━━━━━━━━━━━━━
📩 COMMANDS
━━━━━━━━━━━━━━━━━━━━
*/

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  const id = msg.author.id;

  /*
  ━━━━━━━━━━━━━━━━━━━━
  💰 COINS
  ━━━━━━━━━━━━━━━━━━━━
  */

  if (msg.content === '!coins') {
    return msg.reply(`💰 Du hast **${get(id)} Coins**`);
  }

  /*
  ━━━━━━━━━━━━━━━━━━━━
  🎁 DAILY
  ━━━━━━━━━━━━━━━━━━━━
  */

  if (msg.content === '!daily') {
    const now = Date.now();

    if (daily[id] && now - daily[id] < 86400000) {
      return msg.reply('⏳ Daily schon geholt!');
    }

    daily[id] = now;
    add(id, 5000);

    return msg.reply('🎁 +5000 Coins erhalten!');
  }

  /*
  ━━━━━━━━━━━━━━━━━━━━
  🎰 SLOT MACHINE
  ━━━━━━━━━━━━━━━━━━━━
  */

  if (msg.content.startsWith('!slot')) {

    let bet = parseInt(msg.content.split(' ')[1]);

    if (!bet) return msg.reply('❌ !slot <einsatz>');
    if (get(id) < bet) return msg.reply('❌ zu wenig Coins');

    remove(id, bet);

    let message = await msg.reply('🎰 Spinning...');

    let grid;

    // 🎬 ANIMATION
    for (let i = 0; i < 7; i++) {

      grid = [
        [rand(), rand(), rand()],
        [rand(), rand(), rand()],
        [rand(), rand(), rand()]
      ];

      await message.edit(
`🎰 SLOT MACHINE 🎰

${grid[0].join(' | ')}
${grid[1].join(' | ')}
${grid[2].join(' | ')}`
      );

      await new Promise(r => setTimeout(r, 200));
    }

    /*
    ━━━━━━━━━━━━━━━━━━━━
    🏆 WIN LOGIC
    ━━━━━━━━━━━━━━━━━━━━
    */

    let win = 0;
    let text = "😢 Verloren";
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
        text = "🔥 GEWINN!";
        winLine = line;
      }
    }

    // 💎 Bonus
    if (grid.flat().includes('7️⃣')) {
      win += bet * 2;
    }

    /*
    ━━━━━━━━━━━━━━━━━━━━
    🟡 VISUAL MARKING (GARANTIERT SICHTBAR)
    ━━━━━━━━━━━━━━━━━━━━
    */

    let display = grid.map(row => [...row]);

    if (winLine) {
      for (let [r, c] of winLine) {
        display[r][c] = `🟡${display[r][c]}🟡`;
      }
    }

    add(id, win);

    await message.edit(
`🎰 SLOT MACHINE 🎰

${display[0].join(' | ')}
${display[1].join(' | ')}
${display[2].join(' | ')}

${text}
💰 Gewinn: +${win}
💰 Kontostand: ${get(id)} Coins`
    );
  }
});

client.login(process.env.TOKEN);
