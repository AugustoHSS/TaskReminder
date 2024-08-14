import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('end')
        .setDescription('Exclui o canal onde o comando foi dado'),
    async execute(interaction) {
        if (!interaction.member.permissions.has('MANAGE_CHANNELS')) {
            return interaction.reply('Você não tem permissão para usar este comando.');
        }
        
        const channel = interaction.channel;
        
        try {
            await interaction.reply('Finalizando a tarefa...');
            await channel.delete();
        } catch (error) {
            console.error('Erro ao excluir o canal:', error);
            await interaction.reply('Ocorreu um erro ao tentar excluir o canal.');
        }
    },
};