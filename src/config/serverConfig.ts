import { ChannelType } from 'discord.js';
import type { ConfigKey } from '../types/domain';

export interface ChannelFunction {
  readonly value: string;
  readonly label: string;
  readonly key: ConfigKey;
  readonly channelTypes: readonly ChannelType[];
  readonly isCategory: boolean;
}

export const CHANNEL_FUNCTIONS: readonly ChannelFunction[] = [
  { value: 'publications', label: 'Publicações jornalísticas', key: 'publications_channel_id', channelTypes: [ChannelType.GuildText, ChannelType.GuildAnnouncement], isCategory: false },
  { value: 'leaderboard', label: 'Leaderboard', key: 'leaderboard_channel_id', channelTypes: [ChannelType.GuildText, ChannelType.GuildAnnouncement], isCategory: false },
  { value: 'tickets-panel', label: 'Painel de tickets', key: 'tickets_panel_channel_id', channelTypes: [ChannelType.GuildText], isCategory: false },
  { value: 'support-category', label: 'Categoria de suporte', key: 'support_category_id', channelTypes: [ChannelType.GuildCategory], isCategory: true },
  { value: 'recruitment-category', label: 'Categoria de recrutamento', key: 'recruitment_category_id', channelTypes: [ChannelType.GuildCategory], isCategory: true },
  { value: 'tickets-admin', label: 'Canal admin de tickets', key: 'tickets_admin_channel_id', channelTypes: [ChannelType.GuildText], isCategory: false },
  { value: 'recruitment-admin', label: 'Canal de inscrições', key: 'recruitment_admin_channel_id', channelTypes: [ChannelType.GuildText], isCategory: false },
  { value: 'gangs-admin', label: 'Canal admin de gangues', key: 'gangs_admin_channel_id', channelTypes: [ChannelType.GuildText], isCategory: false },
  { value: 'gangs-public', label: 'Canal público de gangues', key: 'gangs_public_channel_id', channelTypes: [ChannelType.GuildText], isCategory: false },
  { value: 'gangs-panel', label: 'Painel de gangues', key: 'gangs_panel_channel_id', channelTypes: [ChannelType.GuildText], isCategory: false },
  { value: 'reaction-role', label: 'Painel de reaction role', key: 'reaction_role_channel_id', channelTypes: [ChannelType.GuildText], isCategory: false },
  { value: 'statistics', label: 'Estatísticas', key: 'stats_channel_id', channelTypes: [ChannelType.GuildText], isCategory: false },
  { value: 'logs', label: 'Logs e transcrições', key: 'logs_channel_id', channelTypes: [ChannelType.GuildText], isCategory: false }
];

export const ROLE_FUNCTIONS = [
  { value: 'admin', label: 'Administrador do bot', key: 'admin_role_id' as const },
  { value: 'journalist', label: 'Jornalista', key: 'journalist_role_id' as const },
  { value: 'staff', label: 'Equipe de tickets', key: 'staff_role_ids' as const }
] as const;

export function channelFunction(value: string): ChannelFunction | null {
  return CHANNEL_FUNCTIONS.find((item) => item.value === value) ?? null;
}

export function roleFunction(value: string) {
  return ROLE_FUNCTIONS.find((item) => item.value === value) ?? null;
}

export const P0_CONFIG: readonly { readonly label: string; readonly key: ConfigKey }[] = [
  { label: 'Canal de publicações', key: 'publications_channel_id' },
  { label: 'Canal de leaderboard', key: 'leaderboard_channel_id' },
  { label: 'Painel de tickets', key: 'tickets_panel_channel_id' },
  { label: 'Categoria de suporte', key: 'support_category_id' },
  { label: 'Categoria de recrutamento', key: 'recruitment_category_id' },
  { label: 'Canal administrativo de tickets', key: 'tickets_admin_channel_id' },
  { label: 'Cargo administrador', key: 'admin_role_id' },
  { label: 'Cargo jornalista', key: 'journalist_role_id' },
  { label: 'Cargos de staff', key: 'staff_role_ids' }
];
