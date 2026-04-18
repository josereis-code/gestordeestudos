/**
 * AgenteEstudos — Configurações globais do aplicativo
 * Contém constantes, configurações padrão e mapeamentos
 */

const CONFIG = {
  APP_NAME: 'Kanban de Estudos',
  VERSION: '1.2.0',

  // ——— Cores das disciplinas (10 disponíveis, rotacionam) ———
  SUBJECT_COLORS: [
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#ef4444', // red
    '#14b8a6', // teal
    '#f97316', // orange
    '#06b6d4'  // cyan
  ],

  // ——— Ícones para disciplinas ———
  SUBJECT_ICONS: ['📚', '⚖️', '🏛️', '📊', '🔢', '📝', '🌍', '🔍', '💡', '🎯'],

  // ——— Rotas da SPA ———
  ROUTES: {
    KANBAN:        'kanban',
    AGENDA:        'agenda',
    DESEMPENHO:    'desempenho',
    DISCIPLINAS:   'disciplinas',
    CONFIGURACOES: 'configuracoes'
  },

  // ——— Colunas do Kanban (em ordem) ———
  KANBAN_COLUMNS: {
    backlog:   { key: 'backlog',  title: '📥 Backlog',       subtitle: 'Ainda não estudado',  color: '#64748b' },
    studying:  { key: 'studying', title: '📖 Estudando',     subtitle: 'Em aprendizado',      color: '#6366f1' },
    review:    { key: 'review',   title: '🔄 Para Revisar',  subtitle: 'Revisão manual',     color: '#f59e0b' },
    mastered:  { key: 'mastered', title: '🏆 Dominado',      subtitle: 'Conhecimento total',  color: '#10b981' }
  },

  // ——— Ciclo de Revisão (Curva de Esquecimento) ———
  REVIEW_THRESHOLD_DAYS: 7 
};
