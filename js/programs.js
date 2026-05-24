/**
 * Programs — Structured multi-day practice courses
 */
(function() {
  'use strict';

  var PROGRAMS_KEY = 'navigator_programs';

  // ═══ PROGRAM DEFINITIONS ═══

  var programs = [
    {
      id: 'breath-7',
      title: '7 дней дыхания',
      subtitle: 'Базовый курс',
      icon: '🫁',
      theme: 'breath',
      description: 'Освойте дыхательные техники от простого к сложному. Каждый день — новая вариация.',
      days: [
        { title: 'Знакомство с дыханием', desc: 'Бокс-дыхание 4-4-4-4, 4 цикла', practice: 'box-breathing', cycles: 4 },
        { title: 'Углубление', desc: 'Бокс-дыхание 4-4-4-4, 6 циклов', practice: 'box-breathing', cycles: 6 },
        { title: 'Расширение', desc: 'Бокс-дыхание 4-4-4-4, 8 циклов', practice: 'box-breathing', cycles: 8 },
        { title: 'Замедление', desc: 'Бокс-дыхание 5-5-5-5 (медленнее)', practice: 'box-breathing', cycles: 6 },
        { title: 'Интенсивность', desc: 'Введение в холотропное дыхание', practice: 'holotropic' },
        { title: 'Интеграция', desc: 'Бокс-дыхание + медитация', practice: 'box-breathing', cycles: 8 },
        { title: 'Мастерство', desc: 'Свободная практика дыхания по выбору', practice: 'box-breathing', cycles: 8 }
      ]
    },
    {
      id: 'calm-5',
      title: 'Антистресс за 5 дней',
      subtitle: 'При тревоге',
      icon: '🌊',
      theme: 'calm',
      description: 'Комплекс техник для снижения тревожности. От тела к уму.',
      days: [
        { title: 'Заземление', desc: 'Техника 5-4-3-2-1 для возвращения в тело', practice: 'grounding' },
        { title: 'Дыхание', desc: 'Бокс-дыхание для активации парасимпатики', practice: 'box-breathing', cycles: 6 },
        { title: 'Внимание', desc: 'Фокус на точке — тренировка ума', practice: 'focus' },
        { title: 'Наблюдение', desc: 'Медитация открытого внимания', practice: 'meditation' },
        { title: 'Синтез', desc: 'Заземление + дыхание + медитация', practice: 'grounding' }
      ]
    },
    {
      id: 'focus-7',
      title: '7 дней фокуса',
      subtitle: 'Концентрация',
      icon: '🎯',
      theme: 'focus',
      description: 'Укрепите способность к концентрации. От 1 минуты до 5 минут устойчивого внимания.',
      days: [
        { title: '1 минута', desc: 'Удержание внимания на точке, 60 секунд', practice: 'focus' },
        { title: '2 минуты', desc: 'Увеличиваем длительность фокуса', practice: 'focus' },
        { title: 'Дыхание + фокус', desc: 'Бокс-дыхание, затем точка', practice: 'box-breathing', cycles: 4 },
        { title: '3 минуты', desc: 'Стандартная сессия фокуса', practice: 'focus' },
        { title: 'Медитация', desc: 'Фокус на дыхании в медитации', practice: 'meditation' },
        { title: '4 минуты', desc: 'Продвинутая сессия фокуса', practice: 'focus' },
        { title: '5 минут', desc: 'Мастерская сессия внимания', practice: 'focus' }
      ]
    },
    {
      id: 'awareness-21',
      title: '21 день осознанности',
      subtitle: 'Глубокий курс',
      icon: '🔮',
      theme: 'awareness',
      description: 'Полная программа: от базовых техник до интеграции в повседневную жизнь.',
      days: [
        { title: 'Намерение', desc: 'Чекин + постановка намерения', practice: 'checkin' },
        { title: 'Тело', desc: 'Заземление через 5 чувств', practice: 'grounding' },
        { title: 'Дыхание', desc: 'Бокс-дыхание, 6 циклов', practice: 'box-breathing', cycles: 6 },
        { title: 'Внимание', desc: 'Фокус на точке, 3 минуты', practice: 'focus' },
        { title: 'Тишина', desc: 'Первая медитация', practice: 'meditation' },
        { title: 'Рефлексия', desc: 'Чекин + запись наблюдений', practice: 'checkin' },
        { title: 'Отдых', desc: 'Свободный день. Выберите практику по желанию', practice: 'box-breathing', cycles: 4 },
        { title: 'Углубление дыхания', desc: 'Бокс-дыхание, 8 циклов', practice: 'box-breathing', cycles: 8 },
        { title: 'Расширение фокуса', desc: 'Удержание точки + мягкое дыхание', practice: 'focus' },
        { title: 'Медитация присутствия', desc: 'Открытое внимание, 7 минут', practice: 'meditation' },
        { title: 'Заземление в движении', desc: '5-4-3-2-1 в новом месте', practice: 'grounding' },
        { title: 'Холотропное введение', desc: 'Первый опыт интенсивного дыхания', practice: 'holotropic' },
        { title: 'Интеграция', desc: 'Чекин после холотропного опыта', practice: 'checkin' },
        { title: 'Отдых', desc: 'Свободная практика по состоянию', practice: 'meditation' },
        { title: 'Длинная медитация', desc: 'Полная медитация без спешки', practice: 'meditation' },
        { title: 'Комбо: тело', desc: 'Заземление → дыхание', practice: 'grounding' },
        { title: 'Комбо: ум', desc: 'Фокус → медитация', practice: 'focus' },
        { title: 'Комбо: дух', desc: 'Дыхание → медитация → чекин', practice: 'box-breathing', cycles: 8 },
        { title: 'Свободная практика', desc: 'Выберите то, что просит тело', practice: 'meditation' },
        { title: 'Холотропное углубление', desc: 'Полная сессия холотропного дыхания', practice: 'holotropic' },
        { title: 'Завершение', desc: 'Финальный чекин + благодарность себе', practice: 'checkin' }
      ]
    }
  ];

  // ═══ DATA LAYER ═══

  function loadProgress() {
    try {
      var raw = localStorage.getItem(PROGRAMS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  }

  function saveProgress(progress) {
    localStorage.setItem(PROGRAMS_KEY, JSON.stringify(progress));
  }

  function getProgramProgress(programId) {
    var progress = loadProgress();
    return progress[programId] || { completedDays: [], startedAt: null, active: false };
  }

  function markDayComplete(programId, dayIndex) {
    var progress = loadProgress();
    if (!progress[programId]) {
      progress[programId] = { completedDays: [], startedAt: new Date().toISOString(), active: true };
    }
    if (progress[programId].completedDays.indexOf(dayIndex) === -1) {
      progress[programId].completedDays.push(dayIndex);
    }
    saveProgress(progress);
  }

  function startProgram(programId) {
    var progress = loadProgress();
    progress[programId] = { completedDays: [], startedAt: new Date().toISOString(), active: true };
    saveProgress(progress);
  }

  // ═══ RENDERING ═══

  var currentView = 'list'; // 'list' or 'detail'
  var currentProgramId = null;

  function renderList() {
    var container = document.getElementById('programs-content');
    if (!container) return;

    var html = '';

    html += '<div class="app-header">';
    html += '<h1>Программы</h1>';
    html += '<p>Структурированные курсы практик</p>';
    html += '</div>';

    html += '<div class="programs-list">';

    programs.forEach(function(program) {
      var prog = getProgramProgress(program.id);
      var completed = prog.completedDays ? prog.completedDays.length : 0;
      var total = program.days.length;
      var pct = total > 0 ? Math.round((completed / total) * 100) : 0;

      var badgeClass = '';
      var badgeText = '';
      if (prog.active && completed > 0 && completed < total) {
        badgeClass = 'active';
        badgeText = 'В процессе';
      } else if (completed >= total) {
        badgeClass = 'active';
        badgeText = 'Завершено ✓';
      } else {
        badgeClass = 'new';
        badgeText = total + ' дней';
      }

      html += '<div class="program-card" data-theme="' + program.theme + '" data-id="' + program.id + '">';
      html += '<div class="program-header">';
      html += '<div class="program-icon">' + program.icon + '</div>';
      html += '<div class="program-meta">';
      html += '<div class="program-title">' + program.title + '</div>';
      html += '<div class="program-subtitle">' + program.subtitle + '</div>';
      html += '</div>';
      html += '<div class="program-badge ' + badgeClass + '">' + badgeText + '</div>';
      html += '</div>';
      html += '<div class="program-desc">' + program.description + '</div>';

      if (prog.active && completed > 0) {
        html += '<div class="program-progress"><div class="program-progress-fill" style="width:' + pct + '%"></div></div>';
        html += '<div class="program-progress-text">' + completed + ' из ' + total + ' дней</div>';
      }

      html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;

    // Bind cards
    container.querySelectorAll('.program-card').forEach(function(card) {
      card.addEventListener('click', function() {
        currentProgramId = card.getAttribute('data-id');
        currentView = 'detail';
        renderDetail();
      });
    });
  }

  function renderDetail() {
    var container = document.getElementById('programs-content');
    if (!container) return;

    var program = programs.find(function(p) { return p.id === currentProgramId; });
    if (!program) { renderList(); return; }

    var prog = getProgramProgress(program.id);
    var completedDays = prog.completedDays || [];

    // Find current day (first incomplete)
    var currentDay = 0;
    for (var i = 0; i < program.days.length; i++) {
      if (completedDays.indexOf(i) === -1) { currentDay = i; break; }
      if (i === program.days.length - 1) currentDay = i;
    }

    var html = '';

    // Back button
    html += '<div style="margin-bottom:1.5rem;">';
    html += '<button class="practice-btn practice-btn-secondary" id="back-to-list" style="padding:10px 20px;font-size:13px;">← Назад</button>';
    html += '</div>';

    // Header
    html += '<div class="program-detail">';
    html += '<div class="program-detail-header">';
    html += '<div class="program-detail-icon">' + program.icon + '</div>';
    html += '<div class="program-detail-title">' + program.title + '</div>';
    html += '<div class="program-detail-sub">' + program.description + '</div>';
    html += '</div>';

    // Progress
    var pct = program.days.length > 0 ? Math.round((completedDays.length / program.days.length) * 100) : 0;
    html += '<div class="program-progress" style="margin-bottom:8px;"><div class="program-progress-fill" style="width:' + pct + '%"></div></div>';
    html += '<div class="program-progress-text" style="text-align:center;margin-bottom:2rem;">' + completedDays.length + ' из ' + program.days.length + ' дней выполнено</div>';

    // Start button (if not started)
    if (!prog.active || completedDays.length === 0) {
      html += '<div style="text-align:center;margin-bottom:2rem;">';
      html += '<button class="practice-btn practice-btn-primary" id="start-program">Начать программу</button>';
      html += '</div>';
    }

    // Days list
    html += '<div class="program-days">';
    program.days.forEach(function(day, idx) {
      var isCompleted = completedDays.indexOf(idx) !== -1;
      var isCurrent = idx === currentDay && prog.active;
      var isLocked = idx > currentDay && !isCompleted && prog.active;
      // Unlock all days if not active yet (so user can browse)
      if (!prog.active) isLocked = false;

      var dayClass = 'program-day';
      if (isCompleted) dayClass += ' completed';
      else if (isCurrent) dayClass += ' current';
      else if (isLocked) dayClass += ' locked';

      html += '<div class="' + dayClass + '" data-day="' + idx + '" data-practice="' + day.practice + '">';
      html += '<div class="program-day-num">' + (idx + 1) + '</div>';
      html += '<div class="program-day-info">';
      html += '<div class="program-day-title">' + day.title + '</div>';
      html += '<div class="program-day-desc">' + day.desc + '</div>';
      html += '</div>';
      html += '<div class="program-day-check">' + (isCompleted ? '✅' : '') + '</div>';
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';

    container.innerHTML = html;

    // Back button
    document.getElementById('back-to-list').addEventListener('click', function() {
      currentView = 'list';
      renderList();
    });

    // Start program
    var startBtn = document.getElementById('start-program');
    if (startBtn) {
      startBtn.addEventListener('click', function() {
        startProgram(program.id);
        renderDetail();
      });
    }

    // Day click — go to practice
    container.querySelectorAll('.program-day:not(.locked)').forEach(function(dayEl) {
      dayEl.addEventListener('click', function() {
        var dayIdx = parseInt(dayEl.getAttribute('data-day'));
        var practice = dayEl.getAttribute('data-practice');

        // Mark as completed
        markDayComplete(program.id, dayIdx);

        // Navigate to practice
        window.location.href = 'navigator.html#' + practice;
      });
    });
  }

  function render() {
    if (currentView === 'detail' && currentProgramId) {
      renderDetail();
    } else {
      renderList();
    }
  }

  // Page styles
  var style = document.createElement('style');
  style.textContent = '.programs-page { max-width: 600px; margin: 0 auto; padding: 1rem 1.5rem 2rem; }';
  document.head.appendChild(style);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
