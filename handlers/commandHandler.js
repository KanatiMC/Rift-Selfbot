const fs = require('fs');

module.exports = (client) => {
  const files = fs.readdirSync("./commands").forEach((dir) => {
    const commands = fs.readdirSync(`./commands/${dir}/`).filter(file => file.endsWith('.js'));
    
    for (let file of commands) {
      let cmd = require(`../commands/${dir}/${file}`);
      
      if (cmd.name) {
        cmd.category = dir;
        client.commands.set(cmd.name, cmd);
      }
    }
  });

  console.log("   [+] Commands loaded");
};
