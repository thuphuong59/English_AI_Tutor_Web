-- Xóa các bảng cũ nếu tồn tại để tránh lỗi khi chạy lại script
DROP TABLE IF EXISTS dialogue_lines;
DROP TABLE IF EXISTS scenarios;
DROP TABLE IF EXISTS conversation_messages CASCADE;
DROP TABLE IF EXISTS conversation_history CASCADE;
DROP TABLE IF EXISTS conversation_sessions CASCADE;
DROP FUNCTION IF EXISTS update_timestamp();

-- Bảng 1: Lưu thông tin chung về mỗi kịch bản
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  topic TEXT NOT NULL,
  level TEXT NOT NULL,
  title TEXT NOT NULL
);

-- Bảng 2: Lưu từng câu thoại trong kịch bản
CREATE TABLE dialogue_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  turn INTEGER NOT NULL,
  speaker TEXT NOT NULL CHECK (speaker IN ('ai', 'user')),
  line TEXT NOT NULL,
  -- Đảm bảo mỗi lượt thoại trong một kịch bản là duy nhất
  UNIQUE(scenario_id, turn)
);

-- Thêm ghi chú (comment) cho các bảng để dễ quản lý
COMMENT ON TABLE scenarios IS 'Stores high-level information about conversation scenarios.';
COMMENT ON TABLE dialogue_lines IS 'Stores individual lines of dialogue for each scenario, linked to a parent scenario.';

-- Bảng 3: Lưu thông tin chung về mỗi "phiên" hội thoại
  CREATE TABLE conversation_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      topic TEXT NOT NULL,
      mode TEXT CHECK (mode IN ('scenario', 'free')) NOT NULL,
      level TEXT NOT NULL,
      total_messages INTEGER DEFAULT 0,
      ai_feedback_summary TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
  );

-- Bảng 4: Lưu lịch sử hội thoại dưới dạng mảng JSON
CREATE TABLE conversation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    messages JSONB DEFAULT '[]'::jsonb,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Bảng 5: Lưu từng tin nhắn (cách làm cũ, có thể dùng để backup hoặc logging)
CREATE TABLE conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'ai')),
    content TEXT,
    message_type TEXT CHECK (message_type IN ('feedback', 'summary', 'speech')) DEFAULT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger để tự động cập nhật thời gian
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sessions_timestamp
BEFORE UPDATE ON conversation_sessions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

ALTER TABLE conversation_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_history DISABLE ROW LEVEL SECURITY;

create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  history jsonb default '[]',
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  history jsonb default '[]',
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  history jsonb default '[]',
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  history jsonb default '[]',
  created_at timestamp default now(),
  updated_at timestamp default now()
);


