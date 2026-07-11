const config = window.ANIDA_CONFIG || { formProvider: 'local' };

const toggle = document.querySelector('.nav-toggle');
const menu = document.querySelector('#main-menu');
toggle?.addEventListener('click', () => {
  const isOpen = menu.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(isOpen));
});

function formToPayload(form) {
  const data = new FormData(form);
  const payload = Object.fromEntries(data.entries());
  payload.privacy = data.get('privacy') === 'on';
  payload.communications = data.get('communications') === 'on';
  payload.createdAt = new Date().toISOString();
  return payload;
}

async function persistSubmission(payload) {
  const isResource = payload.formType === 'resource';
  const endpoint = isResource ? config.resourceEndpoint : config.contactEndpoint;

  if (config.formProvider === 'endpoint' && endpoint) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('No se ha podido enviar el formulario.');
    return;
  }

  const storageKey = isResource ? 'anida_resource_leads' : 'anida_contact_requests';
  const previous = JSON.parse(localStorage.getItem(storageKey) || '[]');
  previous.push(payload);
  localStorage.setItem(storageKey, JSON.stringify(previous));
}

document.querySelectorAll('form[data-form]').forEach((form) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = form.querySelector('.form-message');
    const payload = formToPayload(form);
    message.textContent = 'Enviando...';

    try {
      await persistSubmission(payload);
      form.reset();
      if (payload.formType === 'resource') {
        const link = document.querySelector('[data-download-link]');
        if (config.resourceDownloadUrl && link) {
          link.href = config.resourceDownloadUrl;
          link.classList.remove('hidden');
          message.textContent = 'Gracias. Te avisaremos en cuanto el recurso definitivo esté listo. Puedes acceder a la descarga provisional.';
        } else {
          message.textContent = 'Gracias. El recurso estará disponible próximamente y serás de las primeras personas en recibirlo.';
        }
      } else {
        message.textContent = 'Gracias por escribirnos. Hemos recibido tu consulta y te responderemos pronto.';
      }
    } catch (error) {
      message.textContent = error.message || 'Ha ocurrido un error. Inténtalo de nuevo más tarde.';
    }
  });
});
