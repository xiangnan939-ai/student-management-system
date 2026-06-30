const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件存储在 server 目录下
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('数据库连接失败:', err.message);
    } else {
        console.log('已连接到 SQLite 数据库.');
    }
});

// 初始化表结构与模拟数据
db.serialize(() => {
    // 学生表
    db.run(`CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        gender TEXT NOT NULL,
        age INTEGER NOT NULL,
        major TEXT NOT NULL,
        phone TEXT
    )`);

    // 检查是否有数据，如果没有则插入模拟数据
    db.get("SELECT COUNT(*) AS count FROM students", (err, row) => {
        if (!err && row.count === 0) {
            console.log('正在初始化模拟数据...');
            const insert = db.prepare("INSERT INTO students (id, name, gender, age, major, phone) VALUES (?, ?, ?, ?, ?, ?)");
            const mockData = [
                ['2023001', '张三', '男', 20, '计算机科学与技术', '13800138001'],
                ['2023002', '李四', '女', 19, '软件工程', '13800138002'],
                ['2023003', '王五', '男', 21, '人工智能', '13800138003'],
                ['2023004', '赵六', '女', 20, '信息安全', '13800138004'],
                ['2023005', '钱七', '男', 22, '物联网工程', '13800138005'],
                ['2023006', '周八', '女', 19, '计算机科学与技术', '13800138006'],
                ['2023007', '吴九', '男', 20, '人工智能', '13800138007'],
                ['2023008', '郑十', '女', 21, '软件工程', '13800138008']
            ];
            mockData.forEach(student => insert.run(student));
            insert.finalize();
            console.log('模拟数据初始化完成.');
        }
    });
});

module.exports = db;
