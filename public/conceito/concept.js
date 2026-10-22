'use strict';
(() => {
  const scenarioButtons = [...document.querySelectorAll('[data-scenario]')];
  if (!scenarioButtons.length) return;
  const routeButtons = [...document.querySelectorAll('[data-route]')];
  const routes = {
    central: { name: 'Via Central', distance: 8 },
    parque: { name: 'Via Parque', distance: 12 }
  };
  let scenario = 'normal';
  let route = 'central';
  const reduced = () => document.documentElement.classList.contains('motion-reduced');
  function update() {
    const speed = scenario === 'normal' ? 30 : 20;
    const time = (routes[route].distance / speed) * 60;
    scenarioButtons.forEach((button) =>
      button.setAttribute('aria-pressed', String(button.dataset.scenario === scenario))
    );
    routeButtons.forEach((button) => {
      const active = button.dataset.route === route;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-selected', active);
      const duration = (routes[button.dataset.route].distance / speed) * 60;
      button.querySelector('[data-route-time]').textContent = duration;
      button
        .querySelector('.route-duration i')
        .style.setProperty('--duration', `${(duration / 40) * 100}%`);
    });
    document.querySelectorAll('[data-map-route]').forEach((path) => {
      const active = path.dataset.mapRoute === route;
      path.classList.toggle('is-active', active);
      if (active && !reduced() && path.animate) {
        path.animate(
          [
            { strokeDasharray: '1', strokeDashoffset: 1 },
            { strokeDasharray: '1', strokeDashoffset: 0 }
          ],
          { duration: 850, easing: 'cubic-bezier(.25,.8,.25,1)' }
        );
      }
    });
    document.getElementById('selected-route-label').textContent =
      `${routes[route].name} / ${scenario === 'normal' ? 'Normal' : 'Circulação lenta'}`;
    document.getElementById('arrival-time').innerHTML = `${time} <small>min</small>`;
    const status = document.getElementById('arrival-status');
    status.textContent = time <= 20 ? 'Dentro do prazo ↗' : 'Prazo ultrapassado ↗';
    status.classList.toggle('is-late', time > 20);
    const difference = Math.abs(20 - time);
    document.getElementById('route-feedback').textContent =
      time === 20
        ? 'Previsão de chegada no prazo informado.'
        : `Previsão de chegada ${difference} minutos ${time < 20 ? 'antes' : 'depois'} do prazo.`;
  }
  scenarioButtons.forEach((button) =>
    button.addEventListener('click', () => {
      scenario = button.dataset.scenario;
      update();
    })
  );
  routeButtons.forEach((button) =>
    button.addEventListener('click', () => {
      route = button.dataset.route;
      update();
    })
  );
})();
