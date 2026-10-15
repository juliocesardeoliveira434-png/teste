# Jornal das Gangues — Bot Discord

Bot autocontido para jornalismo competitivo entre gangues. Ele funciona em **um único servidor**, usa SQLite local em modo WAL e não envia dados, telemetria ou credenciais para o desenvolvedor ou outros serviços. O cliente controla o token, a hospedagem, o banco e os backups.

## Recursos

- publicação jornalística por modal (`/embed_jornal`), com validação de URL e placar, banner local em PNG quando não há imagem e pontuação idempotente;
- ranking renderizado em PNG local (`/leaderboard`) e painel persistente atualizável;
- tickets privados de suporte, atribuição concorrente segura, painel administrativo privado, histórico e encerramento idempotente;
- inscrições de jornalistas, com aprovação sem autoaprovação, atribuição do cargo e registro da decisão;
- cadastro/aprovação de gangues e cargos criados **somente após aprovação**; remoção separa o registro do cargo;
- reaction role de jornalista, incluindo partials, remoção temporária opcional e recriação do painel apagado;
- estatísticas honestas de membros humanos/bots, ferramentas de saúde/configuração e editores de embeds/botões do próprio bot.

> **Premissas de segurança adotadas:** o servidor é único (`GUILD_ID`); administradores Discord (Gerenciar Servidor ou Administrador) podem executar a configuração inicial sem cargo pré-configurado; tickets usam uma categoria de suporte padrão e uma de recrutamento; a política padrão de tickets encerrados é **manter o canal**, sem exclusão automática. Essas escolhas evitam acesso perdido e remoção irreversível.

## Requisitos

- Node.js **20 ou superior** (recomendado: LTS atual);
- permissões para instalar pacotes npm e manter um processo Node em execução;
- uma aplicação criada no Discord Developer Portal.

Não é necessário Redis, PostgreSQL, painel web, API paga, IA, CDN de imagem ou conta do desenvolvedor.

## Instalação

```bash
# Na pasta entregue
npm install
cp .env.example .env
# Edite .env com um editor de texto
npm run deploy-commands
npm run build
npm start
```

Para desenvolvimento com recarga:

```bash
npm run dev
```

## `.env`, variável por variável

| Variável | Obrigatória | Finalidade |
|---|---:|---|
| `DISCORD_TOKEN` | Sim | Token secreto do bot, criado no Developer Portal. Não compartilhe nem publique. |
| `CLIENT_ID` | Sim | Application ID da aplicação Discord. |
| `GUILD_ID` | Sim | ID do servidor que o bot poderá operar. O bot recusa outros servidores. |
| `DATABASE_PATH` | Não | Caminho do SQLite. Padrão: `./data/bot.sqlite`. |
| `LOG_LEVEL` | Não | `trace`, `debug`, `info`, `warn` ou `error`; padrão `info`. |

O diretório `data/` é criado automaticamente e está no `.gitignore`. Não distribua uma base de desenvolvimento.

## Discord Developer Portal — passo a passo

1. Acesse **Discord Developer Portal → Applications → New Application**.
2. Em **Bot**, use **Reset Token**, copie o token uma única vez e preencha `DISCORD_TOKEN` no `.env`.
3. Em **General Information**, copie **Application ID** para `CLIENT_ID`.
4. Ative em **Bot → Privileged Gateway Intents**:
   - **Server Members Intent / GuildMembers**: necessário para contar humanos/bots, buscar staff e atribuir cargos;
   - **Message Content Intent não é necessário**;
   - o código usa o intent **GuildMessageReactions** (não privilegiado) para reaction roles.
5. Em **OAuth2 → URL Generator**, marque os scopes `bot` e `applications.commands`.
6. Em **Bot Permissions**, selecione pelo menos: Ver Canais, Enviar Mensagens, Incorporar Links, Anexar Arquivos, Ler Histórico de Mensagens, Adicionar Reações, Gerenciar Canais e Gerenciar Cargos. Para manter tickets privados e painéis, configure também as permissões dos canais/categorias selecionados.
7. Abra a URL gerada, convide o bot para o servidor e obtenha o ID do servidor (ative **Modo desenvolvedor** no Discord → clique direito no servidor → **Copiar ID**).
8. Execute `npm run deploy-commands` após configurar `.env`, e então inicie o processo.

### Hierarquia de cargos

O cargo mais alto do bot deve ficar **acima** do cargo de Jornalista e de todos os cargos que ele poderá atribuir/criar. O Discord não permite alterar cargos acima do bot, mesmo com a permissão correta.

## Configuração inicial no Discord

Todos os comandos administrativos verificam o cargo configurado **ou** a permissão Discord Gerenciar Servidor/Administrador. Isso permite iniciar a configuração sem criar um backdoor.

1. Execute `/select_channel` para cada função necessária:
   - Publicações jornalísticas;
   - Leaderboard;
   - Painel de tickets;
   - Categoria de suporte;
   - Categoria de recrutamento;
   - Canal admin de tickets (**privado**, negue `Ver Canal` a `@everyone`);
   - Canal de inscrições (opcional: se vazio, usa o canal admin de tickets);
   - canais de gangues (admin, público e painel);
   - painel de reaction role, estatísticas e logs/transcrições.
2. Execute `/select_role` para Administrador, Jornalista e Staff. O seletor de Staff registra o cargo de atendimento; reexecute para trocar o cargo padrão.
3. Confira `/config_status` e `/health`.
4. Publique os painéis desejados: `/setup_tickets`, `/setup_leaderboard`, `/setup_gangs`, `/setup_reactionrole` e `/setup_stats`.

Os painéis possuem ID persistido no SQLite; quando atualizados, o bot edita a mesma mensagem. Leaderboard, tickets e reaction role também tentam recuperar a mensagem persistente no boot quando ela foi apagada.

## Guia de uso

### Jornal e pontos

- jornalistas configurados usam `/embed_jornal` e abrem o formulário;
- URLs aceitam somente HTTP/HTTPS público; `file://`, `localhost`, IPs privados e URLs com credenciais são recusados;
- o placar aceita `3 x 1`, `3-1` e `3×1`, sempre exibido como `3 × 1`;
- sem URL de imagem, o bot gera localmente um banner de 1200×400 com `@napi-rs/canvas` e a fonte incluída em `assets/`;
- cada publicação confirmada gera um único evento de pontuação. A constraint única por publicação impede duplicação em retries/reinícios;
- `/leaderboard` mostra a imagem atual. O desempate é pontos → publicações → primeiro evento/publicação mais antigo → ID de usuário.

O valor padrão é 1 ponto e pode ser definido diretamente na tabela `server_config` apenas por manutenção administrativa consciente; a aplicação não inclui um comando de ajuste de pontuação nesta versão.

### Tickets e inscrições

- o painel possui **Abrir suporte** e **Recrutamento jornalístico**;
- suporte cria um canal privado e impede duplicata aberta por pessoa/categoria no banco;
- `Chamar staff` seleciona aleatoriamente um staff elegível, com mutex por servidor e `UPDATE` condicional; não há ping coletivo;
- o painel administrativo contém assumir, reatribuir e encerrar. Fechamento é confirmado e idempotente;
- inscrições usam cinco campos (limite de modais Discord). Aprovar exige administrador, bloqueia autoaprovação e só marca aprovado após o Discord confirmar a atribuição do cargo;
- DMs bloqueadas têm fallback efêmero nos fluxos que começam por DM.

A transcrição e a exclusão/agendamento de canais encerrados ainda não são implementadas; por segurança o canal é mantido para auditoria.

### Gangues

`/setup_gangs` publica o painel. O alistamento tenta DM; se a pessoa bloquear DM, abre o mesmo formulário no servidor. A equipe recebe uma análise privada e só então pode aprovar ou recusar. Na aprovação o bot valida nome duplicado, permissões/hierarquia, cria o cargo, atribui ao solicitante e registra a gangue. Convites são validados apenas quanto ao formato: **a equipe deve verificar se um convite de outro servidor continua válido**.

A remoção abre solicitação administrativa e, por padrão, remove só o registro. O cargo é preservado — excluir cargo é propositalmente uma ação separada, pois ele pode ter membros.

### Reaction role, estatísticas e edição

- `/setup_reactionrole` publica uma regra de emoji para Jornalista. A remoção de reação só remove o cargo se a opção `temporario` foi usada;
- `/set_update_interval minutos` ativa (mínimo de 5 minutos) ou desativa (`0`) a atualização automática do leaderboard, respeitando rate limits;
- `/server_stats` não inventa contagens: se a lista de membros não puder ser obtida, humanos e bots aparecem como `indisponível`;
- `/edit_embed canal id` permite conteúdo, aparência, rodapé e fields, validando limites de embed;
- `/edit_botoes canal id` só edita mensagens do bot: visualiza, renomeia, muda estilo, remove, reordena e configura links. Ao adicionar, só aceita link ou o handler real `ticket-call` para um ticket aberto — o bot nunca cria botão sem comportamento implementado.

## Operação persistente

### PM2

```bash
npm install --global pm2
npm run build
pm2 start dist/index.js --name jornal-das-gangues
pm2 save
pm2 startup
```

### systemd (Linux)

Crie `/etc/systemd/system/jornal-das-gangues.service` (ajuste usuário e pasta):

```ini
[Unit]
Description=Jornal das Gangues Discord bot
After=network.target

[Service]
Type=simple
User=SEU_USUARIO
WorkingDirectory=/caminho/para/o/projeto
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /caminho/para/o/projeto/dist/index.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Depois execute `sudo systemctl daemon-reload`, `sudo systemctl enable --now jornal-das-gangues` e consulte `journalctl -u jornal-das-gangues -f`.

## Backup e restauração

1. Pare o processo para um backup mais simples e consistente.
2. Copie `data/bot.sqlite` **e**, se presentes, `data/bot.sqlite-wal` e `data/bot.sqlite-shm` para local seguro.
3. Para restaurar, pare o bot, substitua os três arquivos pelo conjunto copiado e inicie novamente.

O SQLite usa WAL e as migrações são versionadas/aditivas. Nunca edite/apague tabelas sem backup.

## Scripts de qualidade

```bash
npm run typecheck  # TypeScript estrito sem emitir arquivos
npm run lint       # ESLint do código-fonte
npm test           # testes Vitest que não usam Discord
npm run build      # compilação de produção em dist/
```

Integrações reais com Discord não são executadas automaticamente: exigem token, servidor e permissões do cliente. Antes de operar em produção, teste em um servidor separado com cargos/canais equivalentes.

## Limitações conhecidas

- O bot não resolve DNS para validar URLs; bloqueia padrões locais/IPs privados e não baixa imagens externas para publicação. Em ambiente hostil, use uma camada de egress/proxy da sua infraestrutura contra DNS rebinding.
- Apenas uma categoria padrão de suporte é configurada pela interface atual.
- Transcrição de ticket, exclusão agendada e painel web não fazem parte desta entrega.
- Painéis de gangues e estatísticas são persistidos e reeditáveis via seus comandos de setup; a recuperação automática no boot está implementada para leaderboard, tickets e reaction role.
- O cliente é responsável por manter permissões, canais e cargos não apagados; `/health` sinaliza destinos removidos.

## Estrutura

```text
assets/                         fonte local e licença
src/
  commands/                     slash commands por área
  config/                       env, mensagens e configuração de servidor
  database/                     conexão WAL, migrações e repositórios
  embeds/                       apresentação consistente em pt-BR
  events/                       ready, interactions e reações
  graphics/                     banner e leaderboard local
  interactions/                 handlers de botões, modais e selects
  services/                     regras de negócio e guardas de permissão
  utils/                        validadores, IDs e tempo
tests/unit/                     validadores, persistência e estados
.env.example                    variáveis necessárias
```

A fonte DejaVu Sans incluída é distribuída sob a licença em `assets/DejaVuSans-LICENSE.txt`.
