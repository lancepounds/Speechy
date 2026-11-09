(() => {
  const button = document.getElementById('installAppBtn');
  const settingsButton = document.getElementById('settingsInstall');
  const dialog = document.getElementById('installAppDialog');
  const confirm = document.getElementById('installAppConfirm');
  const status = document.getElementById('offlineAppStatus');
  let promptEvent;
  navigator.storage?.persist?.().catch(() => {});
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const update = (installed = !!standalone()) => {
    button.hidden = installed;
    if (settingsButton) settingsButton.textContent = installed ? 'Offline access & help' : 'Install app & offline help';
  };
  update();
  button.addEventListener('click', () => dialog.showModal());
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); promptEvent = event; confirm.hidden = false;
  });
  confirm.addEventListener('click', async () => {
    if (!promptEvent) return;
    const pending = promptEvent; promptEvent = null; confirm.hidden = true;
    try { await pending.prompt(); await pending.userChoice; } catch (error) { console.warn('Install prompt unavailable', error); }
  });
  window.addEventListener('appinstalled', () => { promptEvent = null; confirm.hidden = true; dialog.close(); update(true); });
  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('./sw.js', {scope:'./', updateViaCache:'none'}).then(() => navigator.serviceWorker.ready).then(() => {
      status.textContent = 'Offline access is ready. You can reopen Speechy without internet.';
    }).catch(error => {
      status.textContent = 'Offline access could not be prepared. Reopen Speechy online to try again.';
      console.warn('Offline setup failed', error);
    });
  } else {
    status.textContent = 'Offline installation requires HTTPS and a browser that supports service workers.';
  }
})();
