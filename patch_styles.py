import re

with open('src/styles.scss', 'r') as f:
    content = f.read()

replacement = '''
.kpi-mini-card, .student-360-card, .kpi-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid var(--slate-200);
  border-radius: var(--radius-xl);
  padding: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  position: relative;
  overflow: hidden;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.kpi-mini-card:hover, .student-360-card:hover, .kpi-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 20px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.kpi-mini-card, .kpi-card {
  border-left: 5px solid var(--primary-500);
}

.student-360-card {
  border-left: 5px solid var(--secondary-500);
}
'''

content = re.sub(
    r'\.kpi-mini-card, \.student-360-card, \.kpi-card \{[\s\S]*?border-left: 4px solid var\(--primary-500\);\n\}',
    replacement,
    content
)

with open('src/styles.scss', 'w') as f:
    f.write(content)
