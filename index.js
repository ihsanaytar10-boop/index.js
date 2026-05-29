console.log("🔥 STABLE CASINO BOT START");

const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

/*
━━━━━━━━━━━━━━━━━━━━
💾 MONGODB CONNECT
━━━━━━━━━━━━━━━━━━━━
*/

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("💾 MongoDB verbunden"))
  .catch(err => console.log(err));

const userSchema = new mongoose.Schema({
  userId: String,
  coins: Number,
  lastDaily: Number
});

const User = mongoose.model("User", userSchema);

/*
━━━━━━━━━━━━━━━━━━━━
💰 USER HELPERS
━━━━━━━━━━━━━━━━━━━━
*/

async function getUser(id) {
  let user = await User.findOne({ userId: id });

  if (!user) {
    user = await User.create({
      userId: id,
      coins: 1000,
      lastDaily: 0
    });
  }

  return user;
}

/*
━━━━━━━━━━━━━━━━━━━━
🎰 SLOT SYSTEM
━━━━━━━━━━━━━━━━━━━━
*/

const symbols = ['🍒','🍋','🍉','🍇','🍓','🍍','7️⃣'];
const rand = () => symbols[Math.floor(Math.random() * symbols.length)];

client.once('ready', () => {
  console.log(`🎰 Casino online als ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  const id = msg.author.id;

  /*
  💰 COINS
  */
  if (msg.content === '!coins') {
    const user = await getUser(id);
    return msg.reply(`💰 Du hast **${user.coins} Coins**`);
  }

  /*
  🎁 DAILY
  */
  if (msg.content === '!daily') {
    const user = await getUser(id);

    const now = Date.now();

    if (now - user.lastDaily < 86400000) {
      return msg.reply("⏳ Daily schon geholt!");
    }

    user.coins += 5000;
    user.lastDaily = now;

    await user.save();

    return msg.reply("🎁 +5000 Coins erhalten!");
  }

  /*
  🎰 SLOT
  */
  if (msg.content.startsWith('!slot')) {

    let bet = parseInt(msg.content.split(' ')[1]);
    if (!bet) return msg.reply("❌ !slot <einsatz>");

    const user = await getUser(id);

    if (user.coins < bet) {
      return msg.reply("❌ zu wenig Coins");
    }

    user.coins -= bet;
    await user.save();

    let message = await msg.reply("🎰 Spinning...");

    let grid;

    for (let i = 0; i < 6; i++) {

      grid = [
        [rand(), rand(), rand()],
        [rand(), rand(), rand()],
        [rand(), rand(), rand()]
      ];

      await message.edit(
`🎰 SLOT MACHINE 🎰

${grid[0].join(" | ")}
${grid[1].join(" | ")}
${grid[2].join(" | ")}`
      );

      await new Promise(r => setTimeout(r, 200));
    }

    /*
    🏆 WIN LOGIC
    */
    let win = 0;
    let winRow = null;
    let result = "😢 Verloren";

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
        winRow = [a, b, c];
        result = "🔥 GEWINN!";
      }
    }

    if (grid.flat().includes("7️⃣")) {
      win += bet * 2;
    }

    user.coins += win;
    await user.save();

    await message.edit(
`🎰 SLOT MACHINE 🎰

${grid[0].join(" | ")}
${grid[1].join(" | ")}
${grid[2].join(" | ")}

${result}
💰 Gewinn: +${win}
💰 Kontostand: ${user.coins} Coins

${winRow ? "🎉 GEWINN: " + winRow.join(" | ") : ""}`
    );
  }
});

client.login(process.env.TOKEN);
