import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.TOKEN;

const commands = [];
const commandsPath = path.join(process.cwd(), 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(filePath);
    if (command.default && command.default.data) {
        commands.push(command.default.data.toJSON());
    } else {
        console.log(`Nenhum comando encontrado no arquivo ${file}.`);
    }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log(`Comandos registrados com sucesso!`);
    } catch (error) {
        console.error('Erro ao registrar comandos:', error);
    }
})();