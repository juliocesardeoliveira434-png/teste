/** All text intended for Discord users is centralized here to keep pt-BR consistent. */
export const BRAND = 'Jornal das Gangues';
export const COLORS = {
  neutral: 0x2b2d31,
  success: 0x2d7d46,
  danger: 0xbc3f4a,
  warning: 0xc9871f,
  accent: 0x5865f2,
  muted: 0x5a6270
} as const;

export const COPY = {
  noPermission: 'Você não tem permissão para executar esta ação.',
  expired: 'Esta interação expirou. Abra o painel ou execute o comando novamente.',
  genericError: 'Não foi possível concluir a ação agora. A equipe técnica foi avisada pelos logs.',
  guildOnly: 'Este comando só pode ser usado no servidor configurado.',
  wrongGuild: 'Este bot está bloqueado para outro servidor.',
  configSaved: (name: string, target: string) => `Configuração atualizada: **${name}** → ${target}.`,
  notConfigured: (name: string) => `A configuração **${name}** ainda não foi definida.`,
  missingPermission: (permission: string) => `O bot precisa da permissão **${permission}** para concluir esta ação.`,
  journalPublished: (id: string, points: number) => `Publicação **${id}** enviada. Foram registrados **${points} ponto(s)** de forma idempotente.`,
  ticketAlreadyOpen: 'Você já possui um ticket aberto nesta categoria.',
  ticketCreated: (id: string) => `Ticket **${id}** criado com sucesso.`,
  ticketClosed: (id: string) => `O ticket **${id}** foi encerrado.`,
  ticketNoStaff: 'Nenhum membro elegível da equipe está disponível. Seu ticket continua aberto.',
  ticketAssigned: (id: string) => `Responsável definido para o ticket **${id}**.`,
  leaderboardEmpty: 'Ainda não há publicações pontuadas para exibir.',
  healthOk: 'Verificação concluída. Veja os detalhes abaixo.',
  selectAChannel: 'Selecione o canal compatível no menu abaixo.',
  selectARole: 'Selecione o cargo no menu abaixo.',
  setupSaved: (panel: string) => `Painel **${panel}** publicado e salvo para atualizações futuras.`,
  privateAdminChannel: 'O canal administrativo precisa negar **Ver Canal** para @everyone antes de publicar este painel.'
} as const;
