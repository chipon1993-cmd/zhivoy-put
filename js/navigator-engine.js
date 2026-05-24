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
      description: 'Техника дыхания по квадрату: 4 секунды вдох, 4 секунды задержка, 4 секунды выдох, 4 секунды задержка.',
      instructions: '8 циклов. Следуйте за кругом — он расширяется на вдохе и сжимается на выдохе. Дышите ровно и спокойно.',
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
      description: 'Интенсивная дыхательная практика с поэтапным ускорением и замедлением.',
      instructions: 'Дышите глубоко и ритмично. Следуйте за темпом круга на экране.',
      warning: '⚠️ Противопоказания: беременность, эпилепсия, сердечно-сосудистые заболевания, глаукома. При головокружении — замедлитесь.',
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
      description: 'Смотрите на точку не отрываясь в течение 3 минут. Тренировка устойчивого внимания.',
      instructions: 'Расслабьте взгляд. Если мысли уходят — мягко верните внимание к точке. Старайтесь не моргать слишком часто.',
      type: 'focus',
      duration: 180
    },
    'meditation': {
      title: 'Медитация',
      description: 'Управляемая медитация: осознание тела, фокус на дыхании, открытое внимание, мягкое завершение.',
      instructions: 'Сядьте удобно. Следуйте подсказкам на экране. Не боритесь с мыслями — просто замечайте их.',
      type: 'meditation',
      phases: [
        { name: 'Погружение', duration: 60, hint: 'Закройте глаза, расслабьте тело' },
        { name: 'Фокус', duration: 180, hint: 'Наблюдайте за дыханием' },
        { name: 'Открытое внимание', duration: 120, hint: 'Замечайте звуки, ощущения' },
        { name: 'Завершение', duration: 60, hint: 'Медленно возвращайтесь' }
      ]
    },
    'checkin': {
      title: 'Ежедневный чекин',
      description: 'Запишите своё состояние и настроение.',
      type: 'checkin'
    },
    'grounding': {
      title: 'Заземление 5-4-3-2-1',
      description: 'Техника возвращения в настоящий момент через 5 органов чувств.',
      instructions: 'Называйте предметы и ощущения вокруг вас шаг за шагом. Не торопитесь.',
      type: 'grounding',
      steps: [
        { count: 5, sense: 'Зрение', prompt: 'Назовите 5 вещей, которые вы видите' },
        { count: 4, sense: 'Осязание', prompt: 'Назовите 4 вещи, которые можете потрогать' },
        { count: 3, sense: 'Слух', prompt: 'Назовите 3 звука, которые слышите' },
        { count: 2, sense: 'Обоняние', prompt: 'Назовите 2 запаха, которые чувствуете' },
        { count: 1, sense: 'Вкус', prompt: 'Назовите 1 вкус, который ощущаете' }
      ]
    }
  };

  var moods = [
    { id: 'heavy', label: 'Тяжело', emoji: '🪨' },
    { id: 'anxious', label: 'Тревожно', emoji: '⚡' },
    { id: 'fog', label: 'Туман', emoji: '🌫️' },
    { id: 'spark', label: 'Искра', emoji: '✨' },
    { id: 'calm', label: 'Спокойствие', emoji: '🌊' }
  ];

  // ═══════════════════════════════════════════════════════════════
  // REFLECTION ENGINE
  // ═══════════════════════════════════════════════════════════════

  var reflections = [
    { keywords: ['усталость', 'устал', 'нет сил', 'выгорание', 'истощ', 'измот', 'вымот', 'разбит'], insight: 'Ваше тело просит отдыха. Позвольте себе паузу без чувства вины.' },
    { keywords: ['тревог', 'страх', 'паник', 'волну', 'беспоко', 'нерв'], insight: 'Тревога — это энергия без направления. Попробуйте дыхательную практику.' },
    { keywords: ['злость', 'раздраж', 'бесит', 'злюсь', 'ненавиж', 'ярост'], insight: 'Злость указывает на нарушенные границы. Что именно было нарушено?' },
    { keywords: ['грусть', 'тоска', 'одиноч', 'плачу', 'пусто', 'печаль'], insight: 'Грусть — знак того, что вам что-то важно. Позвольте себе прожить это чувство.' },
    { keywords: ['радость', 'счаст', 'хорошо', 'отлично', 'класс', 'прекрасн'], insight: 'Запомните это состояние. Что именно привело вас сюда сегодня?' },
    { keywords: ['работ', 'проект', 'дедлайн', 'задач', 'дела'], insight: 'Разделите большое на маленькое. Один шаг за раз.' },
    { keywords: ['сон', 'бессонн', 'не сплю', 'просып', 'ноч'], insight: 'Качество сна влияет на всё. Вечерний ритуал без экранов может помочь.' },
    { keywords: ['туман', 'непон', 'путан', 'хаос', 'запут', 'неясн'], insight: 'Туман рассеивается, когда вы называете вещи своими именами. Что именно непонятно?' },
    { keywords: ['спок', 'ровн', 'стаб', 'баланс', 'гармон'], insight: 'Стабильность — это ресурс. Заметьте, что поддерживает это состояние.' }
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

  function el(tag, className, innerHTML) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (innerHTML !== undefined) node.innerHTML = innerHTML;
    return node;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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

    var container = el('div', 'practice-intro');

    var desc = el('p', 'practice-description', practice.description);
    container.appendChild(desc);

    if (practice.warning) {
      var warn = el('div', 'practice-warning', practice.warning);
      container.appendChild(warn);
    }

    if (practice.instructions) {
      var instr = el('p', 'practice-instructions', practice.instructions);
      container.appendChild(instr);
    }

    var btn = el('button', 'practice-start-btn', 'Начать');
    btn.addEventListener('click', onStart);
    container.appendChild(btn);

    body.appendChild(container);
  }

  function renderCompletion(practiceId, durationSec, extraContent) {
    var body = getBody();
    body.innerHTML = '';

    logPractice(practiceId, durationSec);

    var container = el('div', 'practice-complete');

    var msg = el('h3', 'practice-complete-title', 'Практика завершена');
    container.appendChild(msg);

    var timeMsg = el('p', 'practice-complete-time', 'Длительность: ' + formatTime(durationSec));
    container.appendChild(timeMsg);

    var data = loadData();
    var streakMsg = el('p', 'practice-complete-streak', 'Серия: ' + data.streak + ' ' + getDayWord(data.streak));
    container.appendChild(streakMsg);

    if (extraContent) {
      container.appendChild(extraContent);
    }

    var btn = el('button', 'practice-back-btn', 'Назад');
    btn.addEventListener('click', function() { window.closePractice(); });
    container.appendChild(btn);

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

    var container = el('div', 'breathing-container');

    var circleWrap = el('div', 'breathing-circle-wrap');
    var circle = el('div', 'breathing-circle');
    circleWrap.appendChild(circle);
    container.appendChild(circleWrap);

    var phaseText = el('div', 'breathing-phase-text');
    container.appendChild(phaseText);

    var timerText = el('div', 'breathing-timer');
    container.appendChild(timerText);

    var cycleText = el('div', 'breathing-cycle');
    container.appendChild(cycleText);

    body.appendChild(container);

    var phases = practice.phases;
    var totalCycles = practice.cycles;
    var currentCycle = 0;
    var currentPhase = 0;
    var phaseElapsed = 0;

    function updateDisplay() {
      var phase = phases[currentPhase];
      var remaining = phase.duration - phaseElapsed;
      phaseText.textContent = phase.name;
      timerText.textContent = remaining + 'с';
      cycleText.textContent = 'Цикл ' + (currentCycle + 1) + ' из ' + totalCycles;

      // Circle animation based on phase
      var progress = phaseElapsed / phase.duration;
      if (phase.name === 'Вдох') {
        circle.style.transform = 'scale(' + (0.5 + 0.5 * progress) + ')';
        circle.style.opacity = '0.7';
      } else if (phase.name === 'Выдох') {
        circle.style.transform = 'scale(' + (1.0 - 0.5 * progress) + ')';
        circle.style.opacity = '0.7';
      } else {
        // Hold phases
        circle.style.opacity = '0.5';
      }
    }

    updateDisplay();

    var ticker = addInterval(function() {
      if (!state.running) return;

      phaseElapsed++;
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

    var container = el('div', 'breathing-container');

    var circleWrap = el('div', 'breathing-circle-wrap');
    var circle = el('div', 'breathing-circle holotropic');
    circleWrap.appendChild(circle);
    container.appendChild(circleWrap);

    var phaseText = el('div', 'breathing-phase-text');
    container.appendChild(phaseText);

    var timerText = el('div', 'breathing-timer');
    container.appendChild(timerText);

    var progressBar = el('div', 'breathing-progress');
    var progressFill = el('div', 'breathing-progress-fill');
    progressBar.appendChild(progressFill);
    container.appendChild(progressBar);

    body.appendChild(container);

    var phases = practice.phases;
    var currentPhaseIdx = 0;
    var phaseElapsed = 0;
    var totalDuration = phases.reduce(function(sum, p) { return sum + p.duration; }, 0);
    var totalElapsed = 0;

    // Breath animation state
    var expanding = true;
    var breathTimer = null;

    function getBreathInterval(speed) {
      // Base full breath cycle is 4s (2s in, 2s out), speed multiplies
      return Math.round(2000 / speed);
    }

    function animateBreath() {
      if (!state.running) return;
      var phase = phases[currentPhaseIdx];
      var interval = getBreathInterval(phase.speed);

      expanding = !expanding;
      circle.style.transition = 'transform ' + (interval / 1000) + 's ease-in-out, opacity ' + (interval / 1000) + 's ease-in-out';
      circle.style.transform = expanding ? 'scale(1.0)' : 'scale(0.45)';
      circle.style.opacity = expanding ? '0.8' : '0.5';

      breathTimer = addTimeout(animateBreath, interval);
    }

    function updateDisplay() {
      var phase = phases[currentPhaseIdx];
      var remaining = phase.duration - phaseElapsed;
      phaseText.textContent = phase.name;
      timerText.textContent = formatTime(remaining);

      var pct = Math.min(100, (totalElapsed / totalDuration) * 100);
      progressFill.style.width = pct + '%';
    }

    updateDisplay();
    animateBreath();

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

    var container = el('div', 'focus-container');

    var dot = el('div', 'focus-dot');
    container.appendChild(dot);

    var timerText = el('div', 'focus-timer', formatTime(practice.duration));
    container.appendChild(timerText);

    body.appendChild(container);

    var remaining = practice.duration;

    // Subtle glow animation
    var glowPhase = 0;
    function animateGlow() {
      if (!state.running) return;
      glowPhase += 0.02;
      var glow = 8 + 4 * Math.sin(glowPhase);
      dot.style.boxShadow = '0 0 ' + glow + 'px ' + (glow / 2) + 'px rgba(255, 255, 255, 0.6)';
      addAnimFrame(animateGlow);
    }
    addAnimFrame(animateGlow);

    var ticker = addInterval(function() {
      if (!state.running) return;
      remaining--;
      timerText.textContent = formatTime(remaining);

      if (remaining <= 0) {
        state.running = false;
        clearInterval(ticker);
        var dur = Math.round((Date.now() - state.startTime) / 1000);

        var extra = el('div', 'focus-complete-extra');
        var prompt = el('p', 'focus-clarity-prompt', 'Насколько чист ваш ум прямо сейчас?');
        extra.appendChild(prompt);

        var scale = el('div', 'focus-clarity-scale');
        for (var i = 1; i <= 5; i++) {
          (function(val) {
            var btn = el('button', 'clarity-btn', String(val));
            btn.addEventListener('click', function() {
              var allBtns = scale.querySelectorAll('.clarity-btn');
              for (var k = 0; k < allBtns.length; k++) { allBtns[k].classList.remove('selected'); }
              btn.classList.add('selected');
            });
            scale.appendChild(btn);
          })(i);
        }
        extra.appendChild(scale);

        var labels = el('div', 'focus-clarity-labels');
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

    var container = el('div', 'meditation-container');

    var ringsWrap = el('div', 'meditation-rings');
    for (var i = 0; i < 3; i++) {
      var ring = el('div', 'meditation-ring ring-' + i);
      ringsWrap.appendChild(ring);
    }
    container.appendChild(ringsWrap);

    var phaseText = el('div', 'meditation-phase');
    container.appendChild(phaseText);

    var hintText = el('div', 'meditation-hint');
    container.appendChild(hintText);

    var timerText = el('div', 'meditation-timer');
    container.appendChild(timerText);

    body.appendChild(container);

    var phases = practice.phases;
    var currentPhaseIdx = 0;
    var phaseElapsed = 0;

    // Pulse animation
    var pulseT = 0;
    function pulseRings() {
      if (!state.running) return;
      pulseT++;
      var rings = ringsWrap.querySelectorAll('.meditation-ring');
      for (var idx = 0; idx < rings.length; idx++) {
        var scale = 1 + 0.08 * Math.sin((pulseT + idx * 25) * 0.04);
        var opacity = 0.3 + 0.2 * Math.sin((pulseT + idx * 35) * 0.03);
        rings[idx].style.transform = 'scale(' + scale + ')';
        rings[idx].style.opacity = opacity;
      }
      addAnimFrame(pulseRings);
    }
    addAnimFrame(pulseRings);

    function updateDisplay() {
      var phase = phases[currentPhaseIdx];
      var remaining = phase.duration - phaseElapsed;
      phaseText.textContent = phase.name;
      hintText.textContent = phase.hint;
      timerText.textContent = formatTime(remaining);
    }

    updateDisplay();

    var ticker = addInterval(function() {
      if (!state.running) return;

      phaseElapsed++;
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

    var container = el('div', 'checkin-container');
    var selectedMood = null;

    // Mood label
    var moodLabel = el('p', 'checkin-label', 'Как вы себя чувствуете?');
    container.appendChild(moodLabel);

    // Mood grid
    var moodGrid = el('div', 'checkin-mood-grid');
    moodGrid.id = 'checkin-mood-grid';

    moods.forEach(function(mood) {
      var btn = el('button', 'mood-btn',
        '<span class="mood-emoji">' + mood.emoji + '</span>' +
        '<span class="mood-label">' + mood.label + '</span>'
      );
      btn.setAttribute('data-mood', mood.id);
      btn.addEventListener('click', function() {
        var allBtns = moodGrid.querySelectorAll('.mood-btn');
        for (var k = 0; k < allBtns.length; k++) { allBtns[k].classList.remove('selected'); }
        btn.classList.add('selected');
        selectedMood = mood.id;
        moodLabel.textContent = 'Как вы себя чувствуете?';
        moodLabel.style.color = '';
      });
      moodGrid.appendChild(btn);
    });
    container.appendChild(moodGrid);

    // Text area
    var textLabel = el('p', 'checkin-label checkin-text-label', 'Что на уме? (необязательно)');
    container.appendChild(textLabel);

    var textarea = document.createElement('textarea');
    textarea.id = 'checkin-text';
    textarea.className = 'checkin-textarea';
    textarea.placeholder = 'Напишите что угодно...';
    textarea.rows = 4;
    container.appendChild(textarea);

    // Submit button
    var submitBtn = el('button', 'checkin-submit-btn', 'Сохранить');
    submitBtn.id = 'checkin-submit';
    submitBtn.addEventListener('click', function() {
      if (!selectedMood) {
        moodLabel.textContent = 'Пожалуйста, выберите настроение ↑';
        moodLabel.style.color = '#ff6b6b';
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

      // Show result screen
      body.innerHTML = '';
      var result = el('div', 'checkin-result');

      var savedTitle = el('h3', 'checkin-saved-title', 'Записано');
      result.appendChild(savedTitle);

      var moodInfo = moods.filter(function(m) { return m.id === selectedMood; })[0];
      if (moodInfo) {
        var moodDisplay = el('div', 'checkin-saved-mood', moodInfo.emoji + ' ' + moodInfo.label);
        result.appendChild(moodDisplay);
      }

      var reflection = getReflection(text);
      var insight = el('p', 'checkin-insight', reflection);
      result.appendChild(insight);

      var streakInfo = el('p', 'checkin-streak', 'Серия: ' + data.streak + ' ' + getDayWord(data.streak));
      result.appendChild(streakInfo);

      var backBtn = el('button', 'practice-back-btn', 'Назад');
      backBtn.addEventListener('click', function() { window.closePractice(); });
      result.appendChild(backBtn);

      body.appendChild(result);
    });
    container.appendChild(submitBtn);

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

      var container = el('div', 'grounding-container');

      // Progress indicator
      var progress = el('div', 'grounding-progress');
      for (var p = 0; p < steps.length; p++) {
        var dot = el('span', 'grounding-progress-dot' + (p < currentStep ? ' done' : '') + (p === currentStep ? ' active' : ''));
        progress.appendChild(dot);
      }
      container.appendChild(progress);

      // Step number
      var stepNum = el('div', 'grounding-step-num', String(step.count));
      container.appendChild(stepNum);

      // Sense name
      var sense = el('h3', 'grounding-sense', step.sense);
      container.appendChild(sense);

      // Prompt
      var prompt = el('p', 'grounding-prompt', step.prompt);
      container.appendChild(prompt);

      // Input fields
      var inputs = el('div', 'grounding-inputs');
      for (var i = 0; i < step.count; i++) {
        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'grounding-input';
        input.placeholder = (i + 1) + '.';
        inputs.appendChild(input);
      }
      container.appendChild(inputs);

      // Next/Finish button
      var isLast = currentStep >= steps.length - 1;
      var nextBtn = el('button', 'grounding-next-btn', isLast ? 'Завершить' : 'Далее →');
      nextBtn.addEventListener('click', function() {
        currentStep++;
        if (currentStep >= steps.length) {
          // Complete
          state.running = false;
          var dur = Math.round((Date.now() - state.startTime) / 1000);
          logPractice('grounding', dur);

          body.innerHTML = '';
          var complete = el('div', 'grounding-complete');

          var title = el('h3', 'grounding-complete-title', 'Вы здесь. В настоящем.');
          complete.appendChild(title);

          var sub = el('p', 'grounding-complete-sub', 'Практика завершена за ' + formatTime(dur));
          complete.appendChild(sub);

          var data = loadData();
          var streakInfo = el('p', 'grounding-complete-streak', 'Серия: ' + data.streak + ' ' + getDayWord(data.streak));
          complete.appendChild(streakInfo);

          var backBtn = el('button', 'practice-back-btn', 'Назад');
          backBtn.addEventListener('click', function() { window.closePractice(); });
          complete.appendChild(backBtn);

          body.appendChild(complete);
        } else {
          renderStep();
        }
      });
      container.appendChild(nextBtn);

      body.appendChild(container);

      // Focus first input
      var firstInput = container.querySelector('.grounding-input');
      if (firstInput) {
        setTimeout(function() { firstInput.focus(); }, 100);
      }
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
    // Expose global API
    window.openPractice = openPractice;
    window.closePractice = closePractice;

    // Load data and display streak
    var data = loadData();

    // Validate streak continuity on load
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

    // Close button inside practice view (if exists)
    var closeBtn = document.querySelector('#practice-view .practice-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closePractice);
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

    // Sync from Supabase on load
    if (window.SupabaseClient && typeof window.SupabaseClient.get === 'function') {
      try {
        var result = window.SupabaseClient.get(STORAGE_KEY);
        if (result && typeof result.then === 'function') {
          result.then(function(remoteData) {
            if (remoteData && remoteData.entries && Array.isArray(remoteData.entries)) {
              var local = loadData();
              // Use whichever dataset is richer
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

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
