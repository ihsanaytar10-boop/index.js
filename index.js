console.log("🔥 STABLE SQLITE CASINO BOT");

const { Client, GatewayIntentBits } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

/*
━━━━━━━━━━━━━━━━━━━━
💾 SQLITE DATABASE
━━━━━━━━━━━━━━━━━━━━
*/

const db = new sqlite3.Database('./coins.db');

db.run(`
CREATE TABLE IF NOT EXISTS users (
  userId TEXT PRIMARY KEY,
  coins INTEGER,
  lastDaily INTEGER
)
`);

/*
━━━━━━━━━━━━━━━━━━━━
💰 HELPERS
━━━━━━━━━━━━━━━━━━━━
*/

function getUser(id, cb) {
  db.get("SELECT * FROM users WHERE userId = ?", [id], (err, row) => {
    if (!row) {
      db.run("INSERT INTO users (userId, coins, lastDaily) VALUES (?, ?, ?)", [id, 1000, 0]);
      cb({ userId: id, coins: 1000, lastDaily: 0 });
    } else {
      cb(row);
    }
  });
}

function updateCoins(id, coins) {
  db.run("UPDATE users SET coins = ? WHERE userId = ?", [coins, id]);
}

function updateDaily(id, time) {
  db.run("UPDATE users SET lastDaily = ? WHERE userId = ?", [time, id]);
}

/*
━━━━━━━━━━━━━━━━━━━━
🎰 SLOT
━━━━━━━━━━━━━━━━━━━━
*/

const symbols = ['🍒','🍋','🍉','🍇','🍓','🍍','7️⃣'];
const rand = () => symbols[Math.floor(Math.random() * symbols.length)];

client.once('ready', () => {
  console.log(`🎰 Online als ${client.user.tag}`);
});

client.on('messageCreate', (msg) => {
  if (msg.author.bot) return;

  const id = msg.author.id;

  /*
  💰 COINS
  */
  if (msg.content === '!coins') {
    getUser(id, (user) => {
      msg.reply(`💰 Du hast **${user.coins} Coins**`);
    });
  }

  /*
  🎁 DAILY
  */
  if (msg.content === '!daily') {
    getUser(id, (user) => {
      const now = Date.now();

      if (now - user.lastDaily < 86400000) {
        return msg.reply("⏳ Daily schon geholt!");
      }

      user.coins += 5000;
      user.lastDaily = now;

      updateCoins(id, user.coins);
      updateDaily(id, now);

      msg.reply("🎁 +5000 Coins erhalten!");
    });
  }

  /*
  🎰 SLOT
  */
  if (msg.content.startsWith('!slot')) {

    let bet = parseInt(msg.content.split(' ')[1]);
    if (!bet) return msg.reply("❌ !slot <einsatz>");

    getUser(id, async (user) => {

      if (user.coins < bet) {
        return msg.reply("❌ zu wenig Coins");
      }

      user.coins -= bet;
      updateCoins(id, user.coins);

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
      updateCoins(id, user.coins);

      await message.edit(
`🎰 SLOT MACHINE 🎰

${grid[0].join(" | ")}
${grid[1].join(" | ")}
${grid[2].join(" | ")}

${result}
💰 Gewinn: +${win}
💰 Kontostand: ${user.coins}

${winRow ? "🎉 GEWINN: " + winRow.join(" | ") : ""}`
      );
    });
  }
});

client.login(process.env.TOKEN);
