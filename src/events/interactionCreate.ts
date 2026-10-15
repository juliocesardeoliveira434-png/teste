import { type Client, type Interaction } from 'discord.js';
import type { AppContext } from '../types/app';
import { commandsByName } from '../commands';
import { errorEmbed } from '../embeds/factory';
import { parseCustomId } from '../utils/customId';
import { respondUnexpected, safeReply } from '../utils/discord';
import { handleButton } from '../interactions/buttons/handlers';
import { handleModal } from '../interactions/modals/handlers';
import { handleSelect } from '../interactions/selects/handlers';
import { handleGangButton } from '../interactions/buttons/gangHandlers';
import { handleGangModal } from '../interactions/modals/gangHandlers';
import { handleGangSelect } from '../interactions/selects/gangHandlers';
import { handleEditorButton } from '../interactions/buttons/editorHandlers';
import { handleEditorModal } from '../interactions/modals/editorHandlers';

export function registerInteractionCreate(client: Client, context: AppContext): void {
  client.on('interactionCreate', async (interaction: Interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        const command = commandsByName.get(interaction.commandName);
        if (!command) {
          await safeReply(interaction, { embeds: [errorEmbed('Comando indisponível', 'Este comando não está registrado neste processo.')], flags: 64 }, context.logger);
          return;
        }
        await command.execute(interaction, context);
        return;
      }
      if (interaction.isButton() || interaction.isModalSubmit() || interaction.isAnySelectMenu()) {
        const parsed = parseCustomId(interaction.customId);
        if (!parsed) {
          await safeReply(interaction, { embeds: [errorEmbed('Componente inválido', 'Este componente expirou ou não é reconhecido.')], flags: 64 }, context.logger);
          return;
        }
        if (interaction.isButton()) {
          if (parsed.namespace === 'gang') await handleGangButton(interaction, parsed, context);
          else if (parsed.namespace === 'editembed' || parsed.namespace === 'editbuttons') await handleEditorButton(interaction, parsed, context);
          else await handleButton(interaction, parsed, context);
        } else if (interaction.isModalSubmit()) {
          if (parsed.namespace === 'gang') await handleGangModal(interaction, parsed, context);
          else if (parsed.namespace === 'editembed' || parsed.namespace === 'editbuttons') await handleEditorModal(interaction, parsed, context);
          else await handleModal(interaction, parsed, context);
        } else {
          if (parsed.namespace === 'gang' && interaction.isStringSelectMenu()) await handleGangSelect(interaction, parsed, context);
          else await handleSelect(interaction, parsed, context);
        }
      }
    } catch (error: unknown) {
      context.logger.error({ err: error, interactionId: interaction.id }, 'Erro não tratado em interação');
      if (interaction.isRepliable()) await respondUnexpected(interaction, context.logger);
    }
  });
}
