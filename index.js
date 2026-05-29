const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const fruits = ['🍒', '🍋', '🍉', '🍇', '🍓', '🍍', '7️⃣'];

client.once('ready', () => {
  console.log(`Online als ${client.user.tag}`);
});

function rand() {
  return fruits[Math.floor(Math.random() * fruits.length)];
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content === '!slot') {

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

    let flat = grid.flat();

    let result = "😢 Verloren";

    if (flat[0] === flat[1] && flat[1] === flat[2]) result = "🔥 JACKPOT TOP ROW!";
    else if (flat.includes('7️⃣')) result = "✨ Lucky 7!";

    msg.edit(
`🎰 SLOT MACHINE 🎰

${grid[0].join(' | ')}
${grid[1].join(' | ')}
${grid[2].join(' | ')}

${result}`
    );
  }
});

client.login(process.env.TOKEN);
