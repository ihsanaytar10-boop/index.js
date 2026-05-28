const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  AttachmentBuilder,
  EmbedBuilder
} = require("discord.js");

const Canvas = require("canvas");
const GIFEncoder = require("gifencoder");
const fs = require("fs");

// ================= CONFIG =================

const TOKEN = "DEIN_TOKEN";
const CLIENT_ID = "DEINE_CLIENT_ID";

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

// ================= COMMAND =================

const commands = [

  new SlashCommandBuilder()
    .setName("slot")
    .setDescription("🎰 3x3 Slot")
    .addIntegerOption(option =>
      option
        .setName("einsatz")
        .setDescription("Coins setzen")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("coins")
    .setDescription("💰 Zeigt Coins")

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

// ================= INTERACTIONS =================

client.on("interactionCreate", async interaction => {

  if (!interaction.isChatInputCommand()) return;

  // ===== COINS =====

  if (interaction.commandName === "coins") {

    return interaction.reply({
      content: `💰 Coins: ${getCoins(interaction.user.id)}`,
      ephemeral: true
    });
  }

  // ===== SLOT =====

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

    // FINAL GRID
    const grid = [];

    for (let row = 0; row < 3; row++) {

      const currentRow = [];

      for (let col = 0; col < 3; col++) {
        currentRow.push(randomSymbol());
      }

      grid.push(currentRow);
    }

    // GIF
    const width = 420;
    const height = 420;

    const canvas = Canvas.createCanvas(width, height);

    const ctx = canvas.getContext("2d");

    const encoder = new GIFEncoder(width, height);

    const path = `slot-${userId}.gif`;

    encoder.createReadStream().pipe(
      fs.createWriteStream(path)
    );

    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(80);
    encoder.setQuality(10);

    // ANIMATION
    for (let frame = 0; frame < 25; frame++) {

      // BG
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, width, height);

      // TITLE
      ctx.fillStyle = "gold";
      ctx.font = "bold 40px Arial";

      ctx.fillText("🎰 SLOT", 120, 50);

      // GRID
      for (let row = 0; row < 3; row++) {

        for (let col = 0; col < 3; col++) {

          const x = 50 + col * 110;
          const y = 90 + row * 100;

          ctx.fillStyle = "white";

          ctx.fillRect(x, y, 90, 90);

          let symbol;

          // STOP ANIMATION
          if (frame > 20) {

            symbol = grid[row][col].icon;

          } else {

            symbol = randomSymbol().icon;
          }

          ctx.fillStyle = "black";
          ctx.font = "50px Arial";

          ctx.fillText(
            symbol,
            x + 15,
            y + 58
          );
        }
      }

      encoder.addFrame(ctx);
    }

    encoder.finish();

    // WIN CHECK
    let winnings = 0;

    // MITTLERE REIHE
    const middle = grid[1];

    if (
      middle[0].icon === middle[1].icon &&
      middle[1].icon === middle[2].icon
    ) {

      winnings =
        Math.floor(
          bet * middle[0].multi
        );

      addCoins(userId, winnings);
    }

    // EMBED
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

    // SEND
    const attachment = new AttachmentBuilder(path);

    await interaction.editReply({
      embeds: [embed],
      files: [attachment]
    });

    // DELETE
    setTimeout(() => {

      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }

    }, 5000);
  }

});

// ================= LOGIN =================

client.login(TOKEN);
