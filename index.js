if (interaction.commandName === "slot") {
  const bet = interaction.options.getInteger("einsatz");
  const userId = interaction.user.id;

  if (bet <= 0) {
    return interaction.reply("❌ Ungültiger Einsatz");
  }

  if (getCoins(userId) < bet) {
    return interaction.reply("❌ Nicht genug Coins");
  }

  addCoins(userId, -bet);

  const symbols = ["🍒", "🍋", "🔔", "⭐", "7️⃣"];

  const r = () => symbols[Math.floor(Math.random() * symbols.length)];

  const grid = [
    [r(), r(), r()],
    [r(), r(), r()],
    [r(), r(), r()]
  ];

  const lines = [
    [grid[0][0], grid[0][1], grid[0][2]],
    [grid[1][0], grid[1][1], grid[1][2]],
    [grid[2][0], grid[2][1], grid[2][2]],
    [grid[0][0], grid[1][1], grid[2][2]],
    [grid[0][2], grid[1][1], grid[2][0]]
  ];

  let win = 0;

  for (const line of lines) {
    if (line[0] === line[1] && line[1] === line[2]) {
      win += bet * 3;
    }
  }

  if (win > 0) addCoins(userId, win);

  const text =
`🎰 SLOT

${grid[0][0]} | ${grid[0][1]} | ${grid[0][2]}
${grid[1][0]} | ${grid[1][1]} | ${grid[1][2]}
${grid[2][0]} | ${grid[2][1]} | ${grid[2][2]}

${win > 0
  ? `🎉 GEWONNEN +${win}`
  : `❌ VERLOREN -${bet}`
}

💰 Coins: ${getCoins(userId)}`;

  return interaction.reply(text);
}
