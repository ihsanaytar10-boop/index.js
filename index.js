const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder
} = require("discord.js");

const Canvas = require("canvas");
const GIFEncoder = require("gifencoder");
const fs = require("fs");

// ================= CONFIG =================

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// ================= BOT =================

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ================= COINS =================

const coins = new Map();

function getCoins(userId) {

  if (!coins.has(userId)) {
    coins.set(userId, 10000);
  }

  return coins.get(userId);
}

function addCoins(userId, amount) {

  coins.set(
    userId,
    getCoins(userId) + amount
  );
}

// ================= SYMBOLS =================

const symbols = [
  { icon: "🍋", multi: 2 },
  { icon: "🍒", multi: 3 },
  { icon: "🔔", multi: 5 },
  { icon: "BAR", multi: 10 },
  { icon: "7️⃣", multi: 25 }
];

function randomSymbol() {

  return symbols[
    Math.floor(Math.random() * symbols.length)
  ];
}

// ================= COMMANDS =================

const commands = [

  new SlashCommandBuilder()
    .setName("slot")
    .setDescription("🎰 3x3 Slotmaschine")
    .addIntegerOption(option =>
      option
        .setName("einsatz")
        .setDescription("Coins setzen")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("coins")
    .setDescription("💰 Zeigt deine Coins")

].map(c => c.toJSON());

// ================= REGISTER =================

const rest = new REST({
  version: "10"
}).setToken(TOKEN);

(async () => {

  try {

    console.log("Lade Commands...");

    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );

    console.log("Commands geladen.");

  } catch (err) {

    console.error(err);

  }

})();

// ================= READY =================

client.once("ready", () => {

  console.log(`${client.user.tag} online`);

});

// ================= INTERACTION =================

client.on("interactionCreate", async interaction => {

  if (!interaction.isChatInputCommand()) return;

  // ================= COINS =================

  if (interaction.commandName === "coins") {

    return interaction.reply({
      content: `💰 Du hast ${getCoins(interaction.user.id)} Coins`,
      ephemeral: true
    });
  }

  // ================= SLOT =================

  if (interaction.commandName === "slot") {

    const bet = interaction.options.getInteger("einsatz");

    const userId = interaction.user.id;

    if (bet <= 0) {

      return interaction.reply({
        content: "❌ Ungültiger Einsatz.",
        ephemeral: true
      });
    }

    if (getCoins(userId) < bet) {

      return interaction.reply({
        content: "❌ Nicht genug Coins.",
        ephemeral: true
      });
    }

    addCoins(userId, -bet);

    await interaction.deferReply();

    // ================= GRID =================

    const grid = [];

    for (let row = 0; row < 3; row++) {

      const currentRow = [];

      for (let col = 0; col < 3; col++) {

        currentRow.push(randomSymbol());

      }

      grid.push(currentRow);
    }

    // ================= GIF =================

    const width = 450;
    const height = 450;

    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    const encoder = new GIFEncoder(width, height);

    const path = `slot-${userId}.gif`;

    encoder.createReadStream().pipe(
      fs.createWriteStream(path)
    );

    encoder.start();

    encoder.setRepeat(0);
    encoder.setDelay(90);
    encoder.setQuality(10);

    // ================= ANIMATION =================

    for (let frame = 0; frame < 25; frame++) {

      // Hintergrund
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, width, height);

      // Titel
      ctx.fillStyle = "gold";
      ctx.font = "bold 42px Arial";

      ctx.fillText("🎰 SLOT MACHINE", 70, 50);

      // Grid
      for (let row = 0; row < 3; row++) {

        for (let col = 0; col < 3; col++) {

          const x = 35 + col * 120;
          const y = 80 + row * 110;

          // Feld
          ctx.fillStyle = "white";
          ctx.fillRect(x, y, 100, 100);

          // Rand
          ctx.strokeStyle = "gold";
          ctx.lineWidth = 5;

          ctx.strokeRect(x, y, 100, 100);

          let symbol;

          // Animation
          if (frame > 20) {

            symbol = grid[row][col].icon;

          } else {

            symbol = randomSymbol().icon;
          }

          // Symbol
          ctx.fillStyle = "black";
          ctx.font = "55px Arial";

          ctx.fillText(
            symbol,
            x + 18,
            y + 65
          );
        }
      }

      encoder.addFrame(ctx);
    }

    encoder.finish();

    await new Promise(resolve =>
      setTimeout(resolve, 1000)
    );

    // ================= WIN CHECK =================

    const lines = [

      // horizontal
      [grid[0][0], grid[0][1], grid[0][2]],
      [grid[1][0], grid[1][1], grid[1][2]],
      [grid[2][0], grid[2][1], grid[2][2]],

      // diagonal
      [grid[0][0], grid[1][1], grid[2][2]],
      [grid[0][2], grid[1][1], grid[2][0]]
    ];

    let winnings = 0;

    for (const line of lines) {

      if (
        line[0].icon === line[1].icon &&
        line[1].icon === line[2].icon
      ) {

        winnings += bet * line[0].multi;
      }
    }

    if (winnings > 0) {

      addCoins(userId, winnings);

    }

    // ================= EMBED =================

    const embed = new EmbedBuilder()
      .setTitle("🎰 SLOT RESULT")
      .setDescription(

        winnings > 0

          ? `🎉 Gewinn: ${winnings} Coins`

          : `❌ Verloren: ${bet} Coins`
      )
      .addFields({
        name: "💰 Kontostand",
        value: `${getCoins(userId)} Coins`
      })
      .setColor(

        winnings > 0

          ? "Gold"

          : "Red"
      );

    // ================= SEND =================

    await interaction.editReply({

      embeds: [embed],

      files: [{
        attachment: path,
        name: "slot.gif"
      }]
    });

    // ================= DELETE FILE =================

    setTimeout(() => {

      if (fs.existsSync(path)) {

        fs.unlinkSync(path);

      }

    }, 5000);
  }
});

// ================= LOGIN =================

client.login(TOKEN);
