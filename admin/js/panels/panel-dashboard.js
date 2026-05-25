/* panel-dashboard.js — Analytics Dashboard with Chart.js */
(function() {
  'use strict';

  // ─── Constants ──────────────────────────────────────────────────────────────

  var MOOD_LABELS = {
    heavy: 'Тяжесть',
    anxious: 'Гроза',
    fog: 'Туман',
    spark: 'Прояснение',
    calm: 'Ясно'
  };

  var MOOD_COLORS = {
    heavy: '#81c7ff',
    anxious: '#caa8ff',
    fog: '#a8a196',
    spark: '#8ff0b6',
    calm: '#f2c96d'
  };

  var PRACTICE_LABELS = {
    'checkin': 'Чекин',
    'grounding': 'Заземление',
    'box-breathing': 'Бокс-дыхание',
    'focus': 'Фокус',
    'meditation': 'Медитация',
    'holotropic': 'Холотропное'
  };

  var PRACTICE_IDS = Object.keys(PRACTICE_LABELS);

  // Dark theme defaults for Chart.js
  var GRID_COLOR = 'rgba(255,255,255,0.06)';
  var TICK_COLOR = 'rgba(255,255,255,0.5)';
  var GOLD = '#f2c96d';
  var GOLD_END = '#ffae55';

  // ─── Panel Registration ─────────────────────────────────────────────────────

  AdminRouter.register('dashboard', {
    section: 'site',
    title: 'Аналитика',
    icon: '📊',
    render: renderDashboard
  });

  // ─── Main Render ────────────────────────────────────────────────────────────

  function renderDashboard(container) {
    var data = loadData();

    // If no data at all, show empty state alert
    if (!data.entries.length && !data.practiceLog.length) {
      container.appendChild(
        AdminUI.alert('info', 'Нет данных. Начните практиковать, чтобы увидеть аналитику.')
      );
      return;
    }

    // 1. Practices bar chart (last 30 days)
    container.appendChild(buildPracticesCard(data));

    // 2. Mood doughnut chart
    container.appendChild(buildMoodCard(data));

    // 3. Activity line chart (last 14 days)
    container.appendChild(buildActivityCard(data));

    // 4. Stats summary card
    container.appendChild(buildStatsCard(data));
  }

  // ─── Data Loading ───────────────────────────────────────────────────────────

  function loadData() {
    var raw = localStorage.getItem('navigator_data');
    var parsed = raw ? JSON.parse(raw) : {};

    return {
      entries: parsed.entries || [],
      streak: parsed.streak || 0,
      practiceLog: parsed.practiceLog || []
    };
  }

  // ─── Card Builders ──────────────────────────────────────────────────────────

  /**
   * Card 1: Bar chart — practice frequency over last 30 days
   */
  function buildPracticesCard(data) {
    var canvas = createCanvas();
    var wrap = wrapCanvas(canvas);

    var card = AdminUI.card('Практики за 30 дней', [wrap]);

    // Count practices in the last 30 days
    var cutoff = daysAgo(30);
    var counts = {};
    PRACTICE_IDS.forEach(function(id) { counts[id] = 0; });

    data.practiceLog.forEach(function(entry) {
      if (entry.date >= cutoff && counts.hasOwnProperty(entry.practice)) {
        counts[entry.practice]++;
      }
    });

    var labels = PRACTICE_IDS.map(function(id) { return PRACTICE_LABELS[id]; });
    var values = PRACTICE_IDS.map(function(id) { return counts[id]; });

    // Create gradient after canvas is in DOM
    requestAnimationFrame(function() {
      var ctx = canvas.getContext('2d');
      var gradient = ctx.createLinearGradient(0, 0, 0, 280);
      gradient.addColorStop(0, GOLD);
      gradient.addColorStop(1, GOLD_END);

      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            data: values,
            backgroundColor: gradient,
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: chartOptions({
          plugins: { legend: { display: false } },
          scales: darkScales()
        })
      });
    });

    return card;
  }

  /**
   * Card 2: Doughnut chart — mood distribution
   */
  function buildMoodCard(data) {
    var canvas = createCanvas();
    var wrap = wrapCanvas(canvas);

    var card = AdminUI.card('Погода настроений', [wrap]);

    // Count mood occurrences
    var moodKeys = Object.keys(MOOD_LABELS);
    var counts = {};
    moodKeys.forEach(function(k) { counts[k] = 0; });

    data.entries.forEach(function(entry) {
      if (entry.mood && counts.hasOwnProperty(entry.mood)) {
        counts[entry.mood]++;
      }
    });

    var labels = moodKeys.map(function(k) { return MOOD_LABELS[k]; });
    var values = moodKeys.map(function(k) { return counts[k]; });
    var colors = moodKeys.map(function(k) { return MOOD_COLORS[k]; });

    requestAnimationFrame(function() {
      var ctx = canvas.getContext('2d');

      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: values,
            backgroundColor: colors,
            borderWidth: 0,
            hoverOffset: 8
          }]
        },
        options: chartOptions({
          cutout: '60%',
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: TICK_COLOR,
                font: { family: 'Inter', size: 13 },
                padding: 16
              }
            }
          }
        })
      });
    });

    return card;
  }

  /**
   * Card 3: Line chart — daily activity for last 14 days
   */
  function buildActivityCard(data) {
    var canvas = createCanvas();
    var wrap = wrapCanvas(canvas);

    var card = AdminUI.card('Активность по дням', [wrap]);

    // Build array of last 14 days
    var days = [];
    var countsMap = {};
    for (var i = 13; i >= 0; i--) {
      var d = daysAgo(i);
      days.push(d);
      countsMap[d] = 0;
    }

    data.practiceLog.forEach(function(entry) {
      if (countsMap.hasOwnProperty(entry.date)) {
        countsMap[entry.date]++;
      }
    });

    var labels = days.map(function(d) {
      // Format as DD.MM
      var parts = d.split('-');
      return parts[2] + '.' + parts[1];
    });
    var values = days.map(function(d) { return countsMap[d]; });

    requestAnimationFrame(function() {
      var ctx = canvas.getContext('2d');
      var gradient = ctx.createLinearGradient(0, 0, 0, 280);
      gradient.addColorStop(0, 'rgba(242,201,109,0.3)');
      gradient.addColorStop(1, 'rgba(242,201,109,0.02)');

      new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            data: values,
            borderColor: GOLD,
            backgroundColor: gradient,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: GOLD,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: chartOptions({
          plugins: { legend: { display: false } },
          scales: darkScales()
        })
      });
    });

    return card;
  }

  /**
   * Card 4: Stats summary — streak, totals, most frequent practice
   */
  function buildStatsCard(data) {
    var stats = document.createElement('div');
    stats.style.cssText = 'display:grid; grid-template-columns:1fr 1fr; gap:20px; padding:8px 0;';

    // Streak
    stats.appendChild(statBlock(data.streak, 'дней подряд'));

    // Total entries
    stats.appendChild(statBlock(data.entries.length, 'записей'));

    // Total practice sessions
    stats.appendChild(statBlock(data.practiceLog.length, 'практик'));

    // Most frequent practice
    var freq = mostFrequentPractice(data.practiceLog);
    stats.appendChild(statBlock(freq.label, 'топ практика'));

    return AdminUI.card('Текущая серия', [stats]);
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /** Create a canvas element for Chart.js */
  function createCanvas() {
    var canvas = document.createElement('canvas');
    return canvas;
  }

  /** Wrap canvas in a fixed-height container */
  function wrapCanvas(canvas) {
    var div = document.createElement('div');
    div.style.cssText = 'position:relative; height:280px; width:100%;';
    div.appendChild(canvas);
    return div;
  }

  /** Base Chart.js options merged with custom overrides */
  function chartOptions(custom) {
    var base = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { font: { family: 'Inter' } } }
      }
    };
    return deepMerge(base, custom || {});
  }

  /** Dark-themed scale config for bar/line charts */
  function darkScales() {
    return {
      x: {
        grid: { color: GRID_COLOR },
        ticks: { color: TICK_COLOR, font: { family: 'Inter', size: 11 } }
      },
      y: {
        grid: { color: GRID_COLOR },
        ticks: { color: TICK_COLOR, font: { family: 'Inter', size: 11 } },
        beginAtZero: true
      }
    };
  }

  /** Get ISO date string for N days ago */
  function daysAgo(n) {
    var d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  }

  /** Find the most frequently practiced activity */
  function mostFrequentPractice(log) {
    if (!log.length) return { label: '—' };

    var counts = {};
    log.forEach(function(entry) {
      counts[entry.practice] = (counts[entry.practice] || 0) + 1;
    });

    var maxId = Object.keys(counts).reduce(function(a, b) {
      return counts[a] >= counts[b] ? a : b;
    });

    return { label: PRACTICE_LABELS[maxId] || maxId };
  }

  /** Create a stat display block with large number and label */
  function statBlock(value, label) {
    var block = document.createElement('div');
    block.style.cssText = 'text-align:center; padding:16px 8px;';

    var num = document.createElement('div');
    num.style.cssText = 'font-size:2.4rem; font-weight:700; color:#f2c96d; font-family:Inter,sans-serif; line-height:1.2;';
    num.textContent = value;

    var desc = document.createElement('div');
    desc.style.cssText = 'font-size:0.85rem; color:rgba(255,255,255,0.55); margin-top:4px; font-family:Inter,sans-serif;';
    desc.textContent = label;

    block.appendChild(num);
    block.appendChild(desc);
    return block;
  }

  /** Simple deep merge for plain objects */
  function deepMerge(target, source) {
    var result = {};
    Object.keys(target).forEach(function(k) { result[k] = target[k]; });
    Object.keys(source).forEach(function(k) {
      if (
        source[k] && typeof source[k] === 'object' && !Array.isArray(source[k]) &&
        result[k] && typeof result[k] === 'object' && !Array.isArray(result[k])
      ) {
        result[k] = deepMerge(result[k], source[k]);
      } else {
        result[k] = source[k];
      }
    });
    return result;
  }

})();
