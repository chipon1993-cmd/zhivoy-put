/**
 * Stats Page — Analytics & Insights
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

  function getDayWord(n) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 19) return 'дней';
    if (mod10 === 1) return 'день';
    if (mod10 >= 2 && mod10 <= 4) return 'дня';
    return 'дней';
  }

  var practiceNames = {
    'box-breathing': { name: 'Дыхание', icon: '🫁' },
    'holotropic': { name: 'Холотропное', icon: '🌀' },
    'focus': { name: 'Фокус', icon: '🔴' },
    'meditation': { name: 'Медитация', icon: '🧘' },
    'grounding': { name: 'Заземление', icon: '🌍' },
    'checkin': { name: 'Чекин', icon: '📝' }
  };

  var moodValues = { heavy: 1, anxious: 2, fog: 3, spark: 4, calm: 5 };
  var moodLabels = { heavy: 'Тяжело', anxious: 'Тревожно', fog: 'Туман', spark: 'Искра', calm: 'Спокойствие' };
  var moodEmojis = { heavy: '🪨', anxious: '⚡', fog: '🌫️', spark: '✨', calm: '🌊' };

  function getStats(data, days) {
    var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    var cutoffStr = cutoff.toISOString().slice(0, 10);

    var practices = (data.practiceLog || []).filter(function(p) {
      return p.date && p.date.slice(0, 10) >= cutoffStr;
    });
    var entries = (data.entries || []).filter(function(e) {
      return e.date && e.date.slice(0, 10) >= cutoffStr;
    });

    var totalPractices = practices.length;
    var totalMinutes = Math.round(practices.reduce(function(s, p) { return s + (p.duration || 0); }, 0) / 60);
    var totalCheckins = entries.length;

    // Practice frequency
    var freq = {};
    practices.forEach(function(p) {
      freq[p.practice] = (freq[p.practice] || 0) + 1;
    });

    // Most practiced
    var mostPracticed = null;
    var maxCount = 0;
    Object.keys(freq).forEach(function(k) {
      if (freq[k] > maxCount) { maxCount = freq[k]; mostPracticed = k; }
    });

    // Best streak (from all time)
    var bestStreak = data.streak || 0;
    // Calculate actual best streak from practice log
    var allDates = {};
    (data.practiceLog || []).forEach(function(p) {
      if (p.date) allDates[p.date.slice(0, 10)] = true;
    });
    (data.entries || []).forEach(function(e) {
      if (e.date) allDates[e.date.slice(0, 10)] = true;
    });
    var sortedDates = Object.keys(allDates).sort();
    var currentStreak = 1;
    for (var i = 1; i < sortedDates.length; i++) {
      var prev = new Date(sortedDates[i - 1]);
      var curr = new Date(sortedDates[i]);
      var diff = (curr - prev) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        currentStreak++;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
      } else {
        currentStreak = 1;
      }
    }

    // Average mood
    var moodSum = 0;
    var moodCount = 0;
    entries.forEach(function(e) {
      if (e.mood && moodValues[e.mood]) { moodSum += moodValues[e.mood]; moodCount++; }
    });
    var avgMood = moodCount > 0 ? (moodSum / moodCount).toFixed(1) : '—';

    return {
      totalPractices: totalPractices,
      totalMinutes: totalMinutes,
      totalCheckins: totalCheckins,
      bestStreak: bestStreak,
      currentStreak: data.streak || 0,
      frequency: freq,
      mostPracticed: mostPracticed,
      avgMood: avgMood,
      entries: entries,
      practices: practices
    };
  }

  function getMoodHistory(data, days) {
    var result = [];
    for (var i = days - 1; i >= 0; i--) {
      var date = new Date();
      date.setDate(date.getDate() - i);
      var dateStr = date.toISOString().slice(0, 10);
      var dayEntries = (data.entries || []).filter(function(e) {
        return e.date && e.date.slice(0, 10) === dateStr;
      });
      var day = date.toLocaleDateString('ru', { weekday: 'short' });
      var dayNum = date.getDate();
      if (dayEntries.length > 0) {
        var lastEntry = dayEntries[dayEntries.length - 1];
        result.push({ date: dateStr, day: day, dayNum: dayNum, value: moodValues[lastEntry.mood] || 3, mood: lastEntry.mood });
      } else {
        result.push({ date: dateStr, day: day, dayNum: dayNum, value: null, mood: null });
      }
    }
    return result;
  }

  function renderMoodChart(moodHistory) {
    var width = 500;
    var height = 140;
    var points = moodHistory.filter(function(m) { return m.value !== null; });

    if (points.length < 2) {
      return '<div class="mood-chart-empty">Недостаточно данных. Делайте чекины каждый день!</div>';
    }

    var step = width / (moodHistory.length - 1);
    var pathPoints = [];
    var dots = '';
    var labels = '';

    moodHistory.forEach(function(m, i) {
      var x = i * step;
      // Day label at bottom
      if (i % Math.ceil(moodHistory.length / 10) === 0 || moodHistory.length <= 10) {
        labels += '<text x="' + x + '" y="' + (height - 2) + '" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="9">' + m.dayNum + '</text>';
      }
      if (m.value !== null) {
        var y = (height - 30) - ((m.value - 1) / 4) * (height - 50);
        pathPoints.push({ x: x, y: y });
        var moodColor = m.value >= 4 ? 'var(--green)' : m.value <= 2 ? 'var(--red)' : 'var(--gold)';
        dots += '<circle cx="' + x + '" cy="' + y + '" r="5" fill="' + moodColor + '" opacity="0.9"/>';
        dots += '<circle cx="' + x + '" cy="' + y + '" r="8" fill="' + moodColor + '" opacity="0.15"/>';
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

    var fillD = pathD + ' L' + pathPoints[pathPoints.length - 1].x + ',' + (height - 25) + ' L' + pathPoints[0].x + ',' + (height - 25) + ' Z';

    // Y-axis labels
    var yLabels = '';
    var yLabelValues = [
      { val: 5, text: '🌊' },
      { val: 3, text: '🌫️' },
      { val: 1, text: '🪨' }
    ];
    yLabelValues.forEach(function(yl) {
      var y = (height - 30) - ((yl.val - 1) / 4) * (height - 50);
      yLabels += '<text x="-5" y="' + (y + 4) + '" text-anchor="end" font-size="11">' + yl.text + '</text>';
      yLabels += '<line x1="0" y1="' + y + '" x2="' + width + '" y2="' + y + '" stroke="rgba(255,255,255,0.04)" stroke-dasharray="4"/>';
    });

    return '<svg viewBox="-25 0 ' + (width + 30) + ' ' + height + '" preserveAspectRatio="none" style="width:100%;height:100%">' +
      '<defs><linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="var(--gold)" stop-opacity="0.15"/>' +
      '<stop offset="100%" stop-color="var(--gold)" stop-opacity="0"/>' +
      '</linearGradient></defs>' +
      yLabels +
      '<path d="' + fillD + '" fill="url(#moodGrad)"/>' +
      '<path d="' + pathD + '" fill="none" stroke="var(--gold)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      dots + labels +
      '</svg>';
  }

  function renderLayerChart(freq) {
    var layers = [
      { practice: 'grounding', name: 'Тело' },
      { practice: 'box-breathing', name: 'Пауза' },
      { practice: 'checkin', name: 'Называние' },
      { practice: 'focus', name: 'Замедление' },
      { practice: 'meditation', name: 'Сложность' },
      { practice: 'holotropic', name: 'Глубина' }
    ];

    var cx = 150, cy = 130, radius = 90;
    var n = layers.length;
    var maxVal = 1;
    layers.forEach(function(l) {
      var v = freq[l.practice] || 0;
      if (v > maxVal) maxVal = v;
    });

    // Draw hex grid (3 levels)
    var gridLines = '';
    [0.33, 0.66, 1.0].forEach(function(scale) {
      var points = [];
      for (var i = 0; i < n; i++) {
        var angle = (Math.PI * 2 * i / n) - Math.PI / 2;
        points.push((cx + radius * scale * Math.cos(angle)).toFixed(1) + ',' + (cy + radius * scale * Math.sin(angle)).toFixed(1));
      }
      gridLines += '<polygon points="' + points.join(' ') + '" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>';
    });

    // Axis lines
    var axes = '';
    for (var i = 0; i < n; i++) {
      var angle = (Math.PI * 2 * i / n) - Math.PI / 2;
      var x2 = cx + radius * Math.cos(angle);
      var y2 = cy + radius * Math.sin(angle);
      axes += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>';
    }

    // Data polygon
    var dataPoints = [];
    layers.forEach(function(l, i) {
      var val = (freq[l.practice] || 0) / maxVal;
      val = Math.max(val, 0.08); // minimum visibility
      var angle = (Math.PI * 2 * i / n) - Math.PI / 2;
      var x = cx + radius * val * Math.cos(angle);
      var y = cy + radius * val * Math.sin(angle);
      dataPoints.push(x.toFixed(1) + ',' + y.toFixed(1));
    });

    // Labels
    var labels = '';
    layers.forEach(function(l, i) {
      var angle = (Math.PI * 2 * i / n) - Math.PI / 2;
      var lx = cx + (radius + 25) * Math.cos(angle);
      var ly = cy + (radius + 25) * Math.sin(angle);
      var count = freq[l.practice] || 0;
      var anchor = 'middle';
      if (Math.cos(angle) < -0.3) anchor = 'end';
      if (Math.cos(angle) > 0.3) anchor = 'start';
      labels += '<text x="' + lx.toFixed(1) + '" y="' + (ly + 4).toFixed(1) + '" text-anchor="' + anchor + '" fill="rgba(255,255,255,0.5)" font-size="11">' + l.name + '</text>';
      if (count > 0) {
        labels += '<text x="' + lx.toFixed(1) + '" y="' + (ly + 17).toFixed(1) + '" text-anchor="' + anchor + '" fill="rgba(242,201,109,0.6)" font-size="10">' + count + '</text>';
      }
    });

    return '<svg viewBox="0 0 300 270" style="width:100%;max-width:300px;margin:0 auto;display:block;">' +
      gridLines + axes +
      '<polygon points="' + dataPoints.join(' ') + '" fill="rgba(242,201,109,0.12)" stroke="var(--gold)" stroke-width="2" stroke-linejoin="round"/>' +
      labels +
      '</svg>';
  }

  function renderPracticeBars(freq) {
    var keys = Object.keys(practiceNames);
    var maxVal = 1;
    keys.forEach(function(k) { if ((freq[k] || 0) > maxVal) maxVal = freq[k]; });

    var html = '<div class="practice-bars">';
    keys.forEach(function(k) {
      var count = freq[k] || 0;
      var heightPct = maxVal > 0 ? (count / maxVal) * 100 : 0;
      html += '<div class="practice-bar-item">';
      html += '<div class="practice-bar-count">' + count + '</div>';
      html += '<div class="practice-bar" style="height:' + Math.max(4, heightPct) + '%"></div>';
      html += '<div class="practice-bar-label">' + practiceNames[k].icon + '</div>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  // State
  var currentPeriod = 7;

  function render() {
    var container = document.getElementById('stats-content');
    if (!container) return;

    var data = loadData();
    var stats = getStats(data, currentPeriod);
    var moodHistory = getMoodHistory(data, currentPeriod);

    var html = '';

    // Header
    html += '<div class="app-header">';
    html += '<h1>Наблюдение</h1>';
    html += '<p>Не оценка — отражение. Что происходит в твоей практике.</p>';
    html += '</div>';

    // Overview stats
    html += '<div class="stats-row">';
    html += '<div class="stat-card"><div class="stat-card-value gold">' + stats.currentStreak + '</div><div class="stat-card-label">серия ' + getDayWord(stats.currentStreak) + '</div></div>';
    html += '<div class="stat-card"><div class="stat-card-value blue">' + stats.totalPractices + '</div><div class="stat-card-label">практик</div></div>';
    html += '<div class="stat-card"><div class="stat-card-value green">' + stats.totalMinutes + '</div><div class="stat-card-label">минут</div></div>';
    html += '<div class="stat-card"><div class="stat-card-value">' + stats.avgMood + '</div><div class="stat-card-label">ср. настроение</div></div>';
    html += '</div>';

    // Mood chart
    html += '<div class="chart-card">';
    html += '<div class="chart-card-header">';
    html += '<div class="chart-card-title">Настроение</div>';
    html += '<div class="chart-period-btns">';
    html += '<button class="chart-period-btn' + (currentPeriod === 7 ? ' active' : '') + '" data-period="7">7д</button>';
    html += '<button class="chart-period-btn' + (currentPeriod === 14 ? ' active' : '') + '" data-period="14">14д</button>';
    html += '<button class="chart-period-btn' + (currentPeriod === 30 ? ' active' : '') + '" data-period="30">30д</button>';
    html += '</div></div>';
    html += '<div class="mood-chart">' + renderMoodChart(moodHistory) + '</div>';
    html += '</div>';

    // Layer chart (Spiral layers)
    html += '<div class="chart-card">';
    html += '<div class="chart-card-header">';
    html += '<div class="chart-card-title">Слои практики</div>';
    html += '</div>';
    html += '<div style="padding:10px 0;">' + renderLayerChart(stats.frequency) + '</div>';
    html += '</div>';

    // Practice frequency
    html += '<div class="chart-card">';
    html += '<div class="chart-card-header">';
    html += '<div class="chart-card-title">Практики за период</div>';
    html += '</div>';
    html += renderPracticeBars(stats.frequency);
    html += '</div>';

    // Insights
    html += '<div class="app-section-title">Наблюдения</div>';
    html += '<div class="chart-card">';
    if (stats.mostPracticed && practiceNames[stats.mostPracticed]) {
      html += '<p style="font-size:14px;color:var(--text);margin-bottom:8px;">' + practiceNames[stats.mostPracticed].icon + ' Чаще всего: <strong>' + practiceNames[stats.mostPracticed].name + '</strong></p>';
    }
    if (stats.bestStreak > 0) {
      html += '<p style="font-size:14px;color:var(--muted);">🔄 Самая длинная серия: ' + stats.bestStreak + ' ' + getDayWord(stats.bestStreak) + '</p>';
    }
    if (stats.totalPractices === 0) {
      html += '<p style="font-size:14px;color:var(--muted);">Начните практиковать, и здесь появятся ваши данные</p>';
    }
    html += '</div>';

    container.innerHTML = html;

    // Bind period buttons
    container.querySelectorAll('.chart-period-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        currentPeriod = parseInt(btn.getAttribute('data-period'));
        render();
      });
    });
  }

  // Page styles
  var style = document.createElement('style');
  style.textContent = '.stats-page { max-width: 600px; margin: 0 auto; padding: 1rem 1.5rem 2rem; }';
  document.head.appendChild(style);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
