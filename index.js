const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const fruits = ['🍒', '🍋', '🍉', '🍇', '🍓', '🍍', '7️⃣'];

const coins = {};
const dailyCooldown = {};

function rand() {
  return fruits[Math.floor(Math.random() * fruits.length)];
}

client.once('ready', () => {
  console.log(`Online als ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const id = message.author.id;

  // START COINS
  if (!coins[id]) coins[id] = 1000;

  // 💰 BALANCE
  if (message.content === '!coins') {
    return message.reply(`💰 Du hast **${coins[id]} Coins**`);
  }

  // 🎁 DAILY
  if (message.content === '!daily') {

    const now = Date.now();

    if (dailyCooldown[id] && now - dailyCooldown[id] < 24 * 60 * 60 * 1000) {
      return message.reply('⏳ Du hast dein Daily schon geholt!');
    }

    dailyCooldown[id] = now;
    coins[id] += 5000;

    return message.reply('🎁 Du hast **5000 Coins Daily** bekommen!');
  }

  // 🎰 SLOT WITH BET
  if (message.content.startsWith('!slot')) {

    let bet = parseInt(message.content.split(' ')[1]);

    if (!bet) {
      return message.reply('❌ Nutze: !slot <einsatz>');
    }

    if (bet <= 0) return message.reply('❌ Ungültiger Einsatz!');
    if (coins[id] < bet) return message.reply('❌ Nicht genug Coins!');

    coins[id] -= bet;

    let msg = await message.reply('🎰 Dreht...');

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

    let flat = grid.flat();

    let win = 0;
    let result = "😢 Verloren";

    // JACKPOT
    if (flat[0] === flat[1] && flat[1] === flat[2]) {
      win = bet * 10;
      result = `🔥 JACKPOT +${win}`;
    }

    // LUCKY 7
    else if (flat.includes('7️⃣')) {
      win = bet * 3;
      result = `✨ Lucky 7 +${win}`;
    }

    // PAIR
    else if (new Set(flat).size < 9) {
      win = Math.floor(bet * 1.5);
      result = `🎉 Kleiner Gewinn +${win}`;
    }

    coins[id] += win;

    msg.edit(
`🎰 SLOT MACHINE 🎰

${grid[0].join(' | ')}
${grid[1].join(' | ')}
${grid[2].join(' | ')}

${result}
💰 Kontostand: ${coins[id]}`
    );
  }
});

client.login(process.env.TOKEN);
