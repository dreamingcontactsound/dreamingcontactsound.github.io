/* Dreaming the Sound of Contact — page interactions */
(function () {
  "use strict";

  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mqTouch  = window.matchMedia('(pointer: coarse)');

  // --- scroll-reveal (fade-in on first entry) ------------
  if (!mqReduce.matches && 'IntersectionObserver' in window) {
    const reveals = Array.from(document.querySelectorAll('.reveal'));
    const ro = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          ro.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => ro.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
  }

  // Each entry explicitly maps a generated clip to its execution pair.
  const TASKS = window.EXPERIMENT_VIDEOS;
  const taskBtns = document.querySelectorAll('.seg--task .seg__btn');
  const runBox = document.querySelector('.seg--run');
  const kinds = ['gen', 'base', 'ours'];
  const videos = Object.fromEntries(kinds.map(k => [k, document.getElementById('v-' + k)]));
  let currentTask = 'whiteboard', currentRun = 0, generation = 0;
  let active = [], ended = new Set();
  const note = document.createElement('p');
  note.className = 'muted'; note.style.fontSize = '13px';
  document.querySelector('.explorer__videos').after(note);
  const startGroup = () => active.forEach(k => {
    const el = videos[k]; el.currentTime = 0; el.play().catch(() => {});
  });
  function paintExplorer() {
    const token = ++generation;
    const task = TASKS[currentTask], run = task.runs[currentRun];
    active = kinds.filter(k => run[k]); ended = new Set();
    runBox.replaceChildren();
    const caption = document.createElement('span'); caption.className = 'seg__caption'; caption.textContent = 'Run'; runBox.append(caption);
    task.runs.forEach((r, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'seg__btn' + (i === currentRun ? ' is-active' : '');
      b.textContent = i + 1; b.dataset.run = i + 1;
      b.addEventListener('click', () => { currentRun = i; paintExplorer(); }); runBox.append(b);
    });
    const ready = new Set();
    kinds.forEach(k => {
      const el = videos[k], fig = el.closest('figure'), item = run[k];
      el.pause(); el.onloadeddata = null;
      let missing = fig.querySelector('.missing-video');
      if (!missing) { missing = document.createElement('div'); missing.className = 'missing-video'; missing.textContent = 'Matching generated video not yet available'; fig.append(missing); }
      el.hidden = !item; missing.hidden = !!item;
      if (!item) { el.removeAttribute('src'); el.removeAttribute('poster'); el.load(); return; }
      el.poster = item.poster; el.src = item.src; el.muted = true;
      const badge = fig.querySelector('.video-badge'); if (badge) badge.textContent = item.speed + '×';
      el.onloadeddata = () => {
        if (token !== generation) return;
        ready.add(k); if (ready.size === active.length && !mqReduce.matches) startGroup();
      };
      el.load();
    });
    videos.ours.closest('figure').querySelector('.vdesc').textContent = run.forceDescription || 'Force-regulated trajectory execution';
    document.getElementById('score-ours').textContent = `${task.success.ours} / ${task.success.total} ours`;
    document.getElementById('score-base').textContent = `${task.success.base} / ${task.success.total} base`;
    taskBtns.forEach(b => b.classList.toggle('is-active', b.dataset.task === currentTask));
    note.textContent = currentTask === 'lamp'
      ? 'Displayed set: 6 original website runs + 4 additional runs. Membership in the original paper evaluation set has not been verified.'
      : (currentTask === 'chocolate' ? 'Displayed set: 6 original website runs + 4 additional runs.' : 'Displayed set: 10 local zero-shot experiment pairs.');
  }
  taskBtns.forEach(b => b.addEventListener('click', () => { currentTask = b.dataset.task; currentRun = 0; paintExplorer(); }));
  kinds.forEach(k => {
    const el = videos[k]; el.removeAttribute('loop');
    el.addEventListener('ended', () => { ended.add(k); if (active.every(a => ended.has(a))) { ended.clear(); startGroup(); } });
    el.addEventListener('volumechange', () => { if (!el.muted) kinds.filter(a => a !== k).forEach(a => { videos[a].muted = true; }); });
  });
  paintExplorer();

  // --- copy bibtex ---------------------------------------
  const copyBtn = document.getElementById('copy-bib');
  const bib     = document.getElementById('bib');
  if (copyBtn && bib) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(bib.textContent.trim());
        const prev = copyBtn.textContent;
        copyBtn.textContent = 'Copied ✓';
        copyBtn.disabled = true;
        setTimeout(() => { copyBtn.textContent = prev; copyBtn.disabled = false; }, 1500);
      } catch (e) {
        copyBtn.textContent = 'Copy failed';
      }
    });
  }
})();
