import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client, Collection, GatewayIntentBits, ButtonBuilder, ActionRowBuilder, ButtonStyle, ChannelType } from 'discord.js';
import dotenv from 'dotenv';
import cron from 'node-cron';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(filePath);
    client.commands.set(command.default.data.name, command.default);
}

client.once('ready', () => {
    console.log('Bot está online!');
    sendDailyMessage(client);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand() && !interaction.isButton()) return;

    // Comando
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Erro ao executar o comando ${interaction.commandName}:`, error);
            await interaction.reply({ content: 'Houve um erro ao executar esse comando!', ephemeral: true });
        }
    }

    // Botão
    if (interaction.isButton()) {
        if (interaction.customId === 'accept_task') {
            try {
                const newChannel = await interaction.guild.channels.create({
                    name: `Current task`,
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: ['ViewChannel'],
                        },
                        {
                            id: interaction.user.id,
                            allow: ['ViewChannel'],
                        },
                    ],
                });

                await interaction.reply({
                    content: `Canal criado: <#${newChannel.id}>`,
                    ephemeral: true,
                });
            } catch (error) {
                console.error('Erro ao criar canal:', error);
                await interaction.reply({
                    content: 'Houve um erro ao criar o canal!',
                    ephemeral: true,
                });
            }
        }
    }
});

function sendDailyMessage(client) {
    const userId = process.env.USER_ID;
    const channelId = process.env.CHANNEL_ID;

    const messages = [
        { time: '45 22 * * 1-5', content: `<@${userId}>! teste` },
    ];

    messages.forEach(({ time, content }) => {
        cron.schedule(time, () => {
            const channel = client.channels.cache.get(channelId);
            if (channel) {
                const button = new ButtonBuilder()
                    .setCustomId('accept_task')
                    .setLabel('Start task')
                    .setStyle(ButtonStyle.Success);

                const row = new ActionRowBuilder().addComponents(button);

                channel.send({
                    content: `${content}`,
                    components: [row],
                }).catch(console.error);
            } else {
                console.error(`Canal com ID ${channelId} não encontrado.`);
            }
        });
    });
}

client.login(process.env.TOKEN);
