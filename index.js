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

  await interaction.reply("🎰 Slot startet...");

  // ================= ANIMATION =================
  for (let i = 0; i < 4; i++) {
    const temp =
`${randomSymbol().icon} | ${randomSymbol().icon} | ${randomSymbol().icon}
${randomSymbol().icon} | ${randomSymbol().icon} | ${randomSymbol().icon}
${randomSymbol().icon} | ${randomSymbol().icon} | ${randomSymbol().icon}`;

    await interaction.editReply(`🎰 Dreht...\n\n\`\`\`\n${temp}\n\`\`\``);

    await new Promise(r => setTimeout(r, 600));
  }

  // ================= FINAL GRID =================
  const grid = [];
  for (let r = 0; r < 3; r++) {
    const row = [];
    for (let c = 0; c < 3; c++) {
      row.push(randomSymbol());
    }
    grid.push(row);
  }

  const lines = [
    [grid[0][0], grid[0][1], grid[0][2]],
    [grid[1][0], grid[1][1], grid[1][2]],
    [grid[2][0], grid[2][1], grid[2][2]],
    [grid[0][0], grid[1][1], grid[2][2]],
    [grid[0][2], grid[1][1], grid[2][0]]
  ];

  let win = 0;

  for (const line of lines) {
    if (
      line[0].icon === line[1].icon &&
      line[1].icon === line[2].icon
    ) {
      win += bet * line[0].multi;
    }
  }

  if (win > 0) {
    addCoins(userId, win);
  }

  const finalGrid =
`${grid[0][0].icon} | ${grid[0][1].icon} | ${grid[0][2].icon}
${grid[1][0].icon} | ${grid[1][1].icon} | ${grid[1][2].icon}
${grid[2][0].icon} | ${grid[2][1].icon} | ${grid[2][2].icon}`;

  const balance = getCoins(userId);

  await interaction.editReply(
`🎰 SLOT RESULT

\`\`\`
${finalGrid}
\`\`\`

${win > 0
  ? `🎉 GEWONNEN: +${win} Coins`
  : `❌ VERLOREN: -${bet} Coins`
}

💰 Kontostand: ${balance} Coins`
  );
}
