/**
 * AgenteEstudos — Camada de dados (localStorage)
 * Abstração completa do armazenamento local: CRUD para todas as entidades
 *
 * Entidades:
 *  - subjects   → Disciplinas (ex: Direito Administrativo)
 *  - topics     → Tópicos do edital vinculados às disciplinas
 *  - flashcards → Flashcards para repetição espaçada (SM-2)
 *  - questions  → Questões para active recall
 *  - attempts   → Tentativas de questões (histórico de acertos/erros)
 *  - sessions   → Sessões de estudo realizadas
 *  - settings   → Configurações do usuário
 */

const DB = (() => {

  // ——— Chaves de armazenamento ———
  const KEYS = {
    SUBJECTS:   'ae_subjects',
    TOPICS:     'ae_topics',
    FLASHCARDS: 'ae_flashcards',
    QUESTIONS:  'ae_questions',
    ATTEMPTS:   'ae_attempts',
    SESSIONS:   'ae_sessions',
    SETTINGS:   'ae_settings',
    SCHEDULES:  'ae_schedules'
  };

  // ——— Utilitários internos ———
  const uuid = () =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });

  const now = () => new Date().toISOString();

  const load = (key) => {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch { return []; }
  };

  const save = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const loadObj = (key, def = {}) => {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); }
    catch { return def; }
  };

  const saveObj = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // ════════════════════════════════════════════════════
  // ———  SETTINGS  ———
  // ════════════════════════════════════════════════════
  const Settings = {
    get() {
      return loadObj(KEYS.SETTINGS, {
        userName:      '',
        onboardingDone: false,
        theme: 'dark',
        reviewThreshold: 7
      });
    },
    save(settings) {
      saveObj(KEYS.SETTINGS, settings);
    },
    update(partial) {
      const current = Settings.get();
      Settings.save({ ...current, ...partial });
    }
  };

  // ════════════════════════════════════════════════════
  // ———  SUBJECTS (Disciplinas)  ———
  // ════════════════════════════════════════════════════
  const Subjects = {
    getAll() { return load(KEYS.SUBJECTS); },

    getById(id) {
      return Subjects.getAll().find(s => s.id === id) || null;
    },

    create(data) {
      const all = Subjects.getAll();
      const colorIndex = all.length % CONFIG.SUBJECT_COLORS.length;
      const iconIndex  = all.length % CONFIG.SUBJECT_ICONS.length;
      const subject = {
        id:        uuid(),
        name:      data.name || 'Nova Disciplina',
        weight:    data.weight || 1,       
        color:     data.color  || CONFIG.SUBJECT_COLORS[colorIndex],
        icon:      data.icon   || CONFIG.SUBJECT_ICONS[iconIndex],
        createdAt: now(),
        updatedAt: now()
      };
      all.push(subject);
      save(KEYS.SUBJECTS, all);
      return subject;
    },

    update(id, partial) {
      const all = Subjects.getAll().map(s =>
        s.id === id ? { ...s, ...partial, updatedAt: now() } : s
      );
      save(KEYS.SUBJECTS, all);
      return all.find(s => s.id === id);
    },

    delete(id) {
      save(KEYS.SUBJECTS, Subjects.getAll().filter(s => s.id !== id));
      save(KEYS.TOPICS, Topics.getAll().filter(t => t.subjectId !== id));
    }
  };

  // ════════════════════════════════════════════════════
  // ———  TOPICS (Tópicos do Edital)  ———
  // ════════════════════════════════════════════════════
  const Topics = {
    getAll()         { return load(KEYS.TOPICS); },
    getBySubject(id) { return Topics.getAll().filter(t => t.subjectId === id); },
    getById(id)      { return Topics.getAll().find(t => t.id === id) || null; },

    create(data) {
      const all = Topics.getAll();
      const topic = {
        id:              uuid(),
        subjectId:       data.subjectId,
        name:            data.name || 'Novo Tópico',
        status:          data.status || 'backlog', // backlog | studying | review | mastered
        notes:           data.notes || '',         // Anotações manuais do usuário
        createdAt:       now(),
        updatedAt:       now()
      };
      all.push(topic);
      save(KEYS.TOPICS, all);
      return topic;
    },

    update(id, partial) {
      const all = Topics.getAll().map(t =>
        t.id === id ? { ...t, ...partial, updatedAt: now() } : t
      );
      save(KEYS.TOPICS, all);
      return all.find(t => t.id === id);
    },

    markReviewed(id) {
      return Topics.update(id, {});
    },

    delete(id) {
      save(KEYS.TOPICS, Topics.getAll().filter(t => t.id !== id));
    }
  };

  // ════════════════════════════════════════════════════
  // ———  FLASHCARDS (SM-2)  ———
  // ════════════════════════════════════════════════════
  const Flashcards = {
    getAll()         { return load(KEYS.FLASHCARDS); },
    getByTopic(id)   { return Flashcards.getAll().filter(f => f.topicId === id); },
    getBySubject(id) { return Flashcards.getAll().filter(f => f.subjectId === id); },
    getById(id)      { return Flashcards.getAll().find(f => f.id === id) || null; },

    getDue() {
      return Flashcards.getAll().filter(f => SM2.isDue(f));
    },

    create(data) {
      const all = Flashcards.getAll();
      const card = {
        id:        uuid(),
        topicId:   data.topicId,
        subjectId: data.subjectId,
        front:     data.front || '',
        back:      data.back  || '',
        ...SM2.initCard(),      // efactor, interval, repetition, nextReview
        createdAt: now()
      };
      all.push(card);
      save(KEYS.FLASHCARDS, all);
      return card;
    },

    update(id, partial) {
      const all = Flashcards.getAll().map(f =>
        f.id === id ? { ...f, ...partial } : f
      );
      save(KEYS.FLASHCARDS, all);
      return all.find(f => f.id === id);
    },

    review(id, quality) {
      const card    = Flashcards.getById(id);
      if (!card) return null;
      const newState = SM2.calculate(card, quality);
      return Flashcards.update(id, newState);
    },

    deleteByTopic(topicId) {
      save(KEYS.FLASHCARDS, Flashcards.getAll().filter(f => f.topicId !== topicId));
    }
  };

  // ════════════════════════════════════════════════════
  // ———  QUESTIONS (Questões de Active Recall)  ———
  // ════════════════════════════════════════════════════
  const Questions = {
    getAll()         { return load(KEYS.QUESTIONS); },
    getByTopic(id)   { return Questions.getAll().filter(q => q.topicId === id); },
    getBySubject(id) { return Questions.getAll().filter(q => q.subjectId === id); },
    getById(id)      { return Questions.getAll().find(q => q.id === id) || null; },

    create(data) {
      const all = Questions.getAll();
      const question = {
        id:            uuid(),
        topicId:       data.topicId,
        subjectId:     data.subjectId,
        type:          data.type || CONFIG.QUESTION_TYPES.MC, // 'MC' | 'OPEN'
        question:      data.question || '',
        options:       data.options || [],      // Array de strings p/ MC
        correctOption: data.correctOption ?? 0, // Índice da resposta correta
        answer:        data.answer || '',       // Resposta p/ questão aberta
        explanation:   data.explanation || '',  // Explicação da resposta
        difficulty:    data.difficulty || 2,    // 1-3
        createdAt:     now()
      };
      all.push(question);
      save(KEYS.QUESTIONS, all);
      return question;
    },

    delete(id) {
      save(KEYS.QUESTIONS, Questions.getAll().filter(q => q.id !== id));
    }
  };

  // ════════════════════════════════════════════════════
  // ———  ATTEMPTS (Histórico de respostas)  ———
  // ════════════════════════════════════════════════════
  const Attempts = {
    getAll()          { return load(KEYS.ATTEMPTS); },
    getByQuestion(id) { return Attempts.getAll().filter(a => a.questionId === id); },
    getBySubject(id)  { return Attempts.getAll().filter(a => a.subjectId  === id); },
    getErrors()       { return Attempts.getAll().filter(a => !a.correct); },

    create(data) {
      const all = Attempts.getAll();
      const attempt = {
        id:          uuid(),
        questionId:  data.questionId,
        topicId:     data.topicId,
        subjectId:   data.subjectId,
        correct:     data.correct,
        userAnswer:  data.userAnswer || '',
        timeSpent:   data.timeSpent  || 0,  // segundos
        attemptedAt: now()
      };
      all.push(attempt);
      save(KEYS.ATTEMPTS, all);
      return attempt;
    },

    getAccuracyBySubject(subjectId) {
      const attempts = Attempts.getBySubject(subjectId);
      if (attempts.length === 0) return null;
      const correct = attempts.filter(a => a.correct).length;
      return Math.round((correct / attempts.length) * 100);
    },

    getOverallAccuracy() {
      const all = Attempts.getAll();
      if (all.length === 0) return 0;
      return Math.round((all.filter(a => a.correct).length / all.length) * 100);
    }
  };

  // ════════════════════════════════════════════════════
  // ———  SESSIONS (Sessões de estudo)  ———
  // ════════════════════════════════════════════════════
  const Sessions = {
    getAll()      { return load(KEYS.SESSIONS); },
    getToday()    {
      const today = new Date().toDateString();
      return Sessions.getAll().filter(s => new Date(s.completedAt).toDateString() === today);
    },
    getThisWeek() {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return Sessions.getAll().filter(s => new Date(s.completedAt) >= weekAgo);
    },

    create(data) {
      const all = Sessions.getAll();
      const session = {
        id:          uuid(),
        topicId:     data.topicId,
        subjectId:   data.subjectId,
        type:        data.type || 'study',  // 'study' | 'review' | 'questions'
        duration:    data.duration || 0,    // segundos
        completedAt: now()
      };
      all.push(session);
      save(KEYS.SESSIONS, all);
      return session;
    },

    getTodayMinutes() {
      return Sessions.getToday().reduce((sum, s) => sum + Math.round(s.duration / 60), 0);
    },

    getStreak() {
      const all = Sessions.getAll().sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
      if (all.length === 0) return 0;
      let streak = 0;
      const checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);
      for (let i = 0; i < 365; i++) {
        const dayStr = checkDate.toDateString();
        if (all.some(s => new Date(s.completedAt).toDateString() === dayStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else break;
      }
      return streak;
    }
  };

  // ════════════════════════════════════════════════════
  // ———  SCHEDULES (Agenda)  ———
  // ════════════════════════════════════════════════════
  const Schedules = {
    getAll() { return load(KEYS.SCHEDULES); },
    getByDate(date) { return Schedules.getAll().filter(s => s.date === date); },
    getById(id) { return Schedules.getAll().find(s => s.id === id) || null; },

    create(data) {
      const all = Schedules.getAll();
      const sched = {
        id:        uuid(),
        topicId:   data.topicId,
        date:      data.date, // format: YYYY-MM-DD
        createdAt: now()
      };
      all.push(sched);
      save(KEYS.SCHEDULES, all);
      return sched;
    },

    delete(id) {
      save(KEYS.SCHEDULES, Schedules.getAll().filter(s => s.id !== id));
    },

    deleteByTopic(topicId) {
      save(KEYS.SCHEDULES, Schedules.getAll().filter(s => s.topicId !== topicId));
    }
  };

  // ——— API pública ———
  return { Settings, Subjects, Topics, Flashcards, Questions, Attempts, Sessions, Schedules };

})();
