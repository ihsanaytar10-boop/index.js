const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🔥 BOT READY
client.once('ready', () => {
  console.log(`✅ Bot online als ${client.user.tag}`);
});

// 🎰 SLOT COMMAND
const fruits = ['🍒', '🍋', '🍉', '🍇', '🍓', '🍍', '7️⃣'];

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content === '!slot') {

    let msg = await message.reply('🎰 Dreht...');

    let r1, r2, r3;

    for (let i = 0; i < 8; i++) {

      r1 = fruits[Math.floor(Math.random() * fruits.length)];
      r2 = fruits[Math.floor(Math.random() * fruits.length)];
      r3 = fruits[Math.floor(Math.random() * fruits.length)];

      await msg.edit(`🎰 | ${r1} | ${r2} | ${r3} |`);
      await new Promise(res => setTimeout(res, 300));
    }

    let result = "😢 Verloren";

    if (r1 === r2 && r2 === r3) {
      result = "🔥 JACKPOT!";
    } else if (r1 === '7️⃣' || r2 === '7️⃣' || r3 === '7️⃣') {
      result = "✨ Lucky 7!";
    }

    msg.edit(`🎰 | ${r1} | ${r2} | ${r3} |\n\n${result}`);
  }
});

// 🔑 TOKEN LOGIN (WICHTIG!)
client.login(process.env.TOKEN);
