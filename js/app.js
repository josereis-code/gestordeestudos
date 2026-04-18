/**
 * Kanban de Estudos — Aplicação Principal
 * Foco: Controle 100% manual e visual.
 */

const UI = {
  toast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = { success: '✅', error: '❌', info: '💡', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type] || '💡'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  modal(title, content, actions = '') {
    const existing = document.getElementById('modal-overlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h2 class="modal-title">${title}</h2>
          <button class="modal-close" onclick="UI.closeModal()">✕</button>
        </div>
        <div class="modal-content">${content}</div>
        ${actions ? `<div class="modal-actions mt-4">${actions}</div>` : ''}
      </div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) UI.closeModal(); });
    document.body.appendChild(overlay);
  },

  closeModal() {
    const modal = document.getElementById('modal-overlay');
    if (modal) modal.remove();
  },

  confirm(message, onConfirm) {
    this.modal('Confirmação', `<p>${message}</p>`, `
      <button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
      <button class="btn btn-danger" id="confirm-btn">Confirmar</button>
    `);
    document.getElementById('confirm-btn').onclick = () => {
      onConfirm();
      UI.closeModal();
    };
  }
};

const App = {
  currentRoute: '',
  timer: {
    interval: null,
    seconds: 0,
    activeTopicId: null,
    startTime: null
  },

  init() {
    this.renderShell();
    const settings = DB.Settings.get();
    
    // Aplicar tema inicial
    if (settings.theme === 'light') {
      document.body.classList.add('light-theme');
      const btn = document.querySelector('.sidebar-footer .btn');
      if (btn) btn.textContent = '☀️';
    }
    
    if (!settings.onboardingDone) {
      this.showOnboarding();
    } else {
      this.showMainLayout();
      const initialRoute = window.location.hash.replace('#', '') || 'kanban';
      this.navigate(initialRoute);
    }

    window.addEventListener('hashchange', () => this.handleRoute());
    
    // Mobile sidebar
    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
      document.getElementById('sidebar-overlay').style.display = 'block';
    });
    document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('sidebar-overlay').style.display = 'none';
    });
  },

  renderShell() {
    document.getElementById('app').innerHTML = `
      <div id="sidebar-overlay"></div>
      <button id="mobile-menu-btn">☰</button>
      <div id="toast-container"></div>
      <div id="onboarding" class="hidden"></div>
      <div id="main-layout" class="hidden">
        <aside id="sidebar">
          <div class="sidebar-header">
            <a class="sidebar-logo" href="#kanban">
              <div class="logo-icon">🗂️</div>
              <span class="logo-text">Kanban de Estudos</span>
            </a>
          </div>
          <nav class="sidebar-nav">
            <span class="nav-section-title">Principal</span>
            <a class="nav-item" id="nav-kanban" href="#kanban">
              <span class="nav-icon">🗂️</span><span>Meu Kanban</span>
            </a>
            <a class="nav-item" id="nav-disciplinas" href="#disciplinas">
              <span class="nav-icon">📚</span><span>Disciplinas</span>
            </a>
            <a class="nav-item" id="nav-agenda" href="#agenda">
              <span class="nav-icon">🗓️</span><span>Agenda</span>
            </a>
            <a class="nav-item" id="nav-desempenho" href="#desempenho">
              <span class="nav-icon">📈</span><span>Desempenho</span>
            </a>
            <span class="nav-section-title">Sistema</span>
            <a class="nav-item" id="nav-configuracoes" href="#configuracoes">
              <span class="nav-icon">⚙️</span><span>Configurações</span>
            </a>
          </nav>
          <div id="active-timer-container"></div>
          <div class="sidebar-footer" style="padding:12px; border-top:1px solid var(--border); display:flex; justify-content:center;">
            <button class="btn btn-ghost btn-sm" onclick="Actions.toggleTheme()" title="Alternar Modo Leitura" style="font-size:20px;">
              🌙
            </button>
          </div>
        </aside>
        <main id="main-content">
          <div id="view-container"></div>
        </main>
      </div>`;
  },

  showOnboarding() {
    document.getElementById('onboarding').classList.remove('hidden');
    document.getElementById('main-layout').classList.add('hidden');
    document.getElementById('onboarding').innerHTML = Views.onboarding();
  },

  showMainLayout() {
    document.getElementById('onboarding').classList.add('hidden');
    document.getElementById('main-layout').classList.remove('hidden');
  },

  navigate(route) {
    if (window.location.hash === '#' + route) {
      this.handleRoute();
    } else {
      window.location.hash = route;
    }
  },

  handleRoute() {
    const route = window.location.hash.replace('#', '') || 'kanban';
    this.currentRoute = route;

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`nav-${route}`)?.classList.add('active');

    const container = document.getElementById('view-container');
    if (!container) return;

    if (Views[route]) {
      container.innerHTML = Views[route]();
    } else {
      this.navigate('kanban');
    }
    
    // Fechar menu mobile ao navegar
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay').style.display = 'none';
  }
};

const Views = {
  onboarding() {
    return `
    <div class="flex items-center justify-center" style="min-height:100vh">
      <div class="onboarding-card">
        <div class="onboarding-logo">
          <div class="logo-icon-lg">🗂️</div>
          <div>
            <div style="font-size:22px;font-weight:800">Kanban de Estudos</div>
            <div style="font-size:13px;color:var(--text-muted)">Gestão Visual & Manual</div>
          </div>
        </div>
        <h2 class="onboarding-title">Bem-vindo! 👋</h2>
        <p class="onboarding-subtitle">Organize seus estudos de forma simples e visual. Sem distrações, sem algoritmos complexos. Só você e seu progresso.</p>
        <div class="form-group">
          <label class="form-label">Seu Nome</label>
          <input id="ob-name" class="form-input" placeholder="Ex: Maria Silva">
        </div>
        <button class="btn btn-primary btn-full btn-lg" onclick="Actions.completeOnboarding()">🚀 Começar agora</button>
      </div>
    </div>`;
  },

  kanban() {
    const topics = DB.Topics.getAll();
    const subjects = DB.Subjects.getAll();
    if (subjects.length === 0) {
      return `<div class="page"><div class="empty-state">
        <div class="empty-icon">📚</div>
        <div class="empty-title">Nenhuma disciplina cadastrada</div>
        <p class="empty-desc">Adicione suas matérias primeiro para começar a organizar o Kanban.</p>
        <button class="btn btn-primary" onclick="App.navigate('disciplinas')">➕ Adicionar Matéria</button>
      </div></div>`;
    }

    const subjMap = Object.fromEntries(subjects.map(s => [s.id, s]));
    const filter = sessionStorage.getItem('kanban_filter') || 'all';
    
    return `
    <div class="page">
      <div class="page-header flex justify-between items-center">
        <div>
          <h1 class="page-title">🗂️ Kanban de Estudos</h1>
          <p class="page-subtitle">Arraste os cards para atualizar seu progresso</p>
        </div>
        <select class="form-select" style="width:auto" onchange="Actions.filterKanban(this.value)">
          <option value="all" ${filter === 'all' ? 'selected' : ''}>Todas as Matérias</option>
          ${subjects.map(s => `<option value="${s.id}" ${filter === s.id ? 'selected' : ''}>${s.icon} ${s.name}</option>`).join('')}
        </select>
      </div>
      
      <div class="kanban-board">
        ${Object.entries(CONFIG.KANBAN_COLUMNS).map(([key, col]) => {
          const colTopics = topics.filter(t => t.status === key && (filter === 'all' || t.subjectId === filter));
          return `
          <div class="kanban-column" id="col-${key}" 
               ondragover="Actions.onDragOver(event, '${key}')" 
               ondragleave="Actions.onDragLeave('${key}')"
               ondrop="Actions.onDrop(event, '${key}')">
            <div class="kanban-col-header" style="border-top-color:${col.color}">
              <div class="kanban-col-top">
                <div class="kanban-col-title">${col.title}</div>
                <span class="kanban-count">${colTopics.length}</span>
              </div>
              <div class="kanban-col-subtitle">${col.subtitle}</div>
            </div>
            <div class="kanban-cards">
              ${colTopics.map(t => {
                const settings = DB.Settings.get();
                const threshold = settings.reviewThreshold || CONFIG.REVIEW_THRESHOLD_DAYS;
                const daysSinceUpdate = Math.floor((new Date() - new Date(t.updatedAt)) / (1000 * 60 * 60 * 24));
                const showRevisionAlert = daysSinceUpdate >= threshold && t.status !== 'backlog';

                return `
                <div class="kanban-card" draggable="true" ondragstart="Actions.onDragStart(event, '${t.id}')">
                  <div class="kanban-card-stripe" style="background:${subjMap[t.subjectId].color}"></div>
                  ${showRevisionAlert ? `<div class="review-alert" title="Vencido há ${daysSinceUpdate} dias">🚩 REVISAR</div>` : ''}
                  <div class="kanban-card-body">
                    <div class="kanban-card-subject truncate" title="${subjMap[t.subjectId].name}">${subjMap[t.subjectId].icon} ${subjMap[t.subjectId].name}</div>
                    <div class="kanban-card-title">${t.name}</div>
                    <div class="flex justify-between items-center mt-2">
                       <div class="flex gap-2">
                         <button class="btn btn-play" onclick="Actions.startTimer('${t.id}')" title="Iniciar Estudo">▶️</button>
                         ${showRevisionAlert ? `<button class="btn btn-success-ghost btn-sm" onclick="Actions.markReviewed('${t.id}')" title="Confirmar Revisão">✅</button>` : ''}
                       </div>
                       <div class="flex gap-2">
                         <button class="btn btn-secondary btn-sm" style="padding: 6px 10px;" onclick="Actions.moveTopicModal('${t.id}')" title="Mover Tópico">🔄</button>
                         <button class="btn btn-ghost btn-sm" onclick="Actions.delTopic('${t.id}')" title="Remover Tópico">🗑️</button>
                       </div>
                    </div>
                  </div>
                </div>`;
              }).join('')}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  },

  disciplinas() {
    const subjects = DB.Subjects.getAll();
    return `
    <div class="page">
      <div class="page-header flex justify-between items-center">
        <div>
          <h1 class="page-title">📚 Disciplinas</h1>
          <p class="page-subtitle">Gerencie suas matérias e conteúdos</p>
        </div>
        <button class="btn btn-primary" onclick="Actions.addSubject()">➕ Nova Matéria</button>
      </div>
      
      <div class="subjects-grid">
        ${subjects.map(s => `
          <div class="card subject-item-card">
            <div class="flex justify-between items-start mb-4">
              <div class="text-3xl">${s.icon}</div>
              <button class="btn btn-ghost" onclick="Actions.delSubject('${s.id}')">🗑️</button>
            </div>
            <h3 class="font-bold text-lg mb-1">${s.name}</h3>
            <div class="text-sm text-muted mb-4">${DB.Topics.getBySubject(s.id).length} tópicos</div>
            <button class="btn btn-secondary btn-full btn-sm" onclick="Actions.addTopic('${s.id}')">➕ Adicionar Tópico</button>
            
            <div class="mt-4 border-t pt-3">
               <div class="text-xs font-bold text-muted uppercase mb-2">Tópicos</div>
               <div class="topic-simple-list">
                  ${DB.Topics.getBySubject(s.id).slice(0, 5).map(t => `<div class="text-sm py-1 border-b last:border-0">${t.name}</div>`).join('')}
                  ${DB.Topics.getBySubject(s.id).length > 5 ? `<div class="text-xs text-muted mt-1">...e mais ${DB.Topics.getBySubject(s.id).length - 5}</div>` : ''}
               </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
  },

  agenda() {
    const subjects = DB.Subjects.getAll();
    if (subjects.length === 0) {
      return `<div class="page"><div class="empty-state">
        <div class="empty-icon">🗓️</div>
        <div class="empty-title">Nenhuma disciplina cadastrada</div>
        <p class="empty-desc">Adicione suas matérias primeiro para poder agendar seus estudos.</p>
        <button class="btn btn-primary" onclick="App.navigate('disciplinas')">➕ Adicionar Matéria</button>
      </div></div>`;
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Calcular datas da semana atual (Segunda a Domingo)
    const weekDates = [];
    const dayOfWeek = today.getDay(); // 0=Dom, 1=Seg...
    const mondayDiff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayDiff);

    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        weekDates.push(d);
    }

    const schedules = DB.Schedules.getAll();
    const topics = DB.Topics.getAll();
    const subjMap = Object.fromEntries(subjects.map(s => [s.id, s]));
    const topicMap = Object.fromEntries(topics.map(t => [t.id, t]));

    const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

    return `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">🗓️ Agenda Semanal</h1>
        <p class="page-subtitle">Planeje seus estudos para a semana atual</p>
      </div>
      
      <div class="agenda-grid">
        ${weekDates.map((date, idx) => {
          const dateStr = date.toISOString().split('T')[0];
          const isToday = date.getTime() === today.getTime();
          const isPast = date.getTime() < today.getTime();
          const dayScheds = schedules.filter(s => s.date === dateStr);

          return `
          <div class="agenda-day ${isToday ? 'today' : ''}" style="${isPast ? 'opacity: 0.5; pointer-events: none;' : ''}">
            <div class="agenda-day-header">
              <div class="agenda-day-name">${dayNames[idx]} ${isToday ? '(Hoje)' : ''}</div>
              <div class="agenda-day-date">${date.toLocaleDateString('pt-BR')}</div>
            </div>
            <div class="agenda-items">
              ${dayScheds.map(s => {
                const t = topicMap[s.topicId];
                if (!t) return '';
                const subj = subjMap[t.subjectId];
                return `
                <div class="agenda-item">
                  <div class="agenda-item-stripe" style="background:${subj.color}"></div>
                  <div class="agenda-item-text">${t.name}</div>
                  <button class="btn btn-ghost btn-sm" onclick="Actions.delSchedule('${s.id}')" style="padding:2px">✕</button>
                </div>`;
              }).join('')}
              ${dayScheds.length === 0 ? '<div class="text-xs text-muted text-center mt-4">Nenhum estudo planejado</div>' : ''}
            </div>
            <div class="agenda-day-footer">
              <button class="btn btn-secondary btn-sm btn-full" onclick="Actions.addSchedule('${dateStr}')">➕ Agendar</button>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  },

  desempenho() {
    const subjects = DB.Subjects.getAll();
    const topics = DB.Topics.getAll();
    const sessions = DB.Sessions.getAll();

    if (topics.length === 0) return `<div class="page"><div class="empty-state">📊 Sem dados suficientes.</div></div>`;

    const mastered = topics.filter(t => t.status === 'mastered').length;
    const studying = topics.filter(t => t.status === 'studying' || t.status === 'review').length;
    const backlog = topics.filter(t => t.status === 'backlog').length;
    
    const todaySecs = DB.Sessions.getToday().reduce((sum, s) => sum + s.duration, 0);
    const todayHours = (todaySecs / 3600).toFixed(1);
    const streak = DB.Sessions.getStreak();

    // Preparar dados para Gráfico 2: Horas nos últimos 7 dias
    const last7Days = [];
    const last7Hours = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toDateString();
        last7Days.push(d.toLocaleDateString('pt-BR', { weekday: 'short' }));
        const dayDuration = sessions
            .filter(s => new Date(s.completedAt).toDateString() === dStr)
            .reduce((sum, s) => sum + s.duration, 0);
        last7Hours.push((dayDuration / 3600).toFixed(1));
    }

    // Preparar dados para Gráfico 3: Matérias mais estudadas (Horas)
    const subjHours = subjects.map(s => {
        const dur = sessions.filter(sess => sess.subjectId === s.id).reduce((sum, sx) => sum + sx.duration, 0);
        return { name: s.name, hours: (dur / 3600).toFixed(1) };
    }).sort((a,b) => b.hours - a.hours).slice(0, 5);

    // Chamar inicialização dos gráficos após renderizar
    setTimeout(() => Actions.initCharts({
        status: [mastered, studying, backlog],
        history: { labels: last7Days, data: last7Hours },
        subjects: { labels: subjHours.map(s => s.name), data: subjHours.map(s => s.hours) }
    }), 100);

    return `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">📈 Desempenho</h1>
        <p class="page-subtitle">Sua evolução automática em gráficos</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${todayHours}h</div>
          <div class="stat-label">Estudo Hoje</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${mastered}</div>
          <div class="stat-label">Tópicos Dominados</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${streak}</div>
          <div class="stat-label">Dias Seguivos</div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-container">
          <div class="chart-title">📊 Progresso do Edital</div>
          <div class="chart-canvas-wrapper"><canvas id="chart-status"></canvas></div>
        </div>
        <div class="chart-container">
          <div class="chart-title">🕒 Horas (Últimos 7 dias)</div>
          <div class="chart-canvas-wrapper"><canvas id="chart-history"></canvas></div>
        </div>
        <div class="chart-container">
          <div class="chart-title">📚 Foco por Disciplina (Horas)</div>
          <div class="chart-canvas-wrapper"><canvas id="chart-subjects"></canvas></div>
        </div>
      </div>
    </div>`;
  },

  configuracoes() {
    const s = DB.Settings.get();
    return `
    <div class="page">
      <h1 class="page-title">⚙️ Configurações</h1>
      <div class="card max-w-md">
        <div class="section-title">Perfil</div>
        <div class="form-group">
          <label class="form-label">Seu Nome</label>
          <input id="cfg-name" class="form-input" value="${s.userName}">
        </div>
        <div class="form-group">
          <label class="form-label">Ciclo de Revisão (dias)</label>
          <input id="cfg-threshold" type="number" class="form-input" value="${s.reviewThreshold || 7}" min="1">
          <p class="text-xs text-muted mt-1">Alerta visual após X dias sem estudo.</p>
        </div>
        <button class="btn btn-primary" onclick="Actions.saveSettings()">Salvar Alterações</button>
      </div>
      
      <div class="card max-w-md mt-6" style="border-color:var(--error-light)">
        <div class="section-title text-error">Zona de Perigo</div>
        <p class="text-sm text-muted mb-4">Isso apagará todos os seus dados permanentemente do seu navegador.</p>
        <button class="btn btn-danger" onclick="Actions.resetApp()">⚠️ Resetar Aplicativo</button>
      </div>
    </div>`;
  }
};

const Actions = {
  completeOnboarding() {
    const name = document.getElementById('ob-name').value.trim();
    if (!name) return UI.toast('Informe seu nome!', 'error');
    DB.Settings.update({ userName: name, onboardingDone: true });
    App.showMainLayout();
    App.renderShell();
    App.navigate('kanban');
    UI.toast(`Olá, ${name}! Bons estudos.`, 'success');
  },

  filterKanban(val) {
    sessionStorage.setItem('kanban_filter', val);
    App.handleRoute();
  },

  onDragStart(e, id) {
    e.dataTransfer.setData('topicId', id);
    e.target.classList.add('dragging');
  },

  onDragOver(e, col) {
    e.preventDefault();
    document.getElementById(`col-${col}`).classList.add('drag-over');
  },

  onDragLeave(col) {
    document.getElementById(`col-${col}`).classList.remove('drag-over');
  },

  onDrop(e, targetCol) {
    e.preventDefault();
    const id = e.dataTransfer.getData('topicId');
    document.getElementById(`col-${targetCol}`).classList.remove('drag-over');
    if (id) {
      DB.Topics.update(id, { status: targetCol });
      App.handleRoute();
    }
  },

  moveTopicModal(topicId) {
    const topic = DB.Topics.getById(topicId);
    if (!topic) return;
    
    let options = '';
    for (const [key, col] of Object.entries(CONFIG.KANBAN_COLUMNS)) {
      if (key !== topic.status) {
        options += `<button class="btn btn-secondary btn-full mb-2" onclick="Actions.moveTopic('${topic.id}', '${key}')" style="justify-content:flex-start; text-align:left;">${col.title}</button>`;
      }
    }
    
    UI.modal(`Mover: ${topic.name}`, `
      <div class="text-sm text-muted mb-4">Escolha a nova coluna:</div>
      ${options}
    `);
  },

  moveTopic(topicId, newStatus) {
    DB.Topics.update(topicId, { status: newStatus });
    App.handleRoute();
    UI.closeModal();
    UI.toast('Tópico movido com sucesso!', 'success');
  },

  addSubject() {
    UI.modal('Nova Matéria', `
      <div class="form-group">
        <label class="form-label">Nome da Disciplina</label>
        <input id="modal-sub-name" class="form-input" placeholder="Ex: Direito Civil" autofocus>
      </div>
    `, `
      <button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
      <button class="btn btn-primary" id="modal-sub-confirm">Criar Matéria</button>
    `);
    
    document.getElementById('modal-sub-confirm').onclick = () => {
      const name = document.getElementById('modal-sub-name').value.trim();
      if (name) {
        DB.Subjects.create({ name });
        App.handleRoute();
        UI.closeModal();
        UI.toast('Matéria adicionada!');
      }
    };
  },

  delSubject(id) {
    UI.confirm('Tem certeza? Isso apagará todos os tópicos desta matéria.', () => {
      DB.Subjects.delete(id);
      App.handleRoute();
      UI.toast('Matéria removida.', 'warning');
    });
  },

  addTopic(subjectId) {
    UI.modal('Novo Tópico', `
      <div class="form-group">
        <label class="form-label">Nome do Conteúdo</label>
        <input id="modal-topic-name" class="form-input" placeholder="Ex: Atos Administrativos" autofocus>
      </div>
    `, `
      <button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
      <button class="btn btn-primary" id="modal-topic-confirm">Adicionar Tópico</button>
    `);

    document.getElementById('modal-topic-confirm').onclick = () => {
      const name = document.getElementById('modal-topic-name').value.trim();
      if (name) {
        DB.Topics.create({ subjectId, name, status: 'backlog' });
        App.handleRoute();
        UI.closeModal();
        UI.toast('Tópico adicionado!');
      }
    };
  },

  delTopic(id) {
    UI.confirm('Remover este tópico?', () => {
      DB.Topics.delete(id);
      App.handleRoute();
      UI.toast('Tópico removido.');
    });
  },

  saveSettings() {
    const name = document.getElementById('cfg-name').value;
    const threshold = parseInt(document.getElementById('cfg-threshold').value) || 7;
    DB.Settings.update({ userName: name, reviewThreshold: threshold });
    App.renderShell();
    App.handleRoute();
    UI.toast('Configurações salvas!');
  },

  markReviewed(id) {
    DB.Topics.markReviewed(id);
    App.handleRoute();
    UI.toast('Revisão confirmada!', 'success');
  },

  resetApp() {
    UI.confirm('VOCÊ TEM CERTEZA? Todos os seus dados serão apagados.', () => {
      localStorage.clear();
      window.location.reload();
    });
  },

  addSchedule(date) {
    const subjects = DB.Subjects.getAll();
    const topics = DB.Topics.getAll();
    
    let content = '<div class="selection-list">';
    subjects.forEach(s => {
      const sTopics = topics.filter(t => t.subjectId === s.id);
      if (sTopics.length > 0) {
        content += `
          <div class="selection-subject-group">
            <div class="selection-subject-title">${s.icon} ${s.name}</div>
            ${sTopics.map(t => `
              <div class="selection-topic-item" onclick="Actions.confirmSchedule('${date}', '${t.id}')">
                ${t.name}
              </div>
            `).join('')}
          </div>`;
      }
    });
    content += '</div>';

    UI.modal(`Agendar para ${new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')}`, content, `
      <button class="btn btn-ghost" onclick="UI.closeModal()">Fechar</button>
    `);
  },

  confirmSchedule(date, topicId) {
    DB.Schedules.create({ date, topicId });
    App.handleRoute();
    UI.closeModal();
    UI.toast('Estudo agendado com sucesso!', 'success');
  },

  delSchedule(id) {
    DB.Schedules.delete(id);
    App.handleRoute();
    UI.toast('Agendamento removido.');
  },

  startTimer(topicId) {
    if (App.timer.interval) clearInterval(App.timer.interval);
    
    App.timer.activeTopicId = topicId;
    App.timer.seconds = 0;
    App.timer.startTime = Date.now();
    
    App.timer.interval = setInterval(() => {
        App.timer.seconds++;
        Actions.renderTimer();
    }, 1000);
    
    Actions.renderTimer();
    UI.toast('Estudo iniciado! O cronômetro está rodando.', 'success');
  },

  stopTimer() {
    if (!App.timer.activeTopicId) return;

    const topic = DB.Topics.getById(App.timer.activeTopicId);
    if (topic) {
        DB.Sessions.create({
            topicId: topic.id,
            subjectId: topic.subjectId,
            duration: App.timer.seconds,
            type: 'study'
        });
        // Atualizar data do tópico para renovar ciclo de revisão
        DB.Topics.update(topic.id, {}); 
        
        UI.toast(`Sessão finalizada: ${Actions.formatTime(App.timer.seconds)} registrados.`);
    }

    clearInterval(App.timer.interval);
    App.timer.interval = null;
    App.timer.activeTopicId = null;
    App.timer.seconds = 0;
    
    document.getElementById('active-timer-container').innerHTML = '';
    
    if (App.currentRoute === 'desempenho') App.handleRoute();
  },

  renderTimer() {
    const container = document.getElementById('active-timer-container');
    if (!container) return;
    
    const topic = DB.Topics.getById(App.timer.activeTopicId);
    const timeStr = Actions.formatTime(App.timer.seconds);
    
    container.innerHTML = `
      <div class="timer-sidebar">
        <div class="timer-display">${timeStr}</div>
        <div class="timer-topic">Estudando: ${topic ? topic.name : '...'}</div>
        <button class="btn btn-danger btn-sm mt-2 btn-full" onclick="Actions.stopTimer()">⏹️ Parar</button>
      </div>`;
  },

  formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  },

  initCharts(data) {
    const ctxStatus = document.getElementById('chart-status')?.getContext('2d');
    if (ctxStatus) {
        new Chart(ctxStatus, {
            type: 'doughnut',
            data: {
                labels: ['Dominado', 'Estudando/Revisão', 'Backlog'],
                datasets: [{
                    data: data.status,
                    backgroundColor: ['#10b981', '#6366f1', '#4f5a72'],
                    borderWidth: 0
                }]
            },
            options: { maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } } }
        });
    }

    const ctxHistory = document.getElementById('chart-history')?.getContext('2d');
    if (ctxHistory) {
        new Chart(ctxHistory, {
            type: 'bar',
            data: {
                labels: data.history.labels,
                datasets: [{
                    label: 'Horas',
                    data: data.history.data,
                    backgroundColor: '#6366f1',
                    borderRadius: 6
                }]
            },
            options: { 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                }
            }
        });
    }

    const ctxSubj = document.getElementById('chart-subjects')?.getContext('2d');
    if (ctxSubj) {
        new Chart(ctxSubj, {
            type: 'bar',
            data: {
                labels: data.subjects.labels,
                datasets: [{
                    label: 'Horas',
                    data: data.subjects.data,
                    backgroundColor: '#8b5cf6',
                    borderRadius: 6
                }]
            },
            options: { 
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: { legend: { display: false } },
                scales: { 
                    x: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                    y: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                }
            }
        });
    }
  },

  toggleTheme() {
    const s = DB.Settings.get();
    const newTheme = s.theme === 'dark' ? 'light' : 'dark';
    
    DB.Settings.update({ theme: newTheme });
    
    if (newTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    
    // Atualizar ícone (opcional, pode ser feito re-renderizando a shell ou apenas o emoji)
    const btn = document.querySelector('.sidebar-footer .btn');
    if (btn) btn.textContent = newTheme === 'dark' ? '🌙' : '☀️';
    
    UI.toast(`Modo ${newTheme === 'dark' ? 'Escuro' : 'Claro (Leitura)'} ativado!`);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
