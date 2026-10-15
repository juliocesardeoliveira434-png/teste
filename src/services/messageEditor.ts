import { ActionRowBuilder, ButtonBuilder, ComponentType, EmbedBuilder, type APIButtonComponent, type ButtonStyle, type Guild, type Message, type TextChannel } from 'discord.js';
import type { AppContext } from '../types/app';

export interface MessageAddress { readonly channelId: string; readonly messageId: string; }
export interface EditableButton { readonly type: 2; readonly style: ButtonStyle; readonly label?: string; readonly custom_id?: string; readonly url?: string; readonly disabled?: boolean; }

export function messageEntity(channelId: string, messageId: string): string { return `${channelId}-${messageId}`; }
export function parseMessageEntity(value: string): MessageAddress | null {
  const match = /^(\d{16,22})-(\d{16,22})$/.exec(value);
  return match?.[1] && match[2] ? { channelId: match[1], messageId: match[2] } : null;
}

export async function ownedBotMessage(context: AppContext, guild: Guild, entity: string): Promise<Message<true>> {
  const address = parseMessageEntity(entity);
  if (!address) throw new Error('Identificador de mensagem inválido.');
  const channel = await guild.channels.fetch(address.channelId);
  if (!channel?.isTextBased() || !('messages' in channel)) throw new Error('O canal da mensagem não existe ou não aceita edição.');
  const message = await (channel as TextChannel).messages.fetch(address.messageId);
  if (message.author.id !== context.client.user?.id) throw new Error('Só é possível editar mensagens enviadas por este bot.');
  return message;
}

export function currentEmbed(message: Message<true>): EmbedBuilder { return EmbedBuilder.from(message.embeds[0]?.toJSON() ?? {}); }

export function assertEmbedLimits(embed: EmbedBuilder): void {
  const json = embed.toJSON();
  const fields = json.fields ?? [];
  const total = (json.title?.length ?? 0) + (json.description?.length ?? 0) + (json.footer?.text.length ?? 0) + fields.reduce((sum, field) => sum + field.name.length + field.value.length, 0);
  if ((json.description?.length ?? 0) > 4096) throw new Error('A descrição excede o limite de 4096 caracteres.');
  if (fields.length > 25) throw new Error('Uma embed suporta no máximo 25 fields.');
  if (fields.some((field) => field.name.length > 256 || field.value.length > 1024)) throw new Error('Um field excede 256 caracteres no nome ou 1024 no valor.');
  if (total > 6000) throw new Error('A embed excede o limite total de 6000 caracteres.');
}

export function buttonsOf(message: Message<true>): EditableButton[] {
  const buttons: EditableButton[] = [];
  for (const row of message.components) {
    if (!('components' in row)) throw new Error('A mensagem contém componentes que não podem ser editados por este painel.');
    for (const component of row.components) {
      const json = component.toJSON();
      if (json.type !== ComponentType.Button) throw new Error('A mensagem contém menus; este editor preserva somente mensagens com botões.');
      buttons.push(json as unknown as EditableButton);
    }
  }
  if (buttons.length > 25) throw new Error('A mensagem excede o limite de 25 botões.');
  return buttons;
}

export function buttonRows(buttons: readonly EditableButton[]): ActionRowBuilder<ButtonBuilder>[] {
  if (buttons.length > 25) throw new Error('Uma mensagem suporta no máximo 25 botões.');
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let index = 0; index < buttons.length; index += 5) {
    const group = buttons.slice(index, index + 5);
    rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(group.map((button) => ButtonBuilder.from(button as unknown as APIButtonComponent))));
  }
  return rows;
}
