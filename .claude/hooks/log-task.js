// Hook PostToolUse (TodoWrite): ghi lại tiến trình task vào .claude/logs/task-log.md
// Mỗi lần Claude cập nhật todo list, snapshot trạng thái được append kèm timestamp.
let data = '';
process.stdin.on('data', (c) => (data += c));
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const todos = (input.tool_input && input.tool_input.todos) || [];
    if (todos.length === 0) return;
    const fs = require('fs');
    const path = require('path');
    const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const dir = path.join(root, '.claude', 'logs');
    fs.mkdirSync(dir, { recursive: true });
    const mark = (s) => (s === 'completed' ? '[x]' : s === 'in_progress' ? '[>]' : '[ ]');
    const lines = todos.map((t) => `- ${mark(t.status)} ${t.content}`).join('\n');
    const stamp = new Date().toLocaleString('sv-SE'); // YYYY-MM-DD HH:mm:ss giờ máy
    fs.appendFileSync(path.join(dir, 'task-log.md'), `## ${stamp}\n${lines}\n\n`);
  } catch {
    // Hook log không được phép làm hỏng phiên làm việc — nuốt lỗi
  }
});
