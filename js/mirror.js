/**
 * Mirror (Зеркало) — Reflection & Self-Awareness page
 * Shows inner weather, weekly practice map, daily question, and timeline
 */
(function() {
  'use strict';

  var STORAGE_KEY = 'navigator_data';

  var layers = {
    'grounding':      { name: 'Тело',        color: '#8FE0B6' },
    'box-breathing':  { name: 'Пауза',       color: '#81C7FF' },
    'checkin':        { name: 'Называние',    color: '#F2C96D' },
    'focus':          { name: 'Замедление',   color: '#FF6464' },
    'meditation':     { name: 'Сложность',    color: '#C864FF' },
    'holotropic':     { name: 'Глубина',      color: '#FF8C42' }
  };

  var weatherMap = {
    heavy:   { emoji: '🌧️', label: 'Тяжёлая облачность' },
    anxious: { emoji: '⛈️', label: 'Гроза' },
    fog:     { emoji: '🌫️', label: 'Туман' },
    spark:   { emoji: '⛅', label: 'Прояснение' },
    calm:    { emoji: '☀️', label: 'Ясно' }
  };

  var questions = [
    'Что твоё тело знает сегодня, о чём ты ещё не думал?',
    'Где сейчас в тебе реактивность — и нужна ли ей пауза?',
    'Какую среду ты сегодня создаёшь вокруг себя?',
    'Что из того, что ты понял, ещё не превратилось в действие?',
    'Кто сегодня держит с тобой общую реальность?',
    'Какой слой среды сейчас на тебя давит сильнее всего?',
    'Что ты сегодня сделал, что поддерживает твой дом?',
    'Где граница между твоей усталостью и ленью?',
    'Какое чувство ты сегодня не назвал?',
    'Что в тебе сейчас просит замедления?',
    'Какая из твоих сред сейчас истончается?',
    'Что ты откладываешь не из страха, а из мудрости?',
    'Кому ты сегодня позволил быть рядом?',
    'Какую сложность ты сегодня удержал, не упрощая?'
  ];

  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { entries: [], streak: 0, lastDate: null, practiceLog: [] };
  }

  function getTodayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function getDayOfYear() {
    var now = new Date();
    var start = new Date(now.getFullYear(), 0, 0);
    var diff = now - start;
    var oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  function getDayWord(n) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 19) return 'дней';
    if (mod10 === 1) return 'день';
    if (mod10 >= 2 && mod10 <= 4) return 'дня';
    return 'дней';
  }

  // ─── 1. Current State (Weather) ───
  function getWeather(data) {
    var entries = data.entries || [];
    if (entries.length === 0) {
      return { emoji: '🌙', label: 'Нет данных', mood: 'none' };
    }
    // Find last entry
    var last = entries[entries.length - 1];
    var mood = last.mood;
    var w = weatherMap[mood];
    if (w) {
      return { emoji: w.emoji, label: w.label, mood: mood };
    }
    return { emoji: '🌙', label: 'Нет данных', mood: 'none' };
  }

  function renderWeather(weather) {
    var html = '';
    html += '<div class="mirror-section-title mirror-fade-in">Внутренняя погода</div>';
    html += '<div class="weather-card mirror-fade-in" data-weather="' + weather.mood + '">';
    html += '<span class="weather-emoji">' + weather.emoji + '</span>';
    html += '<div class="weather-label">' + weather.label + '</div>';
    html += '<div class="weather-sublabel">По последнему чекину</div>';
    html += '</div>';
    return html;
  }

  // ─── 2. Weekly Practice Map ───
  function getWeekPractices(data) {
    var week = [];
    var practiceLog = data.practiceLog || [];

    for (var i = 6; i >= 0; i--) {
      var date = new Date();
      date.setDate(date.getDate() - i);
      var dateStr = date.toISOString().slice(0, 10);
      var dayLabel = date.toLocaleDateString('ru', { weekday: 'short' });
      var isToday = (i === 0);

      // Find which practices were done this day
      var dayPractices = practiceLog.filter(function(p) {
        return p.date && p.date.slice(0, 10) === dateStr;
      });

      // Collect unique practice IDs for this day
      var practiceIds = {};
      dayPractices.forEach(function(p) {
        if (p.practice && layers[p.practice]) {
          practiceIds[p.practice] = true;
        }
      });

      week.push({
        dateStr: dateStr,
        dayLabel: dayLabel,
        isToday: isToday,
        practices: Object.keys(practiceIds)
      });
    }
    return week;
  }

  function renderLayerGrid(weekData) {
    var html = '';
    html += '<div class="mirror-section-title mirror-fade-in">Карта практик за неделю</div>';
    html += '<div class="layer-grid-card mirror-fade-in">';

    var hasAny = weekData.some(function(d) { return d.practices.length > 0; });

    if (!hasAny) {
      html += '<div class="layer-grid">';
      html += '<div class="layer-grid-empty">Практик пока нет — начните с навигатора</div>';
      html += '</div>';
    } else {
      html += '<div class="layer-grid">';
      weekData.forEach(function(day) {
        var todayClass = day.isToday ? ' today' : '';
        html += '<div class="layer-grid-day">';
        html += '<div class="layer-grid-day-label' + todayClass + '">' + day.dayLabel + '</div>';
        html += '<div class="layer-dots">';

        // Render dots for practiced layers (in a consistent order)
        var layerKeys = ['grounding', 'box-breathing', 'checkin', 'focus', 'meditation', 'holotropic'];
        layerKeys.forEach(function(key) {
          if (day.practices.indexOf(key) !== -1) {
            var layer = layers[key];
            html += '<div class="layer-dot" style="background: ' + layer.color + '; box-shadow: 0 0 8px ' + layer.color + '40;" title="' + layer.name + '"></div>';
          }
        });

        html += '</div>'; // layer-dots
        html += '</div>'; // layer-grid-day
      });
      html += '</div>'; // layer-grid
    }

    // Legend
    html += '<div class="layer-legend">';
    var layerKeys = ['grounding', 'box-breathing', 'checkin', 'focus', 'meditation', 'holotropic'];
    layerKeys.forEach(function(key) {
      var layer = layers[key];
      html += '<div class="layer-legend-item">';
      html += '<span class="layer-legend-dot" style="background: ' + layer.color + ';"></span>';
      html += '<span>' + layer.name + '</span>';
      html += '</div>';
    });
    html += '</div>';

    html += '</div>'; // layer-grid-card
    return html;
  }

  // ─── 3. Daily Question ───
  function getDailyQuestion() {
    var dayOfYear = getDayOfYear();
    var index = dayOfYear % questions.length;
    return questions[index];
  }

  function renderQuestion(question) {
    var html = '';
    html += '<div class="mirror-section-title mirror-fade-in">Вопрос дня</div>';
    html += '<div class="question-card mirror-fade-in">';
    html += '<div class="question-label">Для размышления</div>';
    html += '<div class="question-text">' + question + '</div>';
    html += '</div>';
    return html;
  }

  // ─── 4. Timeline ───
  function getDaysSinceFirst(data) {
    var entries = data.entries || [];
    var practiceLog = data.practiceLog || [];

    // Find earliest date across entries and practiceLog
    var earliest = null;

    entries.forEach(function(e) {
      if (e.date) {
        var d = new Date(e.date);
        if (!earliest || d < earliest) earliest = d;
      }
    });

    practiceLog.forEach(function(p) {
      if (p.date) {
        var d = new Date(p.date);
        if (!earliest || d < earliest) earliest = d;
      }
    });

    if (!earliest) return null;

    var now = new Date();
    var diffMs = now - earliest;
    var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 0);
  }

  function renderSpiralSVG() {
    // Generate a simple spiral path for the subtle background animation
    var points = [];
    var turns = 4;
    var steps = 100;
    for (var i = 0; i <= steps; i++) {
      var t = (i / steps) * turns * 2 * Math.PI;
      var r = 10 + (i / steps) * 70;
      var x = 90 + r * Math.cos(t);
      var y = 90 + r * Math.sin(t);
      points.push((i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1));
    }
    return '<svg class="timeline-spiral" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="' + points.join(' ') + '" fill="none" stroke="' + 'var(--gold)' + '" stroke-width="1.5" stroke-linecap="round" opacity="1"/>' +
      '</svg>';
  }

  function renderTimeline(days) {
    var html = '';
    html += '<div class="mirror-section-title mirror-fade-in">Мой путь</div>';
    html += '<div class="timeline-card mirror-fade-in">';
    html += renderSpiralSVG();

    if (days !== null) {
      html += '<div class="timeline-number">' + days + '</div>';
      html += '<div class="timeline-unit">' + getDayWord(days) + ' на пути</div>';
      html += '<div class="timeline-sub">Не прогресс — просто время</div>';
    } else {
      html += '<div class="timeline-number">0</div>';
      html += '<div class="timeline-unit">Начало пути</div>';
      html += '<div class="timeline-sub">Сделайте первый чекин</div>';
    }

    html += '</div>';
    return html;
  }

  // ─── Main Render ───
  function render() {
    var container = document.getElementById('mirror-content');
    if (!container) return;

    var data = loadData();
    var weather = getWeather(data);
    var weekData = getWeekPractices(data);
    var question = getDailyQuestion();
    var days = getDaysSinceFirst(data);

    var html = '';

    // Page header
    html += '<div class="app-header mirror-fade-in">';
    html += '<h1>Зеркало</h1>';
    html += '<p>Взгляд внутрь</p>';
    html += '</div>';

    // 1. Weather
    html += renderWeather(weather);

    // 2. Weekly practice map
    html += renderLayerGrid(weekData);

    // 3. Daily question
    html += renderQuestion(question);

    // 4. Timeline
    html += renderTimeline(days);

    container.innerHTML = html;
  }

  // Inject page max-width style
  var style = document.createElement('style');
  style.textContent = '.mirror-page { max-width: 600px; margin: 0 auto; padding: 1rem 1.5rem 2rem; }';
  document.head.appendChild(style);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
