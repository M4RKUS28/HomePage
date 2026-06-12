'use client';

import React from 'react';

/**
 * Fixed page backdrop: a blueprint grid fading out from the top plus two
 * slowly drifting color glows. Pure CSS (see .app-backdrop in globals.css) —
 * replaces the old canvas particle system, which recomputed O(n²) particle
 * connections on every animation frame.
 */
const BackgroundParticles = () => (
  <div className="app-backdrop" aria-hidden="true">
    <div className="backdrop-glow backdrop-glow-a" />
    <div className="backdrop-glow backdrop-glow-b" />
  </div>
);

export default BackgroundParticles;
