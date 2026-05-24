/**
 * navigator-engine.js — State Navigator (reflectState / clearState)
 * These functions are global so they can be called from onclick attributes.
 */

function reflectState() {
  const input = document.getElementById('stateInput').value.trim();
  const answer = document.getElementById('answer');

  if (!input) {
    answer.style.display = 'block';
    answer.className = 'answer mood-spark';
    answer.innerHTML = '<strong>Подсказка:</strong> напиши хотя бы одну сырую фразу. Здесь не нужна красота — туман, обрывки и честность подходят лучше, чем идеальная формулировка.';
    return;
  }

  const lower = input.toLowerCase();
  let weather = 'смешанное состояние';
  let field = 'опора + внутреннее движение';
  let step = 'выбери одно действие на 5–10 минут, после которого станет хотя бы на 5% яснее или легче.';
  let mood = 'mood-spark';

  if (lower.match(/тяж|устал|нет сил|слаб|измот|вымот|разбит/)) {
    weather = 'тяжесть / низкая энергия';
    field = 'тело + опора';
    step = 'не открывай весь план. Сделай один телесный шаг: вода, воздух, 3 минуты ходьбы или убрать один предмет с видимого места.';
    mood = 'mood-heavy';
  }

  if (lower.match(/спис|задач|надо|должен|обязан|план/)) {
    weather = 'давление формы';
    field = 'опора + сопротивление чужой структуре';
    step = 'не делай список. Назови один зависший узел человеческим языком: «что именно висит и почему оно давит?»';
    mood = 'mood-pressure';
  }

  if (lower.match(/хочу|иде[ея]|интерес|вдохн|энерг|жив/)) {
    weather = 'есть искра';
    field = 'выражение + рост';
    step = 'сохрани искру: запиши один образ, одну фразу или один черновой контур, не превращая это сразу в проект.';
    mood = 'mood-spark';
  }

  if (lower.match(/страх|трев|боюсь|паник|нерв/)) {
    weather = 'тревога / внутренний сигнал опасности';
    field = 'опора + безопасность';
    step = 'сначала уменьшить неопределённость: выпиши один конкретный страх и один факт, который можно проверить.';
    mood = 'mood-fear';
  }

  answer.style.display = 'block';
  answer.className = 'answer ' + mood;
  answer.innerHTML =
    '<strong>Отражение:</strong> сейчас это похоже на <em>' + weather + '</em>. Это не значит, что ты сломан — это значит, что вход через сухой план сейчас не подходит.<br><br>' +
    '<strong>Поле карты:</strong> ' + field + '.<br><br>' +
    '<strong>Живой следующий шаг:</strong> ' + step + '<br><br>' +
    '<strong>Проверка:</strong> после шага спроси себя не «я молодец?», а «стало ли на 5% яснее, легче или живее?».';
}

function clearState() {
  document.getElementById('stateInput').value = '';
  document.getElementById('answer').style.display = 'none';
}
