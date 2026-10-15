import type BetterSqlite3 from 'better-sqlite3';

export function up(database: BetterSqlite3.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS server_config (
      guild_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (guild_id, key)
    );

    CREATE TABLE IF NOT EXISTS journalists (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      added_at TEXT NOT NULL,
      PRIMARY KEY (guild_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS publications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      public_id TEXT UNIQUE,
      guild_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      headline_url TEXT NOT NULL,
      gang_one TEXT NOT NULL,
      score TEXT NOT NULL,
      gang_two TEXT NOT NULL,
      image_url TEXT,
      channel_id TEXT,
      message_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'published', 'failed')),
      failure_reason TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_publications_guild_author ON publications(guild_id, author_id, created_at);

    CREATE TABLE IF NOT EXISTS score_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      publication_id INTEGER UNIQUE,
      user_id TEXT NOT NULL,
      points INTEGER NOT NULL,
      event_type TEXT NOT NULL CHECK(event_type IN ('publication', 'adjustment')),
      reason TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (publication_id) REFERENCES publications(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_score_events_guild_user ON score_events(guild_id, user_id, created_at);

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      public_id TEXT UNIQUE,
      guild_id TEXT NOT NULL,
      requester_id TEXT NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('support', 'recruitment')),
      category_key TEXT NOT NULL,
      channel_id TEXT UNIQUE,
      initial_message_id TEXT,
      admin_message_id TEXT,
      state TEXT NOT NULL CHECK(state IN ('open', 'assigned', 'closed')),
      assignee_id TEXT,
      opened_at TEXT NOT NULL,
      closed_at TEXT,
      closed_by TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_open_ticket
      ON tickets(guild_id, requester_id, category_key)
      WHERE state IN ('open', 'assigned');
    CREATE INDEX IF NOT EXISTS idx_tickets_guild_state ON tickets(guild_id, state, opened_at);

    CREATE TABLE IF NOT EXISTS ticket_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      assignee_id TEXT NOT NULL,
      assigned_by TEXT,
      assignment_type TEXT NOT NULL CHECK(assignment_type IN ('auto', 'manual', 'reassigned')),
      assigned_at TEXT NOT NULL,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recruitment_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER UNIQUE,
      guild_id TEXT NOT NULL,
      applicant_id TEXT NOT NULL,
      identification TEXT NOT NULL,
      experience TEXT NOT NULL,
      motivation TEXT NOT NULL,
      availability TEXT NOT NULL,
      portfolio_url TEXT,
      state TEXT NOT NULL CHECK(state IN ('pending', 'processing', 'approved', 'rejected', 'failed')),
      reviewed_by TEXT,
      reviewed_at TEXT,
      rejection_reason TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS gangs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      name TEXT NOT NULL COLLATE NOCASE,
      role_id TEXT,
      invite_url TEXT NOT NULL,
      image_url TEXT,
      member_count INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(guild_id, name)
    );

    CREATE TABLE IF NOT EXISTS gang_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      public_id TEXT UNIQUE,
      guild_id TEXT NOT NULL,
      requester_id TEXT NOT NULL,
      invite_url TEXT NOT NULL,
      gang_name TEXT NOT NULL,
      role_name TEXT NOT NULL,
      image_url TEXT,
      member_count INTEGER NOT NULL,
      state TEXT NOT NULL CHECK(state IN ('pending', 'processing', 'approved', 'rejected', 'failed')),
      admin_message_id TEXT,
      created_at TEXT NOT NULL,
      processed_at TEXT,
      processed_by TEXT,
      failure_reason TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_gang_requests_guild_state ON gang_requests(guild_id, state, created_at);

    CREATE TABLE IF NOT EXISTS gang_removal_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      gang_id INTEGER NOT NULL,
      requester_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      state TEXT NOT NULL CHECK(state IN ('pending', 'processing', 'approved', 'rejected', 'failed')),
      admin_message_id TEXT,
      created_at TEXT NOT NULL,
      processed_at TEXT,
      processed_by TEXT,
      FOREIGN KEY(gang_id) REFERENCES gangs(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_gang_removal_requests_guild_state ON gang_removal_requests(guild_id, state, created_at);

    CREATE TABLE IF NOT EXISTS panels (
      guild_id TEXT NOT NULL,
      panel_type TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      message_id TEXT NOT NULL,
      payload TEXT,
      updated_at TEXT NOT NULL,
      PRIMARY KEY(guild_id, panel_type)
    );

    CREATE TABLE IF NOT EXISTS reaction_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      message_id TEXT NOT NULL,
      emoji TEXT NOT NULL,
      role_id TEXT NOT NULL,
      temporary INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      UNIQUE(guild_id, message_id, emoji)
    );

    CREATE TABLE IF NOT EXISTS admin_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      actor_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      created_at TEXT NOT NULL
    );
  `);
}
