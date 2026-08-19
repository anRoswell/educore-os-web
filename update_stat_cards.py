import sys

with open('src/app/pages/asistencia/asistencia.component.ts', 'r') as f:
    content = f.read()

old_css = """    .stat-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .stat-icon { font-size: 2rem; }
    .stat-info h3 { font-size: 0.85rem; color: #64748b; margin: 0; }
    .stat-info p { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; }
    .stat-card.success .stat-info p { color: #10b981; }
    .stat-card.warning .stat-info p { color: #f59e0b; }
    .stat-card.danger .stat-info p { color: #ef4444; }"""

new_css = """    .stat-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #6366f1; /* Indigo default */
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: all 0.3s ease;
      cursor: default;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px -5px rgba(99,102,241,0.2);
    }
    .stat-icon { font-size: 2rem; }
    .stat-info h3 { font-size: 0.85rem; color: #64748b; margin: 0; }
    .stat-info p { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; }
    
    .stat-card.success { border-left-color: #10b981; }
    .stat-card.success:hover { box-shadow: 0 10px 25px -5px rgba(16,185,129,0.2); }
    .stat-card.success .stat-info p { color: #10b981; }
    
    .stat-card.warning { border-left-color: #f59e0b; }
    .stat-card.warning:hover { box-shadow: 0 10px 25px -5px rgba(245,158,11,0.2); }
    .stat-card.warning .stat-info p { color: #f59e0b; }
    
    .stat-card.danger { border-left-color: #ef4444; }
    .stat-card.danger:hover { box-shadow: 0 10px 25px -5px rgba(239,68,68,0.2); }
    .stat-card.danger .stat-info p { color: #ef4444; }"""

content = content.replace(old_css, new_css)

with open('src/app/pages/asistencia/asistencia.component.ts', 'w') as f:
    f.write(content)
