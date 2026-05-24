/**
 * navigator-engine.js — Interactive Practice Environment
 * Features: Daily check-in, breathing exercise, journal, streak, mood chart
 * Data persisted to localStorage + Supabase
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'navigator_data';

  /* ─── Data ─── */
  function loadData() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { entries: [], streak: 0, lastDate: null };
    } catch(e) { return { entries: [], streak: 0, lastDate: null }; }
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (window.SupabaseClient && window.SupabaseClient.isConnected()) {
      window.SupabaseClient.set(STORAGE_KEY, data);
    }
  }

  function loadFromCloud() {
    if (window.SupabaseClient && window.SupabaseClient.isConnected()) {
      window.SupabaseClient.get(STORAGE_KEY).then(function(cloud) {
        if (cloud && cloud.entries && cloud.entries.length > 0) {
          var local = loadData();
          if (cloud.entries.length >= local.entries.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cloud));
            initUI();
          }
        }
      });
    }
  }

  /* ─── Streak Logic ─── */
  function updateStreak(data) {
    var today = new Date().toISOString().split('T')[0];
    if (data.lastDate === today) return data;

    var yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (data.lastDate === yesterday) {
      data.streak++;
    } else if (data.lastDate !== today) {
      data.streak = 1;
    }
    data.lastDate = today;
    return data;
  }

  /* ─── Tabs ─── */
  function initTabs() {
    var tabs = document.querySelectorAll('.nav-tab');
    var panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        var target = this.getAttribute('data-tab');
        tabs.forEach(function(t) { t.classList.remove('active'); });
        panels.forEach(function(p) { p.classList.remove('active'); });
        this.classList.add('active');
        document.getElementById('panel-' + target).classList.add('active');
      });
    });
  }

  /* ─── Breathing Exercise ─── */
  var breathInterval = null;
  var breathTimeout = null;
  var breathRunning = false;
  var breathCycles = 0;

  function initBreathing() {
    var btn = document.getElementById('breath-start');
    if (!btn) return;

    btn.addEventListener('click', function() {
      if (breathRunning) {
        stopBreathing();
      } else {
        startBreathing();
      }
    });
  }

  function startBreathing() {
    var circle = document.getElementById('breath-circle');
    var text = document.getElementById('breath-text');
    var timer = document.getElementById('breath-timer');
    var btn = document.getElementById('breath-start');

    breathRunning = true;
    breathCycles = 0;
    btn.textContent = 'Остановить';
    btn.classList.add('active');

    function cycle() {
      if (!breathRunning) return;

      // Inhale 4s
      circle.className = 'breath-circle inhale';
      text.textContent = 'Вдох...';
      timer.textContent = 'Цикл ' + (breathCycles + 1);

      breathTimeout = setTimeout(function() {
        if (!breathRunning) return;
        // Hold 2s
        text.textContent = 'Задержка...';

        breathTimeout = setTimeout(function() {
          if (!breathRunning) return;
          // Exhale 4s
          circle.className = 'breath-circle exhale';
          text.textContent = 'Выдох...';

          breathTimeout = setTimeout(function() {
            if (!breathRunning) return;
            breathCycles++;
            if (breathCycles >= 6) {
              stopBreathing();
              text.textContent = 'Готово ✦';
              timer.textContent = '6 циклов завершено';
            } else {
              cycle();
            }
          }, 4000);
        }, 2000);
      }, 4000);
    }

    cycle();
  }

  function stopBreathing() {
    breathRunning = false;
    clearTimeout(breathTimeout);
    var circle = document.getElementById('breath-circle');
    var btn = document.getElementById('breath-start');
    circle.className = 'breath-circle';
    btn.textContent = 'Начать дыхание';
    btn.classList.remove('active');
  }

  /* ─── Check-in ─── */
  var selectedMood = null;

  function initCheckin() {
    var moodBtns = document.querySelectorAll('.mood-btn');
    moodBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        moodBtns.forEach(function(b) { b.classList.remove('selected'); });
        this.classList.add('selected');
        selectedMood = this.getAttribute('data-mood');
      });
    });

    var submitBtn = document.getElementById('checkin-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', submitCheckin);
    }

    var reflectBtn = document.getElementById('checkin-reflect');
    if (reflectBtn) {
      reflectBtn.addEventListener('click', showReflection);
    }
  }

  function submitCheckin() {
    var textarea = document.getElementById('checkin-text');
    var text = textarea ? textarea.value.trim() : '';

    if (!selectedMood && !text) return;

    var data = loadData();
    var entry = {
      date: new Date().toISOString(),
      mood: selectedMood || 'neutral',
      text: text
    };
    data.entries.unshift(entry);
    data = updateStreak(data);

    // Keep max 100 entries
    if (data.entries.length > 100) data.entries = data.entries.slice(0, 100);

    saveData(data);

    // Reset form
    if (textarea) textarea.value = '';
    selectedMood = null;
    document.querySelectorAll('.mood-btn').forEach(function(b) { b.classList.remove('selected'); });

    // Hide reflection
    var refBox = document.getElementById('reflection-box');
    if (refBox) refBox.classList.remove('visible');

    // Update UI
    renderStreak(data);
    renderJournal(data);
    renderMoodChart(data);

    // Show success
    var submitBtn = document.getElementById('checkin-submit');
    var orig = submitBtn.textContent;
    submitBtn.textContent = '✓ Сохранено';
    submitBtn.disabled = true;
    setTimeout(function() { submitBtn.textContent = orig; submitBtn.disabled = false; }, 2000);
  }

  /* ─── Reflection Engine ─── */
  function showReflection() {
    var textarea = document.getElementById('checkin-text');
    var input = textarea ? textarea.value.trim() : '';
    var refBox = document.getElementById('reflection-box');
    if (!refBox) return;

    if (!input && !selectedMood) {
      refBox.innerHTML = '<strong>Подсказка:</strong> выбери настроение или напиши пару слов — система отразит, что происходит.';
      refBox.classList.add('visible');
      return;
    }

    var lower = input.toLowerCase();
    var weather = 'смешанное состояние';
    var field = 'опора + внутреннее движение';
    var step = 'выбери одно действие на 5–10 минут, после которого станет хотя бы на 5% яснее.';

    // Mood-based
    if (selectedMood === 'heavy' || lower.match(/тяж|устал|нет сил|слаб|измот|вымот|разбит/)) {
      weather = 'тяжесть / низкая энергия';
      field = 'тело + опора';
      step = 'не открывай план. Один телесный шаг: вода, воздух, 3 минуты ходьбы.';
    } else if (selectedMood === 'anxious' || lower.match(/страх|трев|боюсь|паник|нерв/)) {
      weather = 'тревога / сигнал опасности';
      field = 'опора + безопасность';
      step = 'выпиши один конкретный страх и один факт, который можно проверить.';
    } else if (selectedMood === 'fog' || lower.match(/туман|непон|путан|хаос|запут/)) {
      weather = 'туман / неясность';
      field = 'ясность + структура';
      step = 'назови вслух три вещи, которые ты точно знаешь прямо сейчас.';
    } else if (selectedMood === 'spark' || lower.match(/хочу|иде[ея]|интерес|вдохн|энерг|жив/)) {
      weather = 'есть искра';
      field = 'выражение + рост';
      step = 'запиши один образ или черновой контур, не превращая в проект.';
    } else if (selectedMood === 'calm' || lower.match(/спок|норм|хорош|ровн|стаб/)) {
      weather = 'спокойствие / присутствие';
      field = 'благодарность + закрепление';
      step = 'заметь и назови, что именно сейчас держит тебя в этом состоянии.';
    }

    refBox.innerHTML =
      '<strong>Отражение:</strong> похоже на <em>' + weather + '</em>.<br><br>' +
      '<strong>Поле карты:</strong> ' + field + '.<br><br>' +
      '<strong>Живой шаг:</strong> ' + step;
    refBox.classList.add('visible');
  }

  /* ─── Render Streak ─── */
  function renderStreak(data) {
    var el = document.getElementById('streak-count');
    if (el) el.textContent = data.streak || 0;
  }

  /* ─── Render Journal ─── */
  function renderJournal(data) {
    var container = document.getElementById('journal-list');
    if (!container) return;

    if (!data.entries || data.entries.length === 0) {
      container.innerHTML = '<div class="journal-empty"><div class="journal-empty-icon">📝</div><p>Пока нет записей.<br>Сделай первый чекин!</p></div>';
      return;
    }

    var moodEmojis = { heavy: '😔', anxious: '😰', fog: '🌫️', spark: '✨', calm: '😌', neutral: '○' };
    var html = '';

    data.entries.slice(0, 20).forEach(function(entry) {
      var d = new Date(entry.date);
      var dateStr = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      var emoji = moodEmojis[entry.mood] || '○';

      html += '<div class="journal-entry">' +
        '<div class="journal-entry-header">' +
          '<span class="journal-entry-date">' + dateStr + '</span>' +
          '<span class="journal-entry-mood">' + emoji + '</span>' +
        '</div>' +
        (entry.text ? '<div class="journal-entry-text">' + escapeHtml(entry.text) + '</div>' : '') +
      '</div>';
    });

    container.innerHTML = html;
  }

  /* ─── Mood Chart (last 7 days) ─── */
  function renderMoodChart(data) {
    var barsContainer = document.getElementById('mood-chart-bars');
    var labelsContainer = document.getElementById('mood-chart-labels');
    if (!barsContainer) return;

    var moodScores = { calm: 5, spark: 4, neutral: 3, fog: 2, anxious: 1, heavy: 1 };
    var days = [];
    var dayNames = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];

    for (var i = 6; i >= 0; i--) {
      var date = new Date(Date.now() - i * 86400000);
      var dateStr = date.toISOString().split('T')[0];
      var dayEntries = (data.entries || []).filter(function(e) {
        return e.date && e.date.startsWith(dateStr);
      });

      var avgScore = 0;
      if (dayEntries.length > 0) {
        var total = dayEntries.reduce(function(sum, e) { return sum + (moodScores[e.mood] || 3); }, 0);
        avgScore = total / dayEntries.length;
      }

      days.push({ score: avgScore, label: dayNames[date.getDay()], isToday: i === 0 });
    }

    var barsHtml = '';
    var labelsHtml = '';
    days.forEach(function(day) {
      var height = day.score > 0 ? Math.round((day.score / 5) * 100) : 5;
      barsHtml += '<div class="mood-chart-bar' + (day.isToday ? ' today' : '') + '" style="height:' + height + '%"></div>';
      labelsHtml += '<div class="mood-chart-label">' + day.label + '</div>';
    });

    barsContainer.innerHTML = barsHtml;
    labelsContainer.innerHTML = labelsHtml;
  }

  /* ─── Helpers ─── */
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ─── Init ─── */
  function initUI() {
    var data = loadData();

    // Check streak continuity
    var today = new Date().toISOString().split('T')[0];
    var yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (data.lastDate && data.lastDate !== today && data.lastDate !== yesterday) {
      data.streak = 0; // Reset if missed a day
      saveData(data);
    }

    renderStreak(data);
    renderJournal(data);
    renderMoodChart(data);
    initTabs();
    initBreathing();
    initCheckin();
  }

  /* ─── Boot ─── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { initUI(); loadFromCloud(); });
  } else {
    initUI();
    loadFromCloud();
  }

})();
