const {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━
DISCORD BOT TOKEN
━━━━━━━━━━━━━━━━━━━━━━━━━━
*/

const TOKEN = 'DEIN_NEUER_BOT_TOKEN_HIER';

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━
SLOT SETTINGS
━━━━━━━━━━━━━━━━━━━━━━━━━━
*/

const fruits = [
  '🍒',
  '🍋',
  '🍉',
  '🍇',
  '🍓',
  '🍍',
  '7️⃣'
];

const cooldown = new Set();

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━
BOT ONLINE
━━━━━━━━━━━━━━━━━━━━━━━━━━
*/

client.once('ready', () => {
  console.log(`✅ ${client.user.tag} ist online!`);
});

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━
MESSAGE COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━
*/

client.on('messageCreate', async (message) => {

  if (message.author.bot) return;

  /*
  ━━━━━━━━━━━━━━━━━━━━━━━━━━
  HELP COMMAND
  ━━━━━━━━━━━━━━━━━━━━━━━━━━
  */

  if (message.content === '!help') {

    const helpEmbed = new EmbedBuilder()
      .setTitle('🎰 777 CASINO BOT')
      .setDescription(`
**Commands:**

🎰 \`!slot\`
→ Slot Machine spielen

🎲 \`!dice\`
→ Würfel werfen

💰 \`!coins\`
→ Coins anzeigen
      `)
      .setColor('Gold');

    return message.reply({ embeds: [helpEmbed] });
  }

  /*
  ━━━━━━━━━━━━━━━━━━━━━━━━━━
  COINS SYSTEM
  ━━━━━━━━━━━━━━━━━━━━━━━━━━
  */

  if (!client.coins) client.coins = {};

  if (!client.coins[message.author.id]) {
    client.coins[message.author.id] = 1000;
  }

  /*
  ━━━━━━━━━━━━━━━━━━━━━━━━━━
  SHOW COINS
  ━━━━━━━━━━━━━━━━━━━━━━━━━━
  */

  if (message.content === '!coins') {

    return message.reply(
      `💰 Du hast ${client.coins[message.author.id]} Coins`
    );
  }

  /*
  ━━━━━━━━━━━━━━━━━━━━━━━━━━
  DICE GAME
  ━━━━━━━━━━━━━━━━━━━━━━━━━━
  */

  if (message.content === '!dice') {

    const roll = Math.floor(Math.random() * 6) + 1;

    return message.reply(`🎲 Du hast eine ${roll} gewürfelt!`);
  }

  /*
  ━━━━━━━━━━━━━━━━━━━━━━━━━━
  SLOT MACHINE
  ━━━━━━━━━━━━━━━━━━━━━━━━━━
  */

  if (message.content === '!slot') {

    if (cooldown.has(message.author.id)) {
      return message.reply('⏳ Bitte kurz warten...');
    }

    cooldown.add(message.author.id);

    setTimeout(() => {
      cooldown.delete(message.author.id);
    }, 5000);

    let coins = client.coins[message.author.id];

    if (coins < 100) {
      return message.reply('❌ Nicht genug Coins!');
    }

    client.coins[message.author.id] -= 100;

    const slotMessage = await message.reply(`
🎰 **777 SLOT MACHINE** 🎰

┃ ❔ ┃ ❔ ┃ ❔ ┃
    `);

    let spins = 0;

    const interval = setInterval(async () => {

      const r1 = fruits[Math.floor(Math.random() * fruits.length)];
      const r2 = fruits[Math.floor(Math.random() * fruits.length)];
      const r3 = fruits[Math.floor(Math.random() * fruits.length)];

      await slotMessage.edit(`
🎰 **777 SLOT MACHINE** 🎰

┃ ${r1} ┃ ${r2} ┃ ${r3} ┃

💸 Einsatz: 100 Coins
      `);

      spins++;

      if (spins >= 10) {

        clearInterval(interval);

        let reward = 0;
        let result = '😢 Leider verloren!';

        /*
        ━━━━━━━━━━━━━━━━━━━━━━━━━━
        JACKPOT
        ━━━━━━━━━━━━━━━━━━━━━━━━━━
        */

        if (r1 === r2 && r2 === r3) {

          reward = 1000;
          result = '🔥 JACKPOT!!! +1000 Coins 🔥';
        }

        /*
        ━━━━━━━━━━━━━━━━━━━━━━━━━━
        LUCKY 7
        ━━━━━━━━━━━━━━━━━━━━━━━━━━
        */

        else if (
          r1 === '7️⃣' ||
          r2 === '7️⃣' ||
          r3 === '7️⃣'
        ) {

          reward = 300;
          result = '✨ LUCKY 7! +300 Coins ✨';
        }

        /*
        ━━━━━━━━━━━━━━━━━━━━━━━━━━
        TWO SAME
        ━━━━━━━━━━━━━━━━━━━━━━━━━━
        */

        else if (
          r1 === r2 ||
          r2 === r3 ||
          r1 === r3
        ) {

          reward = 150;
          result = '🎉 Zwei gleiche! +150 Coins';
        }

        client.coins[message.author.id] += reward;

        await slotMessage.edit(`
🎰 **777 SLOT MACHINE** 🎰

┃ ${r1} ┃ ${r2} ┃ ${r3} ┃

${result}

💰 Coins:
${client.coins[message.author.id]}
        `);
      }

    }, 500);
  }
});

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━
LOGIN
━━━━━━━━━━━━━━━━━━━━━━━━━━
*/

client.login(TOKEN);
