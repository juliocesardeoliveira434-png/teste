import { type Guild } from 'discord.js';
import { infoEmbed, warningEmbed } from '../embeds/factory';

export class StatisticsService {
  public async embed(guild: Guild) {
    try {
      const members = await guild.members.fetch();
      let bots = 0;
      for (const member of members.values()) if (member.user.bot) bots += 1;
      const humans = members.size - bots;
      return infoEmbed('Estatísticas do servidor', `Consulta em UTC: <t:${Math.floor(Date.now() / 1000)}:f>`).addFields(
        { name: 'Total de membros', value: String(guild.memberCount), inline: true },
        { name: 'Humanos', value: String(humans), inline: true },
        { name: 'Bots', value: String(bots), inline: true }
      );
    } catch {
      return warningEmbed('Estatísticas do servidor', `Consulta em UTC: <t:${Math.floor(Date.now() / 1000)}:f>\nA contagem de humanos e bots está **indisponível** porque os membros não puderam ser carregados. Nenhum número foi estimado.`)
        .addFields({ name: 'Total de membros', value: String(guild.memberCount), inline: true }, { name: 'Humanos', value: 'indisponível', inline: true }, { name: 'Bots', value: 'indisponível', inline: true });
    }
  }
}
