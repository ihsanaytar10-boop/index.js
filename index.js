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
💾 SPEICHER SYSTEM
━━━━━━━━━━━━━━━━━━━━
*/

const FILE = './coins.json';

let coins = {};

// laden beim Start
function loadCoins() {
  try {
    if (fs.existsSync(FILE)) {
      coins = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    }
  } catch (e) {
    coins = {};
  }
}

// speichern
function saveCoins() {
  fs.writeFileSync(FILE, JSON.stringify(coins, null, 2));
}

loadCoins();

/*
━━━━━━━━━━━━━━━━━━━━
💰 COINS LOGIC
━━━━━━━━━━━━━━━━━━━━
*/

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
🤖 BOT START
━━━━━━━━━━━━━━━━━━━━
*/

client.once('ready', () => {
  console.log(`BOT ONLINE ✔`);
});

/*
━━━━━━━━━━━━━━━━━━━━
📩 COMMANDS
━━━━━━━━━━━━━━━━━━━━
*/

client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  const id = message.author.id;

  // 💰 Kontostand
  if (message.content === '!coins') {
    return message.reply(`💰 Du hast **${getCoins(id)} Coins**`);
  }

  // 🎁 Daily
  if (message.content === '!daily') {
    addCoins(id, 5000);
    return message.reply('🎁 +5000 Coins erhalten!');
  }

  // 🎰 Test Slot (optional, ohne Fehler)
  if (message.content.startsWith('!slot')) {
    const bet = parseInt(message.content.split(' ')[1]);

    if (!bet) return message.reply('❌ !slot <einsatz>');
    if (getCoins(id) < bet) return message.reply('❌ zu wenig Coins');

    removeCoins(id, bet);

    const win = Math.random() < 0.4 ? bet * 2 : 0;

    addCoins(id, win);

    return message.reply(
      `🎰 Ergebnis: ${win > 0 ? "GEWONNEN" : "VERLOREN"}\n💰 Kontostand: ${getCoins(id)}`
    );
  }
});

client.login(process.env.TOKEN);
