# Dreaming the Sound of Contact — project page

Static site for the paper "Dreaming the Sound of Contact:
Leveraging Video and Audio Generation for Zero-Shot Force-Aware Manipulation and Data Generation".

Live at: https://dreamingcontactsound.github.io/

## Structure

- `index.html` — single-page site
- `assets/` — CSS, JS, favicon
- `figs/` — concept + pipeline diagrams, audio→force overlay plots
- `videos/` — task clips (4 tasks × 6 runs × generated/baseline/ours) with poster frames

## Local preview

    python3 -m http.server 8080

Open http://localhost:8080/

## Experiment explorer update

The explorer now contains 10 displayed pairs per task. Whiteboard and carrot use local zero-shot trials 01–10 at variable Fmax 15 N. Chocolate retains website runs 1–6 and adds local trials 01–04. Lamp retains website runs 1–6 and adds local trials 01–04; this is a selected display set, not a verified reconstruction of the paper evaluation cohort. Counts use existing manifests and legacy website aggregates, not new per-video adjudication.

`assets/experiment-videos.js` maps every displayed clip. New media live in `videos/zeroshot_v2/`; all original files in `videos/` remain unchanged for recovery. New execution clips are 2×; generated clips are 1×. The four added Lamp runs use local generated sources 1, 2, 4, and 5, matched through execution logs and source-trajectory paths. Chocolate local trials 02 and 03 use cc1.mp4 and cc3.mp4. Chocolate trial 04 still lacks a located cc4 source. Chocolate trial 01 remains without a shared generated clip because its no-force log refers to 0.pkl (c3), while its force log refers to 1.pkl (cc1); the manifest labels the pair as trajectory 0. This pairing needs reconciliation. Chocolate local trial 01 is labeled as constant 15 N because its execution log records that setting.
