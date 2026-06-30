CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  age INTEGER NOT NULL,
  major TEXT NOT NULL,
  phone TEXT
);

INSERT OR IGNORE INTO students (id, name, gender, age, major, phone) VALUES
  ('2023001', '张三', '男', 20, '计算机科学与技术', '13800138001'),
  ('2023002', '李四', '女', 19, '软件工程', '13800138002'),
  ('2023003', '王五', '男', 21, '人工智能', '13800138003'),
  ('2023004', '赵六', '女', 20, '信息安全', '13800138004'),
  ('2023005', '钱七', '男', 22, '物联网工程', '13800138005'),
  ('2023006', '周八', '女', 19, '计算机科学与技术', '13800138006'),
  ('2023007', '吴九', '男', 20, '人工智能', '13800138007'),
  ('2023008', '郑十', '女', 21, '软件工程', '13800138008');
