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

  // --- Video explorer: task tabs + run dropdown swap video sources ---
  const TASKS = {
    whiteboard: { label: 'Whiteboard wiping',      success: { ours: 6, base: 0, total: 6 } },
    carrot:     { label: 'Carrot peeling',         success: { ours: 4, base: 1, total: 6 } },
    chocolate:  { label: 'Chocolate box stacking', success: { ours: 5, base: 0, total: 6 } },
    lamp:       { label: 'Lamp button',            success: { ours: 4, base: 0, total: 6 } }
  };

  const taskBtns   = Array.from(document.querySelectorAll('.seg--task .seg__btn'));
  const runBtns    = Array.from(document.querySelectorAll('.seg--run .seg__btn'));
  const oursPill   = document.getElementById('score-ours');
  const basePill   = document.getElementById('score-base');
  const vidKinds   = ['gen', 'ours', 'base'];
  const exVideos   = Object.fromEntries(vidKinds.map(k => [k, document.getElementById('v-' + k)]));

  // Bump MEDIA_REV whenever videos or posters are rebuilt so caches invalidate.
  const MEDIA_REV = '7';
  let currentTask = 'whiteboard';
  let currentRun  = 1;

  // --- Group-synchronized looping -------------------------------------
  // The three clips have different lengths. Instead of looping each one
  // independently (which drifts them apart), every clip holds its last
  // frame when it ends; once ALL clips have ended, they restart together.
  const endedSet = new Set();
  const readySet = new Set();
  const activeKinds = () => vidKinds.filter(k => exVideos[k]);

  function groupStart() {
    readySet.clear();
    endedSet.clear();
    activeKinds().forEach(k => {
      const el = exVideos[k];
      try { el.currentTime = 0; } catch (e) {}
      el.play().catch(() => {});
    });
  }

  function paintExplorer() {
    const t = TASKS[currentTask];
    readySet.clear();
    endedSet.clear();
    vidKinds.forEach(kind => {
      const el = exVideos[kind];
      if (!el) return;
      const src    = `videos/${currentTask}_run${currentRun}_${kind}.mp4?v=${MEDIA_REV}`;
      const poster = `videos/${currentTask}_run${currentRun}_${kind}.jpg?v=${MEDIA_REV}`;
      if (el.getAttribute('src') !== src) {
        el.pause();
        el.setAttribute('poster', poster);
        el.setAttribute('src', src);
        el.load();
        el.muted = true;
        // start all three together once every clip is ready
        // (a synchronous play() after load() gets aborted by the load reset)
        el.addEventListener('loadeddata', () => {
          readySet.add(kind);
          if (readySet.size === activeKinds().length) groupStart();
        }, { once: true });
      }
    });
    if (oursPill) oursPill.textContent = `${t.success.ours} / ${t.success.total} ours`;
    if (basePill) basePill.textContent = `${t.success.base} / ${t.success.total} base`;
    taskBtns.forEach(b => b.classList.toggle('is-active', b.dataset.task === currentTask));
    runBtns.forEach(b => b.classList.toggle('is-active', parseInt(b.dataset.run, 10) === currentRun));
  }

  taskBtns.forEach(b => b.addEventListener('click', () => {
    if (currentTask !== b.dataset.task) {
      currentTask = b.dataset.task;
      paintExplorer();
    }
  }));
  runBtns.forEach(b => b.addEventListener('click', () => {
    const r = parseInt(b.dataset.run, 10) || 1;
    if (currentRun !== r) {
      currentRun = r;
      paintExplorer();
    }
  }));

  // Explorer videos play muted in parallel so the user sees the
  // comparison side-by-side. When the user unmutes one, re-mute the others
  // so the contact audio is clearly attributable to a single clip.
  Object.entries(exVideos).forEach(([kind, el]) => {
    if (!el) return;
    el.removeAttribute('loop');   // looping is managed by the group sync below
    el.addEventListener('ended', () => {
      endedSet.add(kind);
      if (endedSet.size === activeKinds().length) groupStart();
    });
    el.addEventListener('volumechange', () => {
      if (!el.muted) {
        Object.values(exVideos).forEach(other => {
          if (other && other !== el) other.muted = true;
        });
      }
    });
  });

  // Autoplay explorer videos (muted) when the explorer section is in view.
  if (!mqReduce.matches && 'IntersectionObserver' in window) {
    const explorerSec = document.getElementById('results');
    if (explorerSec) {
      const vo = new IntersectionObserver((entries) => {
        entries.forEach(({ isIntersecting, intersectionRatio }) => {
          const shouldPlay = isIntersecting && intersectionRatio >= 0.3;
          Object.values(exVideos).forEach(el => {
            if (!el) return;
            if (shouldPlay) {
              // Don't restart a video already playing with sound, and don't
              // solo-restart an ended clip that is waiting for the group loop
              if (el.paused && el.muted && !el.ended) el.play().catch(() => {});
            } else {
              if (!el.ended) el.pause();
            }
          });
        });
      }, { threshold: [0, 0.3, 0.6] });
      vo.observe(explorerSec);
    }
  }

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
