const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const TOKEN = 'DEIN_BOT_TOKEN';

const fruits = ['🍒', '🍋', '🍉', '🍇', '🍓', '🍍', '7️⃣'];

client.once('ready', () => {
  console.log(`${client.user.tag} ist online!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content === '!slot') {

    const msg = await message.reply('🎰 Dreht...');

    let spins = 0;

    const interval = setInterval(async () => {

      const r1 = fruits[Math.floor(Math.random() * fruits.length)];
      const r2 = fruits[Math.floor(Math.random() * fruits.length)];
      const r3 = fruits[Math.floor(Math.random() * fruits.length)];

      await msg.edit(`
🎰 **777 SLOT MACHINE** 🎰

┃ ${r1} ┃ ${r2} ┃ ${r3} ┃
      `);

      spins++;

      if (spins >= 10) {
        clearInterval(interval);

        let result = '😢 Leider verloren!';

        if (r1 === r2 && r2 === r3) {
          result = '🔥 JACKPOT!!! 🔥';
        }
        else if (r1 === '7️⃣' || r2 === '7️⃣' || r3 === '7️⃣') {
          result = '✨ Lucky 7! ✨';
        }

        await msg.edit(`
🎰 **777 SLOT MACHINE** 🎰

┃ ${r1} ┃ ${r2} ┃ ${r3} ┃

${result}
        `);
      }

    }, 500);
  }
});

client.login(TOKEN);
