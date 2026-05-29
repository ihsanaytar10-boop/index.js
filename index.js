const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const symbols = ["🍒", "🍋", "⭐", "7️⃣"];

client.once("ready", () => {
  console.log(`Online als ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "slot") {

    const r = () =>
      symbols[Math.floor(Math.random() * symbols.length)];

    const row1 = `${r()} ${r()} ${r()}`;
    const row2 = `${r()} ${r()} ${r()}`;
    const row3 = `${r()} ${r()} ${r()}`;

    await interaction.reply({
      content:
`[2;34m```txt
${row1}
${row2}
${row3}
```[0m`
    });
  }
});

client.login(process.env.TOKEN);
