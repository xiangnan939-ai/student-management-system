-- 系统日志增强：添加 user_agent 和 target_id 字段
ALTER TABLE system_logs ADD COLUMN user_agent TEXT;
ALTER TABLE system_logs ADD COLUMN target_id TEXT;
ALTER TABLE system_logs ADD COLUMN method TEXT;
ALTER TABLE system_logs ADD COLUMN path TEXT;

-- 创建更多索引用于筛选
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_logs_actor ON system_logs(actor);
