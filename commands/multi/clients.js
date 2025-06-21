module.exports = { 
  name: "clients",
  description: "client list view",
  aliases: ["client"],
  syntax: "[index | p<page number>]",
  run: async (client, message, args) => {
    const displayLimit = 5;
    const pageNumMatch = args[0]?.match(/^p(\d+)$/);
    const indexArg = parseInt(args[0], 10);

    const padString = (str, len) => str + " ".repeat(Math.max(0, len - str.length));

    const mainUsername = client.user.tag;
    const mainUserId = client.user.id;
    const allClients = [client.user, ...(client.altClients || []).map(alt => alt.user)];
    const altClients = client.altClients || [];
    const altCount = altClients.length;
    const totalPages = Math.ceil(altCount / displayLimit);

    const longestUsername = Math.max(...allClients.map((user) => user.tag.length));
    const longestId = Math.max(...allClients.map((user) => user.id.length));

    const mainClientLine = `[+] ${padString(mainUsername, longestUsername + 2)} | ID: ${padString(mainUserId, longestId)}`;

    if (!isNaN(indexArg) && indexArg > 1 && indexArg <= altCount + 1) {
      const selectedClient = altClients[indexArg - 2].user;
      const details = `### CLIENT DETAILS | INDEX ${indexArg})\n\`\`\`ini\n`
        + `Username: ${selectedClient.tag}\n`
        + `ID: ${selectedClient.id}\n`
        + `Created At: ${selectedClient.createdAt}\n`
      return message?.reply(details);
    }

    if (!altClients.length) return message?.reply(`### \`\`\`[RIFT] | CLIENT ACCOUNTS\`\`\`\n\`\`\`ini\n${"-".repeat(mainClientLine.length)}\n[i] NONE LOADED\n${"-".repeat(mainClientLine.length)}\`\`\``);

    const pageIndex = pageNumMatch ? parseInt(pageNumMatch[1], 10) - 1 : 0;
    if (pageIndex < 0 || pageIndex >= totalPages) {
      return message?.reply("`ERROR`\n-# Invalid page number.");
    }

    const start = pageIndex * displayLimit;
    const end = Math.min(start + displayLimit, altCount);

    let replyMsg = `### \`\`\`[RIFT] | CLIENT ACCOUNTS (${pageIndex + 1}/${totalPages})\`\`\`\n\`\`\`ini\n`;
    replyMsg += `${mainClientLine}\n`;

    const separatorLine = "-".repeat(mainClientLine.length);
    replyMsg += `${separatorLine}\n`;

    if (altCount === 0) {
      replyMsg += `[INFO] No alt accounts are currently loaded.\n`;
    } else {
      for (let i = start; i < end; i++) {
        const altClient = altClients[i].user;
        replyMsg += `[${i + 1}] ${padString(altClient.tag, longestUsername + 2)} | ID: ${padString(altClient.id, longestId)}\n`;
      }
    }

    replyMsg += `${separatorLine}\n`;
    replyMsg += `[INFO]  ${altCount} alts loaded\n`;
    replyMsg += `\`\`\`\n-# Use \`clients [index]\` for details or \`clients p<page>\` to navigate pages.\n`;

    message?.reply(replyMsg);
  },
};
