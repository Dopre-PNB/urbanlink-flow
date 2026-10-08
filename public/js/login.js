'use strict';
(() => {
  const { $, $$, api, busy, formError } = UL;
  $$('[data-demo]').forEach((button) =>
    button.addEventListener('click', () => {
      const admin = button.dataset.demo === 'administrador';
      $('#email').value = admin ? 'admin@urbanlink.local' : 'operador@urbanlink.local';
      $('#senha').value = admin ? 'Admin@123' : 'Operador@123';
      $('#email').focus();
    })
  );
  $('#login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget,
      button = $('button[type=submit]', form);
    formError(form, '');
    busy(button, true, 'Entrando…');
    try {
      const result = await api('/login', {
        method: 'POST',
        body: { email: $('#email').value.trim(), senha: $('#senha').value }
      });
      sessionStorage.setItem('ul_token', result.token);
      sessionStorage.setItem('ul_usuario', JSON.stringify(result.usuario));
      location.href = '/painel.html';
    } catch (error) {
      formError(form, error.message);
    } finally {
      busy(button, false);
    }
  });
})();
