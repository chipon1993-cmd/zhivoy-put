(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // DATA LAYER
  // ═══════════════════════════════════════════════════════════════

  var STORAGE_KEY = 'navigator_data';

  function getDefaultData() {
    return {
      entries: [],
      streak: 0,
      lastDate: null,
      practiceLog: []
    };
  }

  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (!parsed.practiceLog) parsed.practiceLog = [];
        if (!parsed.entries) parsed.entries = [];
        if (typeof parsed.streak !== 'number') parsed.streak = 0;
        return parsed;
      }
    } catch (e) { /* ignore */ }
    return getDefaultData();
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    syncToSupabase(data);
    updateStreakDisplay(data.streak);
  }

  function syncToSupabase(data) {
    if (window.SupabaseClient && typeof window.SupabaseClient.set === 'function') {
      try { window.SupabaseClient.set(STORAGE_KEY, data); } catch (e) { /* silent */ }
    }
  }

  function updateStreakDisplay(streak) {
    var el = document.getElementById('streak-count');
    if (el) el.textContent = streak;
  }

  function getTodayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function updateStreak(data) {
    var today = getTodayStr();
    if (data.lastDate === today) return data;

    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    var yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (data.lastDate === yesterdayStr) {
      data.streak += 1;
    } else {
      data.streak = 1;
    }
    data.lastDate = today;
    return data;
  }

  function logPractice(practiceId, durationSec) {
    var data = loadData();
    data = updateStreak(data);
    data.practiceLog.push({
      date: new Date().toISOString(),
      practice: practiceId,
      duration: durationSec
    });
    saveData(data);
  }

  // ═══════════════════════════════════════════════════════════════
  // PRACTICES LIBRARY
  // ═══════════════════════════════════════════════════════════════

  var practices = {
    'box-breathing': {
      title: 'Бокс-дыхание',
      icon: '🫁',
      why: 'Пауза между стимулом и ответом',
      description: 'Между стимулом и реакцией есть пространство. Дыхание по квадрату 4-4-4-4 — путь в это пространство. Самый надёжный инструмент для возвращения выбора.',
      instructions: [
        'Сядьте удобно, спина прямая',
        'Следуйте за кругом на экране',
        'Вдыхайте через нос на расширении',
        'Выдыхайте через рот на сжатии',
        '8 полных циклов'
      ],
      type: 'breathing',
      phases: [
        { name: 'Вдох', duration: 4 },
        { name: 'Задержка', duration: 4 },
        { name: 'Выдох', duration: 4 },
        { name: 'Задержка', duration: 4 }
      ],
      cycles: 8
    },
    'holotropic': {
      title: 'Холотропное дыхание',
      icon: '🌀',
      why: 'Тело несёт память глубже слов',
      description: 'Тело хранит память, о которой ум ничего не знает. Интенсивная дыхательная практика с поэтапным ускорением — доступ к глубинным слоям опыта.',
      instructions: [
        'Лягте или сядьте максимально удобно',
        'Дышите глубоко — полный вдох и полный выдох',
        'Следуйте за темпом на экране',
        'При головокружении — замедлитесь',
        '5 фаз с разной интенсивностью'
      ],
      warning: '⚠️ Противопоказания: беременность, эпилепсия, сердечно-сосудистые заболевания, глаукома. При сильном головокружении — прекратите практику.',
      type: 'holotropic',
      phases: [
        { name: 'Разогрев', duration: 120, speed: 1.0 },
        { name: 'Ускорение', duration: 180, speed: 1.5 },
        { name: 'Пик', duration: 180, speed: 2.5 },
        { name: 'Замедление', duration: 120, speed: 1.2 },
        { name: 'Интеграция', duration: 120, speed: 1.0 }
      ]
    },
    'focus': {
      title: 'Фокус на точке',
      icon: '🔴',
      why: 'Сделай следующее действие медленнее',
      description: 'Замедление — третий инструмент паузы. Удерживай взгляд на одной точке, тренируя способность не реагировать мгновенно. Внимание без спешки.',
      instructions: [
        'Расположите экран на расстоянии вытянутой руки',
        'Расслабьте лицо и плечи',
        'Смотрите мягко на точку, не напрягая глаза',
        'Если мысли уходят — мягко верните внимание',
        'Старайтесь не моргать слишком часто'
      ],
      type: 'focus',
      duration: 180
    },
    'meditation': {
      title: 'Медитация',
      icon: '🧘',
      why: 'Удержание сложности без упрощения',
      description: 'Зрелость — это способность держать два противоречия одновременно, не упрощая ни одного. Медитация из 4 фаз: погружение, фокус, открытое внимание, завершение.',
      instructions: [
        'Сядьте удобно, закройте глаза',
        'Следуйте подсказкам на экране',
        'Не боритесь с мыслями — просто замечайте',
        'Каждая фаза плавно переходит в следующую',
        '4 фазы, ~7 минут'
      ],
      type: 'meditation',
      phases: [
        { name: 'Погружение', duration: 60, hint: 'Почувствуйте тело. Расслабьте лоб, челюсть, плечи.' },
        { name: 'Фокус на дыхании', duration: 180, hint: 'Наблюдайте за вдохом и выдохом. Не меняйте ритм.' },
        { name: 'Открытое внимание', duration: 120, hint: 'Замечайте всё: звуки, ощущения, пространство.' },
        { name: 'Завершение', duration: 60, hint: 'Медленно возвращайтесь. Пошевелите пальцами.' }
      ]
    },
    'checkin': {
      title: 'Ежедневный чекин',
      icon: '📝',
      why: 'Назови то, что чувствуешь',
      description: 'Называние — второй инструмент паузы. Переведи ощущение в слово, и оно перестанет управлять тобой.',
      type: 'checkin'
    },
    'grounding': {
      title: 'Заземление 5-4-3-2-1',
      icon: '🌍',
      why: 'Тело знает раньше слова',
      description: 'Тело — первый дом, первый регистратор среды. Возвращение в «здесь и сейчас» через 5 органов чувств. Тело знает раньше, чем ум успевает назвать.',
      instructions: [
        'Оглянитесь вокруг',
        'На каждом шаге называйте предметы/ощущения',
        'Можете записать или просто проговорить',
        'Не торопитесь — качество важнее скорости',
        '5 шагов от зрения к вкусу'
      ],
      type: 'grounding',
      steps: [
        { count: 5, sense: 'Зрение', prompt: 'Назовите 5 вещей, которые вы видите', icon: '👁️' },
        { count: 4, sense: 'Осязание', prompt: 'Назовите 4 вещи, которые можете потрогать', icon: '✋' },
        { count: 3, sense: 'Слух', prompt: 'Назовите 3 звука, которые слышите', icon: '👂' },
        { count: 2, sense: 'Обоняние', prompt: 'Назовите 2 запаха вокруг вас', icon: '👃' },
        { count: 1, sense: 'Вкус', prompt: 'Назовите 1 вкус, который ощущаете', icon: '👅' }
      ]
    }
  };

  var moods = [
    { id: 'heavy', label: 'Тяжесть', emoji: '🪨' },
    { id: 'anxious', label: 'Гроза', emoji: '⛈️' },
    { id: 'fog', label: 'Туман', emoji: '🌫️' },
    { id: 'spark', label: 'Прояснение', emoji: '⛅' },
    { id: 'calm', label: 'Ясно', emoji: '☀️' }
  ];

  // ═══════════════════════════════════════════════════════════════
  // REFLECTION ENGINE
  // ═══════════════════════════════════════════════════════════════

  var reflections = [
    { keywords: ['усталость', 'устал', 'нет сил', 'выгорание', 'истощ', 'измот', 'вымот', 'разбит'], insight: 'Тело просит паузу. Реактивность чаще всего — признак истощения, а не слабости характера.' },
    { keywords: ['тревог', 'страх', 'паник', 'волну', 'беспоко', 'нерв'], insight: 'Тревога живёт в теле раньше, чем в мыслях. Попробуй заземление — вернись в 5 чувств.' },
    { keywords: ['злость', 'раздраж', 'бесит', 'злюсь', 'ненавиж', 'ярост'], insight: 'Злость указывает на нарушенную границу среды. Что именно было нарушено?' },
    { keywords: ['грусть', 'тоска', 'одиноч', 'плачу', 'пусто', 'печаль'], insight: 'Грусть — знак того, что тебе что-то важно. Назови это — и оно перестанет быть туманом.' },
    { keywords: ['радость', 'счаст', 'хорошо', 'отлично', 'класс', 'прекрасн'], insight: 'Заметь, что поддерживает это состояние. Это часть твоей среды, которую стоит удерживать.' },
    { keywords: ['работ', 'проект', 'дедлайн', 'задач', 'дела'], insight: 'Дом строится маленькими действиями. Один шаг — уже шаг.' },
    { keywords: ['сон', 'бессонн', 'не сплю', 'просып', 'ноч'], insight: 'Тело — первый дом. Когда ему не хватает отдыха, все остальные дома шатаются.' },
    { keywords: ['туман', 'непон', 'путан', 'хаос', 'запут', 'неясн'], insight: 'Туман рассеивается, когда называешь вещи. Что конкретно сейчас непонятно?' },
    { keywords: ['спок', 'ровн', 'стаб', 'баланс', 'гармон'], insight: 'Стабильность — ресурс, а не норма. Заметь, какая среда это создала.' },
    { keywords: ['среда', 'окружен', 'люди', 'давл', 'токсич'], insight: 'Среда давит на границы постоянно. Без работы по поддержанию они съёживаются.' },
    { keywords: ['смысл', 'зачем', 'бессмысл', 'пуст'], insight: 'Между «я понял» и «я сделал» есть зазор. Что из понятого можно превратить в действие?' }
  ];

  function getReflection(text) {
    if (!text || !text.trim()) return 'Благодарю за честность с собой. Продолжайте наблюдать.';
    var lower = text.toLowerCase();
    for (var i = 0; i < reflections.length; i++) {
      var r = reflections[i];
      for (var j = 0; j < r.keywords.length; j++) {
        if (lower.indexOf(r.keywords[j]) !== -1) {
          return r.insight;
        }
      }
    }
    return 'Благодарю за честность с собой. Продолжайте наблюдать.';
  }

  // ═══════════════════════════════════════════════════════════════
  // TIMER STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  var state = {
    activeTimers: [],
    activeIntervals: [],
    animationFrames: [],
    startTime: null,
    running: false
  };

  function clearAllTimers() {
    state.activeTimers.forEach(function(t) { clearTimeout(t); });
    state.activeIntervals.forEach(function(t) { clearInterval(t); });
    state.animationFrames.forEach(function(t) { cancelAnimationFrame(t); });
    state.activeTimers = [];
    state.activeIntervals = [];
    state.animationFrames = [];
    state.running = false;
    state.startTime = null;
  }

  function addTimeout(fn, ms) {
    var t = setTimeout(fn, ms);
    state.activeTimers.push(t);
    return t;
  }

  function addInterval(fn, ms) {
    var t = setInterval(fn, ms);
    state.activeIntervals.push(t);
    return t;
  }

  function addAnimFrame(fn) {
    var id = requestAnimationFrame(fn);
    state.animationFrames.push(id);
    return id;
  }

  // ═══════════════════════════════════════════════════════════════
  // DOM HELPERS
  // ═══════════════════════════════════════════════════════════════

  function getView() { return document.getElementById('practice-view'); }
  function getTitle() { return document.getElementById('practice-view-title'); }
  function getBody() { return document.getElementById('practice-view-body'); }

  function showView(title) {
    var view = getView();
    var titleEl = getTitle();
    if (view) {
      view.classList.add('active');
      view.style.display = 'flex';
    }
    if (titleEl) titleEl.textContent = title;
  }

  function hideView() {
    clearAllTimers();
    var view = getView();
    if (view) {
      view.classList.remove('active');
      view.style.display = 'none';
    }
    var body = getBody();
    if (body) body.innerHTML = '';
  }

  function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function h(tag, className, innerHTML) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (innerHTML !== undefined) node.innerHTML = innerHTML;
    return node;
  }

  function getDayWord(n) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 19) return 'дней';
    if (mod10 === 1) return 'день';
    if (mod10 >= 2 && mod10 <= 4) return 'дня';
    return 'дней';
  }

  // ═══════════════════════════════════════════════════════════════
  // INTRO & COMPLETION SCREENS
  // ═══════════════════════════════════════════════════════════════

  function renderIntro(practice, onStart) {
    var body = getBody();
    body.innerHTML = '';

    var container = h('div', 'practice-intro');

    // Icon
    var icon = h('div', 'practice-intro-icon', practice.icon);
    container.appendChild(icon);

    // Title
    var title = h('h3', '', practice.title);
    container.appendChild(title);

    // Why (philosophical quote)
    if (practice.why) {
      var why = h('div', 'practice-intro-why', '« ' + practice.why + ' »');
      container.appendChild(why);
    }

    // Description
    var desc = h('p', 'practice-intro-description', practice.description);
    container.appendChild(desc);

    // Warning (if exists)
    if (practice.warning) {
      var warn = h('div', 'practice-warning', practice.warning);
      container.appendChild(warn);
    }

    // Instructions block
    if (practice.instructions && practice.instructions.length) {
      var instrBlock = h('div', 'practice-instructions');
      var instrTitle = h('h4', '', 'Инструкция');
      instrBlock.appendChild(instrTitle);

      var ol = h('ol', '');
      practice.instructions.forEach(function(step) {
        var li = h('li', '', step);
        ol.appendChild(li);
      });
      instrBlock.appendChild(ol);
      container.appendChild(instrBlock);
    }

    // Start button
    var btn = h('button', 'practice-start-btn', 'Начать практику');
    btn.addEventListener('click', onStart);
    container.appendChild(btn);

    body.appendChild(container);
  }

  function renderCompletion(practiceId, durationSec, extraContent) {
    var body = getBody();
    body.innerHTML = '';

    logPractice(practiceId, durationSec);

    var container = h('div', 'practice-complete');

    // Success icon
    var icon = h('div', 'practice-complete-icon', '✨');
    container.appendChild(icon);

    // Title
    var title = h('h3', '', 'Практика завершена');
    container.appendChild(title);

    // Duration info
    var info = h('p', '', 'Длительность: <strong>' + formatTime(durationSec) + '</strong>');
    container.appendChild(info);

    // Streak
    var data = loadData();
    var streakEl = h('div', 'practice-complete-streak', '<span class="streak-fire">🔥</span> Серия: ' + data.streak + ' ' + getDayWord(data.streak));
    container.appendChild(streakEl);

    // Extra content (like clarity scale)
    if (extraContent) {
      container.appendChild(extraContent);
    }

    // Controls
    var controls = h('div', 'practice-controls');
    var backBtn = h('button', 'practice-btn practice-btn-primary', 'Готово');
    backBtn.addEventListener('click', function() { window.closePractice(); });
    controls.appendChild(backBtn);
    container.appendChild(controls);

    body.appendChild(container);
  }

  // ═══════════════════════════════════════════════════════════════
  // BOX BREATHING
  // ═══════════════════════════════════════════════════════════════

  function startBoxBreathing(practice) {
    var body = getBody();
    body.innerHTML = '';
    state.running = true;
    state.startTime = Date.now();

    var container = h('div', 'practice-active');

    // Timer display
    var timerDisplay = h('div', 'practice-timer-display', '02:08');
    container.appendChild(timerDisplay);

    // Phase text
    var phaseText = h('div', 'practice-phase-text', 'Вдох');
    container.appendChild(phaseText);

    // Cycle counter as hint
    var phaseHint = h('div', 'practice-phase-hint', 'Цикл 1 из 8');
    container.appendChild(phaseHint);

    // Breathing circle
    var circle = h('div', 'breath-circle');
    var circleText = h('div', 'breath-circle-text', '4');
    circle.appendChild(circleText);
    container.appendChild(circle);

    // Stop button
    var controls = h('div', 'practice-controls');
    var stopBtn = h('button', 'practice-btn practice-btn-secondary', 'Остановить');
    stopBtn.addEventListener('click', function() {
      state.running = false;
      var dur = Math.round((Date.now() - state.startTime) / 1000);
      renderCompletion('box-breathing', dur);
    });
    controls.appendChild(stopBtn);
    container.appendChild(controls);

    body.appendChild(container);

    var phases = practice.phases;
    var totalCycles = practice.cycles;
    var currentCycle = 0;
    var currentPhase = 0;
    var phaseElapsed = 0;
    var totalDuration = totalCycles * phases.reduce(function(s, p) { return s + p.duration; }, 0);
    var totalElapsed = 0;

    function getPhaseClass() {
      var name = phases[currentPhase].name;
      if (name === 'Вдох') return 'inhale';
      if (name === 'Выдох') return 'exhale';
      return 'hold';
    }

    function updateDisplay() {
      var phase = phases[currentPhase];
      var remaining = phase.duration - phaseElapsed;
      phaseText.textContent = phase.name;
      phaseHint.textContent = 'Цикл ' + (currentCycle + 1) + ' из ' + totalCycles;
      circleText.textContent = remaining;
      timerDisplay.textContent = formatTime(totalDuration - totalElapsed);

      // Update circle class
      circle.className = 'breath-circle ' + getPhaseClass();
    }

    updateDisplay();

    var ticker = addInterval(function() {
      if (!state.running) return;

      phaseElapsed++;
      totalElapsed++;
      var phase = phases[currentPhase];

      if (phaseElapsed >= phase.duration) {
        phaseElapsed = 0;
        currentPhase++;
        if (currentPhase >= phases.length) {
          currentPhase = 0;
          currentCycle++;
          if (currentCycle >= totalCycles) {
            state.running = false;
            clearInterval(ticker);
            var dur = Math.round((Date.now() - state.startTime) / 1000);
            renderCompletion('box-breathing', dur);
            return;
          }
        }
      }
      updateDisplay();
    }, 1000);
  }

  // ═══════════════════════════════════════════════════════════════
  // HOLOTROPIC BREATHING
  // ═══════════════════════════════════════════════════════════════

  function startHolotropic(practice) {
    var body = getBody();
    body.innerHTML = '';
    state.running = true;
    state.startTime = Date.now();

    var container = h('div', 'practice-active');

    // Timer display
    var timerDisplay = h('div', 'practice-timer-display', '12:00');
    container.appendChild(timerDisplay);

    // Phase
    var phaseText = h('div', 'practice-phase-text', 'Разогрев');
    container.appendChild(phaseText);

    var phaseHint = h('div', 'practice-phase-hint', 'Дышите глубоко и ровно');
    container.appendChild(phaseHint);

    // Breathing circle (holotropic style)
    var circle = h('div', 'breath-circle holotropic-circle');
    var circleText = h('div', 'breath-circle-text', '~');
    circle.appendChild(circleText);
    container.appendChild(circle);

    // Progress bar
    var progressWrap = h('div', 'practice-progress-bar');
    var progressFill = h('div', 'practice-progress-fill');
    progressWrap.appendChild(progressFill);
    container.appendChild(progressWrap);

    // Stop button
    var controls = h('div', 'practice-controls');
    var stopBtn = h('button', 'practice-btn practice-btn-secondary', 'Остановить');
    stopBtn.addEventListener('click', function() {
      state.running = false;
      var dur = Math.round((Date.now() - state.startTime) / 1000);
      renderCompletion('holotropic', dur);
    });
    controls.appendChild(stopBtn);
    container.appendChild(controls);

    body.appendChild(container);

    var phases = practice.phases;
    var currentPhaseIdx = 0;
    var phaseElapsed = 0;
    var totalDuration = phases.reduce(function(sum, p) { return sum + p.duration; }, 0);
    var totalElapsed = 0;

    var phaseHints = {
      'Разогрев': 'Дышите глубоко и ровно',
      'Ускорение': 'Увеличивайте темп',
      'Пик': 'Максимальная интенсивность',
      'Замедление': 'Плавно снижайте темп',
      'Интеграция': 'Свободное дыхание, наблюдайте'
    };

    // Breath animation
    var expanding = true;
    function animateBreath() {
      if (!state.running) return;
      var phase = phases[currentPhaseIdx];
      var interval = Math.round(2000 / phase.speed);

      expanding = !expanding;
      circle.style.transition = 'transform ' + (interval / 1000) + 's ease-in-out';
      if (expanding) {
        circle.classList.add('inhale');
        circle.classList.remove('exhale');
      } else {
        circle.classList.add('exhale');
        circle.classList.remove('inhale');
      }
      addTimeout(animateBreath, interval);
    }
    animateBreath();

    function updateDisplay() {
      var phase = phases[currentPhaseIdx];
      var totalRemaining = totalDuration - totalElapsed;
      phaseText.textContent = phase.name;
      phaseHint.textContent = phaseHints[phase.name] || '';
      timerDisplay.textContent = formatTime(totalRemaining);
      var pct = Math.min(100, (totalElapsed / totalDuration) * 100);
      progressFill.style.width = pct + '%';
    }

    updateDisplay();

    var ticker = addInterval(function() {
      if (!state.running) return;

      phaseElapsed++;
      totalElapsed++;
      var phase = phases[currentPhaseIdx];

      if (phaseElapsed >= phase.duration) {
        phaseElapsed = 0;
        currentPhaseIdx++;
        if (currentPhaseIdx >= phases.length) {
          state.running = false;
          clearInterval(ticker);
          var dur = Math.round((Date.now() - state.startTime) / 1000);
          renderCompletion('holotropic', dur);
          return;
        }
      }
      updateDisplay();
    }, 1000);
  }

  // ═══════════════════════════════════════════════════════════════
  // FOCUS POINT
  // ═══════════════════════════════════════════════════════════════

  function startFocus(practice) {
    var body = getBody();
    body.innerHTML = '';
    state.running = true;
    state.startTime = Date.now();

    var container = h('div', 'practice-active');

    // Timer
    var timerDisplay = h('div', 'practice-timer-display', formatTime(practice.duration));
    container.appendChild(timerDisplay);

    // Phase text
    var phaseText = h('div', 'practice-phase-text', 'Удерживайте взгляд');
    container.appendChild(phaseText);

    var phaseHint = h('div', 'practice-phase-hint', 'Мягко смотрите на точку, не напрягаясь');
    container.appendChild(phaseHint);

    // Focus dot container with rings
    var dotContainer = h('div', 'focus-dot-container');
    var dot = h('div', 'focus-dot');
    dotContainer.appendChild(dot);
    container.appendChild(dotContainer);

    // Stop button
    var controls = h('div', 'practice-controls');
    var stopBtn = h('button', 'practice-btn practice-btn-secondary', 'Остановить');
    stopBtn.addEventListener('click', function() {
      state.running = false;
      var dur = Math.round((Date.now() - state.startTime) / 1000);
      renderCompletion('focus', dur);
    });
    controls.appendChild(stopBtn);
    container.appendChild(controls);

    body.appendChild(container);

    var remaining = practice.duration;
    var messages = [
      { at: 150, text: 'Расслабьте лоб и челюсть' },
      { at: 120, text: 'Дышите ровно' },
      { at: 90, text: 'Отпустите мысли' },
      { at: 60, text: 'Вы делаете отлично' },
      { at: 30, text: 'Последние 30 секунд' }
    ];

    var ticker = addInterval(function() {
      if (!state.running) return;
      remaining--;
      timerDisplay.textContent = formatTime(remaining);

      // Update hint based on time
      for (var i = 0; i < messages.length; i++) {
        if (remaining === messages[i].at) {
          phaseHint.textContent = messages[i].text;
          break;
        }
      }

      if (remaining <= 0) {
        state.running = false;
        clearInterval(ticker);
        var dur = Math.round((Date.now() - state.startTime) / 1000);

        // Clarity scale as extra content
        var extra = h('div', 'focus-clarity-section');
        var prompt = h('p', 'focus-clarity-prompt', 'Насколько чист ваш ум сейчас?');
        extra.appendChild(prompt);

        var scale = h('div', 'focus-clarity-scale');
        for (var i = 1; i <= 5; i++) {
          (function(val) {
            var btn = h('button', 'clarity-btn', String(val));
            btn.addEventListener('click', function() {
              var allBtns = scale.querySelectorAll('.clarity-btn');
              for (var k = 0; k < allBtns.length; k++) { allBtns[k].classList.remove('selected'); }
              btn.classList.add('selected');
            });
            scale.appendChild(btn);
          })(i);
        }
        extra.appendChild(scale);

        var labels = h('div', 'focus-clarity-labels');
        labels.innerHTML = '<span>Шумно</span><span>Кристально</span>';
        extra.appendChild(labels);

        renderCompletion('focus', dur, extra);
      }
    }, 1000);
  }

  // ═══════════════════════════════════════════════════════════════
  // MEDITATION
  // ═══════════════════════════════════════════════════════════════

  function startMeditation(practice) {
    var body = getBody();
    body.innerHTML = '';
    state.running = true;
    state.startTime = Date.now();

    var container = h('div', 'practice-active');

    // Timer
    var timerDisplay = h('div', 'practice-timer-display', '07:00');
    container.appendChild(timerDisplay);

    // Phase
    var phaseText = h('div', 'practice-phase-text', 'Погружение');
    container.appendChild(phaseText);

    var phaseHint = h('div', 'practice-phase-hint', practice.phases[0].hint);
    container.appendChild(phaseHint);

    // Meditation visual (rings)
    var visual = h('div', 'meditation-visual');
    for (var i = 0; i < 4; i++) {
      var ring = h('div', 'meditation-ring');
      visual.appendChild(ring);
    }
    var center = h('div', 'meditation-ring-center');
    visual.appendChild(center);
    container.appendChild(visual);

    // Stop button
    var controls = h('div', 'practice-controls');
    var stopBtn = h('button', 'practice-btn practice-btn-secondary', 'Остановить');
    stopBtn.addEventListener('click', function() {
      state.running = false;
      var dur = Math.round((Date.now() - state.startTime) / 1000);
      renderCompletion('meditation', dur);
    });
    controls.appendChild(stopBtn);
    container.appendChild(controls);

    body.appendChild(container);

    var phases = practice.phases;
    var currentPhaseIdx = 0;
    var phaseElapsed = 0;
    var totalDuration = phases.reduce(function(sum, p) { return sum + p.duration; }, 0);
    var totalElapsed = 0;

    function updateDisplay() {
      var phase = phases[currentPhaseIdx];
      var totalRemaining = totalDuration - totalElapsed;
      phaseText.textContent = phase.name;
      phaseHint.textContent = phase.hint;
      timerDisplay.textContent = formatTime(totalRemaining);
    }

    updateDisplay();

    var ticker = addInterval(function() {
      if (!state.running) return;

      phaseElapsed++;
      totalElapsed++;
      var phase = phases[currentPhaseIdx];

      if (phaseElapsed >= phase.duration) {
        phaseElapsed = 0;
        currentPhaseIdx++;
        if (currentPhaseIdx >= phases.length) {
          state.running = false;
          clearInterval(ticker);
          var dur = Math.round((Date.now() - state.startTime) / 1000);
          renderCompletion('meditation', dur);
          return;
        }
      }
      updateDisplay();
    }, 1000);
  }

  // ═══════════════════════════════════════════════════════════════
  // DAILY CHECK-IN
  // ═══════════════════════════════════════════════════════════════

  function renderCheckin() {
    var body = getBody();
    body.innerHTML = '';

    var container = h('div', 'checkin-section');
    var selectedMood = null;

    // Header
    var header = h('div', 'checkin-header');
    var headerIcon = h('div', 'checkin-header-icon', '📝');
    header.appendChild(headerIcon);
    var headerTitle = h('h3', 'checkin-title', 'Что происходит сейчас?');
    header.appendChild(headerTitle);
    var headerSub = h('p', 'checkin-subtitle', 'Назови состояние — это первый шаг к паузе');
    header.appendChild(headerSub);
    container.appendChild(header);

    // Mood grid
    var moodLabel = h('div', 'checkin-section-label', 'Настроение');
    container.appendChild(moodLabel);

    var moodGrid = h('div', 'mood-grid');

    moods.forEach(function(mood) {
      var btn = h('button', 'mood-btn',
        '<span class="mood-emoji">' + mood.emoji + '</span>' +
        '<span class="mood-label">' + mood.label + '</span>'
      );
      btn.setAttribute('data-mood', mood.id);
      btn.addEventListener('click', function() {
        var allBtns = moodGrid.querySelectorAll('.mood-btn');
        for (var k = 0; k < allBtns.length; k++) { allBtns[k].classList.remove('selected'); }
        btn.classList.add('selected');
        selectedMood = mood.id;
      });
      moodGrid.appendChild(btn);
    });
    container.appendChild(moodGrid);

    // Text area
    var textLabel = h('div', 'checkin-section-label', 'Что на уме? <span style="opacity:0.5">(необязательно)</span>');
    container.appendChild(textLabel);

    var textarea = document.createElement('textarea');
    textarea.className = 'checkin-textarea';
    textarea.placeholder = 'Напишите что угодно — мысли, чувства, события дня...';
    textarea.rows = 4;
    container.appendChild(textarea);

    // Reflection box (hidden initially)
    var reflectionBox = h('div', 'reflection-box');
    container.appendChild(reflectionBox);

    // Submit button
    var controls = h('div', 'practice-controls');
    var submitBtn = h('button', 'practice-btn practice-btn-primary', 'Сохранить');
    submitBtn.addEventListener('click', function() {
      if (!selectedMood) {
        // Shake the mood grid
        moodGrid.style.animation = 'shake 0.4s ease';
        setTimeout(function() { moodGrid.style.animation = ''; }, 400);
        return;
      }

      var text = textarea.value.trim();
      var data = loadData();
      data = updateStreak(data);
      data.entries.push({
        date: new Date().toISOString(),
        mood: selectedMood,
        text: text
      });
      saveData(data);

      // Show reflection
      var insight = getReflection(text);

      // Render completion with insight
      body.innerHTML = '';
      var result = h('div', 'practice-complete');

      var doneIcon = h('div', 'practice-complete-icon', '✅');
      result.appendChild(doneIcon);

      var doneTitle = h('h3', '', 'Записано');
      result.appendChild(doneTitle);

      // Mood display
      var moodInfo = moods.filter(function(m) { return m.id === selectedMood; })[0];
      if (moodInfo) {
        var moodDisplay = h('p', '', moodInfo.emoji + ' ' + moodInfo.label);
        result.appendChild(moodDisplay);
      }

      // Insight
      var insightBox = h('div', 'reflection-box visible');
      insightBox.innerHTML = '<strong>Наблюдение:</strong> ' + insight;
      result.appendChild(insightBox);

      // Streak
      var streakEl = h('div', 'practice-complete-streak', '<span class="streak-fire">🔥</span> Серия: ' + data.streak + ' ' + getDayWord(data.streak));
      result.appendChild(streakEl);

      // Back button
      var backControls = h('div', 'practice-controls');
      var backBtn = h('button', 'practice-btn practice-btn-primary', 'Готово');
      backBtn.addEventListener('click', function() { window.closePractice(); });
      backControls.appendChild(backBtn);
      result.appendChild(backControls);

      body.appendChild(result);
    });
    controls.appendChild(submitBtn);

    var cancelBtn = h('button', 'practice-btn practice-btn-secondary', 'Отмена');
    cancelBtn.addEventListener('click', function() { window.closePractice(); });
    controls.appendChild(cancelBtn);

    container.appendChild(controls);
    body.appendChild(container);
  }

  // ═══════════════════════════════════════════════════════════════
  // GROUNDING 5-4-3-2-1
  // ═══════════════════════════════════════════════════════════════

  function startGrounding(practice) {
    var body = getBody();
    body.innerHTML = '';
    state.running = true;
    state.startTime = Date.now();

    var steps = practice.steps;
    var currentStep = 0;

    function renderStep() {
      body.innerHTML = '';
      var step = steps[currentStep];

      var container = h('div', 'practice-active grounding-active');

      // Progress dots
      var progress = h('div', 'grounding-progress');
      for (var p = 0; p < steps.length; p++) {
        var dotClass = 'grounding-dot';
        if (p < currentStep) dotClass += ' done';
        if (p === currentStep) dotClass += ' active';
        var dot = h('span', dotClass);
        progress.appendChild(dot);
      }
      container.appendChild(progress);

      // Big number
      var numEl = h('div', 'grounding-number', String(step.count));
      container.appendChild(numEl);

      // Sense icon + name
      var senseRow = h('div', 'grounding-sense', step.icon + ' ' + step.sense);
      container.appendChild(senseRow);

      // Prompt
      var prompt = h('p', 'grounding-prompt', step.prompt);
      container.appendChild(prompt);

      // Input fields
      var inputs = h('div', 'grounding-inputs');
      for (var i = 0; i < step.count; i++) {
        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'grounding-input';
        input.placeholder = (i + 1) + '. ...';
        // Auto-advance on Enter
        (function(idx) {
          input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
              var nextInput = inputs.querySelectorAll('.grounding-input')[idx + 1];
              if (nextInput) nextInput.focus();
              else nextBtn.focus();
            }
          });
        })(i);
        inputs.appendChild(input);
      }
      container.appendChild(inputs);

      // Next/Finish button
      var isLast = currentStep >= steps.length - 1;
      var nextBtn = h('button', 'practice-btn practice-btn-primary', isLast ? 'Завершить' : 'Далее →');
      nextBtn.addEventListener('click', function() {
        currentStep++;
        if (currentStep >= steps.length) {
          state.running = false;
          var dur = Math.round((Date.now() - state.startTime) / 1000);
          renderGroundingComplete(dur);
        } else {
          renderStep();
        }
      });
      container.appendChild(nextBtn);

      body.appendChild(container);

      // Focus first input
      var firstInput = container.querySelector('.grounding-input');
      if (firstInput) {
        setTimeout(function() { firstInput.focus(); }, 150);
      }
    }

    function renderGroundingComplete(dur) {
      body.innerHTML = '';
      logPractice('grounding', dur);

      var container = h('div', 'practice-complete');

      var icon = h('div', 'practice-complete-icon', '🌍');
      container.appendChild(icon);

      var title = h('h3', '', 'Ты здесь. В своём первом доме.');
      container.appendChild(title);

      var info = h('p', '', 'Завершено за <strong>' + formatTime(dur) + '</strong>');
      container.appendChild(info);

      var data = loadData();
      var streakEl = h('div', 'practice-complete-streak', '<span class="streak-fire">🔥</span> Серия: ' + data.streak + ' ' + getDayWord(data.streak));
      container.appendChild(streakEl);

      var controls = h('div', 'practice-controls');
      var backBtn = h('button', 'practice-btn practice-btn-primary', 'Готово');
      backBtn.addEventListener('click', function() { window.closePractice(); });
      controls.appendChild(backBtn);
      container.appendChild(controls);

      body.appendChild(container);
    }

    renderStep();
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN API
  // ═══════════════════════════════════════════════════════════════

  function openPractice(id) {
    var practice = practices[id];
    if (!practice) return;

    clearAllTimers();
    showView(practice.title);

    switch (practice.type) {
      case 'breathing':
        renderIntro(practice, function() { startBoxBreathing(practice); });
        break;
      case 'holotropic':
        renderIntro(practice, function() { startHolotropic(practice); });
        break;
      case 'focus':
        renderIntro(practice, function() { startFocus(practice); });
        break;
      case 'meditation':
        renderIntro(practice, function() { startMeditation(practice); });
        break;
      case 'checkin':
        renderCheckin();
        break;
      case 'grounding':
        renderIntro(practice, function() { startGrounding(practice); });
        break;
    }
  }

  function closePractice() {
    hideView();
  }

  // ═══════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════

  function init() {
    window.openPractice = openPractice;
    window.closePractice = closePractice;

    var data = loadData();

    // Validate streak continuity
    var today = getTodayStr();
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    var yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (data.lastDate && data.lastDate !== today && data.lastDate !== yesterdayStr) {
      data.streak = 0;
      saveData(data);
    }

    updateStreakDisplay(data.streak);

    // Bind practice cards
    var cards = document.querySelectorAll('.practice-card[data-practice]');
    for (var i = 0; i < cards.length; i++) {
      (function(card) {
        card.addEventListener('click', function() {
          var practiceId = card.getAttribute('data-practice');
          openPractice(practiceId);
        });
      })(cards[i]);
    }

    // Escape key closes practice
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        var view = getView();
        if (view && (view.classList.contains('active') || view.style.display === 'flex')) {
          closePractice();
        }
      }
    });

    // Sync from Supabase
    if (window.SupabaseClient && typeof window.SupabaseClient.get === 'function') {
      try {
        var result = window.SupabaseClient.get(STORAGE_KEY);
        if (result && typeof result.then === 'function') {
          result.then(function(remoteData) {
            if (remoteData && remoteData.entries && Array.isArray(remoteData.entries)) {
              var local = loadData();
              if (remoteData.entries.length > local.entries.length ||
                  (remoteData.practiceLog && remoteData.practiceLog.length > (local.practiceLog || []).length)) {
                saveData(remoteData);
              }
            }
          }).catch(function() { /* silent */ });
        }
      } catch (e) { /* silent */ }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
