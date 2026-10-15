import {
  PermissionFlagsBits,
  type RepliableInteraction
} from 'discord.js';
import type { Logger } from 'pino';
import { COPY } from '../config/messages';
import { errorEmbed } from '../embeds/factory';
import type { ConfigRepository } from '../database/repositories/configRepository';
import { safeReply } from '../utils/discord';

export type PermissionScope = 'admin' | 'journalist' | 'staff';
type GuardedInteraction = RepliableInteraction;

export class PermissionService {
  public constructor(
    private readonly config: ConfigRepository,
    private readonly guildId: string,
    private readonly logger: Logger
  ) {}

  public async requirePermission(interaction: GuardedInteraction, scope: PermissionScope): Promise<boolean> {
    if (!interaction.inGuild() || interaction.guildId !== this.guildId || !interaction.guild) {
      await safeReply(interaction, { embeds: [errorEmbed('Servidor indisponível', COPY.wrongGuild)], flags: 64 }, this.logger);
      return false;
    }
    if (Date.now() - interaction.createdTimestamp > 14 * 60 * 1000) {
      await safeReply(interaction, { embeds: [errorEmbed('Interação expirada', COPY.expired)], flags: 64 }, this.logger);
      return false;
    }
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (member.permissions.has(PermissionFlagsBits.Administrator) || member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;
      const allowed = this.allowedRoleIds(interaction.guildId, scope);
      if (allowed.some((roleId) => member.roles.cache.has(roleId))) return true;
    } catch (error: unknown) {
      this.logger.warn({ err: error, userId: interaction.user.id }, 'Não foi possível confirmar permissões do membro');
    }
    await safeReply(interaction, { embeds: [errorEmbed('Acesso negado', COPY.noPermission)], flags: 64 }, this.logger);
    return false;
  }

  public async canOperateTicket(interaction: GuardedInteraction, requesterId: string): Promise<boolean> {
    if (interaction.user.id === requesterId) return true;
    return this.requirePermission(interaction, 'staff');
  }

  private allowedRoleIds(guildId: string, scope: PermissionScope): readonly string[] {
    if (scope === 'admin') {
      const role = this.config.get(guildId, 'admin_role_id');
      return role ? [role] : [];
    }
    if (scope === 'journalist') {
      const role = this.config.get(guildId, 'journalist_role_id');
      return role ? [role] : [];
    }
    return this.config.getStringArray(guildId, 'staff_role_ids');
  }
}
