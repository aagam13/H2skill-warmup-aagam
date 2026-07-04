# 🍳 CookPlan AI — Smart Daily Meal Planner

> **Hackathon submission** — AI-powered cooking to-do list micro-app

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎛️ **Preferences** | Dietary type, cuisine style, allergies, budget tier, party size |
| 🍽️ **Meal Plan** | AI-generated Breakfast / Lunch / Dinner with swap button |
| ✅ **Cooking To-Do** | Interactive step-by-step checklist per meal + custom tasks |
| 🛒 **Grocery List** | Categorised, scaled to party size, copy-to-clipboard |
| 🔄 **Substitutions** | Allergen-safe ingredient swaps |
| 💰 **Budget Analysis** | Cost per person, animated budget meter, money-saving swap tips |

---

## 🚀 How to Run

### Option 1 — Direct (Zero Setup)
```
Double-click index.html in your browser
```
> Works on Chrome, Edge, Firefox. No server or npm required.

### Option 2 — Local server (recommended for best CSP behaviour)
```bash
npx serve .
# then open http://localhost:3000
```

---

## 🧪 Run Tests

Open `tests/runner.html` in your browser.

All 30+ unit tests run instantly in the browser — no Node.js needed.

---

## 📁 File Structure

```
cooking-todo-app/
├── index.html               # Main app shell
├── styles/
│   └── index.css            # Design system (dark theme, glassmorphism)
├── js/
│   ├── mealsData.js         # 24-meal database (8 breakfast, 8 lunch, 8 dinner)
│   ├── mealEngine.js        # AI meal filter & selection logic
│   ├── groceryBuilder.js    # Grocery aggregation & scaling
│   ├── substitutions.js     # Ingredient swap DB
│   ├── budgetAnalyzer.js    # Cost estimation & budget evaluation
│   ├── ui.js                # DOM rendering (all XSS-safe)
│   └── app.js               # State management & orchestration
└── tests/
    ├── unit.test.js          # 30+ unit tests
    └── runner.html           # Browser test runner
```

---

## 🏆 Hackathon Criteria

| Criterion | Implementation |
|---|---|
| **Code Quality** | Modular IIFE pattern, JSDoc on all exports, no globals pollution |
| **Problem Alignment** | Full 5-step flow: Preferences → Meal Plan → Grocery → Swaps → Budget |
| **Security** | All user input via `textContent`, CSP meta tag, input length limits, no `eval()` |
| **Efficiency** | O(n) filtering, no re-fetch, minimal DOM updates via targeted re-render |
| **Testing** | 30+ unit tests across all 4 modules + integration test |
| **Accessibility** | ARIA labels/roles, keyboard nav, focus management, WCAG AA contrast, skip link |

---

## 🛠️ Tech Stack

- **HTML5** — semantic markup, SEO meta tags
- **Vanilla CSS** — custom properties, glassmorphism, CSS animations
- **Vanilla JS (ES5 IIFEs)** — zero dependencies, works as `file://`
- **Google Fonts** — Outfit + Inter

---

*Built with ❤️ for the hackathon.*
