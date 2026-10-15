export type ConfigKey =
  | 'publications_channel_id'
  | 'leaderboard_channel_id'
  | 'tickets_panel_channel_id'
  | 'support_category_id'
  | 'recruitment_category_id'
  | 'tickets_admin_channel_id'
  | 'recruitment_admin_channel_id'
  | 'gangs_admin_channel_id'
  | 'gangs_public_channel_id'
  | 'gangs_panel_channel_id'
  | 'reaction_role_channel_id'
  | 'stats_channel_id'
  | 'logs_channel_id'
  | 'admin_role_id'
  | 'journalist_role_id'
  | 'staff_role_ids'
  | 'publication_points'
  | 'leaderboard_limit'
  | 'leaderboard_interval_minutes'
  | 'ticket_retention'
  | 'reaction_role_config';

export type TicketState = 'open' | 'assigned' | 'closed';
export type ApplicationState = 'pending' | 'processing' | 'approved' | 'rejected' | 'failed';
export type TicketKind = 'support' | 'recruitment';

export interface TicketRecord {
  readonly id: number;
  readonly publicId: string;
  readonly guildId: string;
  readonly requesterId: string;
  readonly kind: TicketKind;
  readonly categoryKey: string;
  readonly channelId: string | null;
  readonly initialMessageId: string | null;
  readonly adminMessageId: string | null;
  readonly state: TicketState;
  readonly assigneeId: string | null;
  readonly openedAt: string;
  readonly closedAt: string | null;
  readonly closedBy: string | null;
}

export interface LeaderboardEntry {
  readonly userId: string;
  readonly points: number;
  readonly publications: number;
  readonly firstReachedAt: string;
}

export interface PublicationInput {
  readonly guildId: string;
  readonly authorId: string;
  readonly headlineUrl: string;
  readonly gangOne: string;
  readonly score: string;
  readonly gangTwo: string;
  readonly imageUrl: string | null;
  readonly points: number;
}
