if (msg.content.startsWith("!slot")) {
  const user = getUser(msg.author.id);

  const bet = parseInt(msg.content.split(" ")[1]);
  if (!bet) return msg.reply("❌ !slot <einsatz>");
  if (user.balance < bet) return msg.reply("❌ zu wenig Coins");

  user.balance -= bet;

  const symbols = ["🍒", "🍋", "🍉", "🍇", "🍓", "🍍", "7️⃣"];
  const rand = () => symbols[Math.floor(Math.random() * symbols.length)];

  let msgEdit = await msg.reply("🎰 Spinning...");

  let grid;

  for (let i = 0; i < 5; i++) {
    grid = [
      [rand(), rand(), rand()],
      [rand(), rand(), rand()],
      [rand(), rand(), rand()]
    ];

    await msgEdit.edit(
`🎰 SLOT 🎰

${grid[0].join(" | ")}
${grid[1].join(" | ")}
${grid[2].join(" | ")}`
    );

    await new Promise(r => setTimeout(r, 250));
  }

  // WIN LOGIC
  let win = 0;
  let result = "😢 Verloren";
  let winLine = null;

  const middle = grid[1];

  if (middle[0] === middle[1] && middle[1] === middle[2]) {
    win = bet * 5;
    result = "🔥 GEWINN!";
    winLine = middle;
  }

  if (grid.flat().includes("7️⃣")) {
    win += bet * 2;
  }

  user.balance += win;

  await msgEdit.edit(
`🎰 SLOT 🎰

${grid[0].join(" | ")}
${grid[1].join(" | ")}
${grid[2].join(" | ")}

${result}
💰 Gewinn: +${win}
💰 Coins: ${user.balance}

${winLine ? "🍓 GEWINN FRÜCHTE: " + winLine.join(" | ") : ""}`
  );
}
