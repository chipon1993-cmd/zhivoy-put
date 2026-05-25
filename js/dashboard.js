/**
 * Dashboard — Home screen with today's progress, recommendation, and mini stats
 */
(function() {
  'use strict';

  var STORAGE_KEY = 'navigator_data';

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

  function getDayWord(n) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 19) return 'дней';
    if (mod10 === 1) return 'день';
    if (mod10 >= 2 && mod10 <= 4) return 'дня';
    return 'дней';
  }

  function getGreeting() {
    var h = new Date().getHours();
    var greeting = '';
    if (h < 6) greeting = 'Доброй ночи';
    else if (h < 12) greeting = 'Доброе утро';
    else if (h < 18) greeting = 'Добрый день';
    else greeting = 'Добрый вечер';
    return greeting;
  }

  function getPhilosophy(data) {
    var streak = data.streak || 0;
    var today = getTodayStr();
    var hasCheckin = (data.entries || []).some(function(e) {
      return e.date && e.date.slice(0, 10) === today;
    });
    var todayPractices = (data.practiceLog || []).filter(function(p) {
      return p.date && p.date.slice(0, 10) === today;
    });

    // Context-sensitive philosophical messages
    if (streak === 0 && todayPractices.length === 0) {
      return 'Возвращение — это и есть зрелость. Начни с одного шага.';
    }
    if (streak === 1) {
      return 'Первый день. Дом строится маленькими действиями.';
    }
    if (streak > 0 && streak < 7) {
      return streak + ' ' + getDayWord(streak) + ' подряд. Дом не истончается.';
    }
    if (streak >= 7 && streak < 21) {
      return 'Спираль крутится. Ты уже не тот, что ' + streak + ' дней назад.';
    }
    if (streak >= 21) {
      return 'Полный виток спирали. Тело помнит путь.';
    }
    if (!hasCheckin) {
      return 'Тело уже проснулось. Что оно знает сегодня?';
    }
    return 'Каждое маленькое действие — это твой дом.';
  }

  function getRecommendation(data) {
    var today = getTodayStr();
    var todayEntries = (data.entries || []).filter(function(e) {
      return e.date && e.date.slice(0, 10) === today;
    });
    var todayPractices = (data.practiceLog || []).filter(function(p) {
      return p.date && p.date.slice(0, 10) === today;
    });

    if (todayEntries.length === 0) {
      return {
        icon: '📝',
        title: 'Ежедневный чекин',
        desc: 'Назови то, что чувствуешь — это первый шаг к паузе',
        practice: 'checkin'
      };
    }

    var lastMood = todayEntries[todayEntries.length - 1].mood;
    if (lastMood === 'anxious' || lastMood === 'heavy') {
      return {
        icon: '🌍',
        title: 'Заземление',
        desc: 'Тело знает раньше слова. Вернись в него через 5 чувств',
        practice: 'grounding'
      };
    }
    if (lastMood === 'fog') {
      return {
        icon: '🫁',
        title: 'Бокс-дыхание',
        desc: 'Между стимулом и реакцией есть пауза. Дыхание — путь к ней',
        practice: 'box-breathing'
      };
    }
    if (lastMood === 'calm' || lastMood === 'spark') {
      return {
        icon: '🧘',
        title: 'Медитация',
        desc: 'Удержание сложности без упрощения. Хорошее время для глубины',
        practice: 'meditation'
      };
    }

    if (todayPractices.length === 0) {
      return {
        icon: '🌍',
        title: 'Заземление',
        desc: 'Тело — первый дом. Вернись в настоящий момент',
        practice: 'grounding'
      };
    }

    return {
      icon: '🧘',
      title: 'Медитация',
      desc: 'Наблюдение без редактирования. Позволь всему быть',
      practice: 'meditation'
    };
  }

  function getTodayStats(data) {
    var today = getTodayStr();
    var todayPractices = (data.practiceLog || []).filter(function(p) {
      return p.date && p.date.slice(0, 10) === today;
    });
    var todayTime = todayPractices.reduce(function(sum, p) { return sum + (p.duration || 0); }, 0);
    var hasCheckin = (data.entries || []).some(function(e) {
      return e.date && e.date.slice(0, 10) === today;
    });

    return {
      practiceCount: todayPractices.length,
      totalMinutes: Math.round(todayTime / 60),
      hasCheckin: hasCheckin,
      streak: data.streak || 0
    };
  }

  function getMoodHistory(data, days) {
    var result = [];
    var moodValues = { heavy: 1, anxious: 2, fog: 3, spark: 4, calm: 5 };

    for (var i = days - 1; i >= 0; i--) {
      var date = new Date();
      date.setDate(date.getDate() - i);
      var dateStr = date.toISOString().slice(0, 10);

      var dayEntries = (data.entries || []).filter(function(e) {
        return e.date && e.date.slice(0, 10) === dateStr;
      });

      if (dayEntries.length > 0) {
        var lastEntry = dayEntries[dayEntries.length - 1];
        result.push({
          date: dateStr,
          day: date.toLocaleDateString('ru', { weekday: 'short' }),
          value: moodValues[lastEntry.mood] || 3,
          mood: lastEntry.mood
        });
      } else {
        result.push({
          date: dateStr,
          day: date.toLocaleDateString('ru', { weekday: 'short' }),
          value: null,
          mood: null
        });
      }
    }
    return result;
  }

  function renderMiniChart(moodHistory) {
    var width = 300;
    var height = 80;
    var points = moodHistory.filter(function(m) { return m.value !== null; });

    if (points.length < 2) {
      return '<div class="mood-chart-empty">Нужно минимум 2 чекина для графика</div>';
    }

    var step = width / (moodHistory.length - 1);
    var pathPoints = [];
    var dots = '';

    moodHistory.forEach(function(m, i) {
      if (m.value !== null) {
        var x = i * step;
        var y = height - ((m.value - 1) / 4) * (height - 20) - 10;
        pathPoints.push({ x: x, y: y });
        dots += '<circle cx="' + x + '" cy="' + y + '" r="4" fill="var(--gold)" opacity="0.8"/>';
      }
    });

    // Build smooth path
    var pathD = 'M' + pathPoints[0].x + ',' + pathPoints[0].y;
    for (var i = 1; i < pathPoints.length; i++) {
      var prev = pathPoints[i - 1];
      var curr = pathPoints[i];
      var cpx = (prev.x + curr.x) / 2;
      pathD += ' C' + cpx + ',' + prev.y + ' ' + cpx + ',' + curr.y + ' ' + curr.x + ',' + curr.y;
    }

    // Gradient fill path
    var fillD = pathD + ' L' + pathPoints[pathPoints.length - 1].x + ',' + height + ' L' + pathPoints[0].x + ',' + height + ' Z';

    return '<svg viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none">' +
      '<defs><linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="var(--gold)" stop-opacity="0.2"/>' +
      '<stop offset="100%" stop-color="var(--gold)" stop-opacity="0"/>' +
      '</linearGradient></defs>' +
      '<path d="' + fillD + '" fill="url(#chartGrad)"/>' +
      '<path d="' + pathD + '" fill="none" stroke="var(--gold)" stroke-width="2" stroke-linecap="round"/>' +
      dots +
      '</svg>';
  }

  function render() {
    var container = document.getElementById('dashboard-content');
    if (!container) return;

    var data = loadData();
    var stats = getTodayStats(data);
    var recommendation = getRecommendation(data);
    var moodHistory = getMoodHistory(data, 7);

    var html = '';

    // Greeting
    html += '<div class="app-header">';
    html += '<h1>' + getGreeting() + '</h1>';
    html += '<p class="philosophy-text">' + getPhilosophy(data) + '</p>';
    html += '</div>';

    // Today's stats row
    html += '<div class="stats-row">';
    html += '<div class="stat-card"><div class="stat-card-value gold">' + stats.streak + '</div><div class="stat-card-label">' + getDayWord(stats.streak) + ' подряд</div></div>';
    html += '<div class="stat-card"><div class="stat-card-value blue">' + stats.practiceCount + '</div><div class="stat-card-label">практик сегодня</div></div>';
    html += '<div class="stat-card"><div class="stat-card-value green">' + stats.totalMinutes + '</div><div class="stat-card-label">минут</div></div>';
    html += '</div>';

    // Recommendation
    html += '<div class="app-section-title">Рекомендация</div>';
    html += '<div class="recommendation-card" onclick="location.href=\'navigator.html\'" data-practice="' + recommendation.practice + '">';
    html += '<div class="recommendation-label">Тело подсказывает</div>';
    html += '<div class="recommendation-content">';
    html += '<div class="recommendation-icon">' + recommendation.icon + '</div>';
    html += '<div class="recommendation-info">';
    html += '<div class="recommendation-title">' + recommendation.title + '</div>';
    html += '<div class="recommendation-desc">' + recommendation.desc + '</div>';
    html += '</div></div></div>';

    // Mood mini chart
    html += '<div class="app-section-title">Настроение за неделю</div>';
    html += '<div class="chart-card">';
    html += '<div class="mood-chart">' + renderMiniChart(moodHistory) + '</div>';
    html += '</div>';

    // Quick actions
    html += '<div class="app-section-title">Быстрые действия</div>';
    html += '<div class="quick-actions">';
    html += '<a href="navigator.html" class="quick-action"><span class="quick-action-icon">📝</span><span class="quick-action-text">Чекин</span></a>';
    html += '<a href="navigator.html" class="quick-action"><span class="quick-action-icon">🫁</span><span class="quick-action-text">Дыхание</span></a>';
    html += '<a href="programs.html" class="quick-action"><span class="quick-action-icon">🌀</span><span class="quick-action-text">Спирали</span></a>';
    html += '<a href="stats.html" class="quick-action"><span class="quick-action-icon">📊</span><span class="quick-action-text">Статистика</span></a>';
    html += '</div>';

    container.innerHTML = html;

    // Bind recommendation card to open practice
    var recCard = container.querySelector('.recommendation-card');
    if (recCard) {
      recCard.addEventListener('click', function(e) {
        e.preventDefault();
        var practice = recCard.getAttribute('data-practice');
        window.location.href = 'navigator.html#' + practice;
      });
    }
  }

  // Dashboard page styles
  var style = document.createElement('style');
  style.textContent = '.dashboard-page { max-width: 600px; margin: 0 auto; padding: 1rem 1.5rem 2rem; } .philosophy-text { font-style: italic; color: rgba(242,201,109,0.7); font-size: 13px; }';
  document.head.appendChild(style);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
