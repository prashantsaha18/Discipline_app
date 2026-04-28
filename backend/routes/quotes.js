const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

const QUOTES = [
  // Discipline
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn", category: "discipline" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle", category: "discipline" },
  { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock", category: "discipline" },
  { text: "Small disciplines repeated with consistency every day lead to great achievements gained slowly over time.", author: "John Maxwell", category: "discipline" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Augusta F. Kantra", category: "discipline" },
  { text: "The ability to discipline yourself to delay gratification is the indispensable prerequisite for success.", author: "Brian Tracy", category: "discipline" },
  // Mind
  { text: "The mind is everything. What you think, you become.", author: "Buddha", category: "mind" },
  { text: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius", category: "mind" },
  { text: "The quality of your thoughts determines the quality of your life.", author: "Epictetus", category: "mind" },
  { text: "To enjoy good health, to bring true happiness to one's family, to bring peace to all, one must first discipline and control one's own mind.", author: "Buddha", category: "mind" },
  { text: "An undisciplined mind is a battlefield. A disciplined mind is a sanctuary.", author: "Ancient Wisdom", category: "mind" },
  { text: "The snake which cannot cast its skin has to die. As well the minds which are prevented from changing their opinions; they cease to be mind.", author: "Nietzsche", category: "mind" },
  // Strength
  { text: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi", category: "strength" },
  { text: "You never know how strong you are until being strong is your only choice.", author: "Bob Marley", category: "strength" },
  { text: "The strongest people are not those who show strength in front of us, but those who win battles we know nothing about.", author: "Unknown", category: "strength" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb", category: "strength" },
  { text: "He who conquers himself is the mightiest warrior.", author: "Confucius", category: "strength" },
  // Brahmacharya / Stoic
  { text: "Brahmacharya is a divine word. It is the basis of all morality.", author: "Swami Vivekananda", category: "brahmacharya" },
  { text: "Self-control is the chief element in self-respect, and self-respect is the chief element in courage.", author: "Thucydides", category: "brahmacharya" },
  { text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius", category: "brahmacharya" },
  { text: "Conquer yourself rather than the world.", author: "René Descartes", category: "brahmacharya" },
  { text: "First say to yourself what you would be; then do what you have to do.", author: "Epictetus", category: "brahmacharya" },
  { text: "The goal of man is not to be rich or powerful, but to be free from the bondage of his own passions.", author: "Seneca", category: "brahmacharya" },
  // Resilience
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", category: "resilience" },
  { text: "Our greatest glory is not in never failing, but in rising every time we fall.", author: "Confucius", category: "resilience" },
  { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius", category: "resilience" },
  { text: "Rock bottom became the solid foundation on which I rebuilt my life.", author: "J.K. Rowling", category: "resilience" },
  { text: "You may have to fight a battle more than once to win it.", author: "Margaret Thatcher", category: "resilience" },
  { text: "Storms make trees take deeper roots.", author: "Dolly Parton", category: "resilience" },
  // Focus
  { text: "The successful warrior is the average man with laser-like focus.", author: "Bruce Lee", category: "focus" },
  { text: "Where the mind goes, the body follows.", author: "Arnold Schwarzenegger", category: "focus" },
  { text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell", category: "focus" },
  { text: "Your focus determines your reality.", author: "Qui-Gon Jinn", category: "focus" },
];

// GET /api/quotes/daily — deterministic daily quote based on date
router.get('/daily', auth, async (req, res) => {
  try {
    const today = new Date().toLocaleDateString('en-CA');
    const dayNum = Math.floor(new Date(today).getTime() / 86400000);
    const quote = QUOTES[dayNum % QUOTES.length];
    res.json(quote);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/quotes/random?category=mind
router.get('/random', auth, async (req, res) => {
  try {
    const { category } = req.query;
    const pool = category && category !== 'all'
      ? QUOTES.filter(q => q.category === category)
      : QUOTES;
    const quote = pool[Math.floor(Math.random() * pool.length)];
    res.json(quote);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/quotes/all
router.get('/all', auth, async (req, res) => {
  res.json(QUOTES);
});

module.exports = router;
