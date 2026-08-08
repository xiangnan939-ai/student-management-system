-- 为系统日志增加 IP 地址字段，以及自动清理超过7天的日志
ALTER TABLE system_logs ADD COLUMN ip TEXT;

-- 创建索引加快按时间清理和查询的速度
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
