/**
 * skills-data.js
 * -----------------------------------------------------------------------
 * Single source of truth for the Skills section.
 * To add/update a skill later, just edit this array — no HTML editing
 * required. `icon` accepts any short string/symbol (kept text-based so
 * no extra icon library is required). `category` must be 'Frontend' or
 * 'Backend' — it decides which grid the card renders into.
 * -----------------------------------------------------------------------
 */
const SKILLS = [
  { name: 'HTML5', category: 'Frontend', role: 'Semantic structure and accessible markup.', icon: '</>' },
  { name: 'CSS3', category: 'Frontend', role: 'Responsive, modern interface styling.', icon: '#' },
  { name: 'JavaScript', category: 'Frontend', role: 'Interactivity and client-side logic.', icon: '{}' },
  { name: 'PHP', category: 'Backend', role: 'Server-side logic and form handling.', icon: '<?php' }
];