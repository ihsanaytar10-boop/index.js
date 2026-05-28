if (interaction.commandName === "slot") {
  const symbols = ["🍒", "🍋", "🔔", "⭐", "7️⃣"];

  const r = () => symbols[Math.floor(Math.random() * symbols.length)];

  const text =
`${r()} | ${r()} | ${r()}
${r()} | ${r()} | ${r()}
${r()} | ${r()} | ${r()}`;

  return interaction.reply(text);
}
