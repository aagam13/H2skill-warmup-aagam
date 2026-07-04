/**
 * @fileoverview App — state management, event orchestration, and step navigation.
 * This is the single entry point that wires together all modules.
 *
 * Architecture:
 *  - Immutable-style state object updated via setState()
 *  - render() re-renders the active step after every state change
 *  - All DOM events are registered per-render (no global listeners except nav)
 */

/* globals UI, MealEngine, GroceryBuilder, Substitutions, BudgetAnalyzer */
(function () {
  'use strict';

  /* ============================================================
     INITIAL STATE
     ============================================================ */
  var DEFAULT_STATE = {
    step: 1,
    preferences: {
      people:    2,
      dietary:   'omnivore',
      cuisine:   'any',
      budget:    'medium',
      allergies: [],
    },
    mealPlan: {
      breakfast: null,
      lunch:     null,
      dinner:    null,
    },
    todoState:      {},   // { [mealId]: { [stepIndex]: boolean } }
    customTodos:    [],   // [{ text: string, done: boolean }]
    groceryChecked: {},   // { [normKey]: boolean }
    selectedSubs:   {},   // { [ingredientName]: selectedOptionName }
  };

  var state = _deepClone(DEFAULT_STATE);

  /* ============================================================
     STATE MANAGEMENT
     ============================================================ */
  /**
   * Merges a partial state update and triggers a re-render.
   * @param {Object} patch
   */
  function setState(patch) {
    Object.assign(state, patch);
    render();
  }

  /* ============================================================
     ROUTING / RENDERING
     ============================================================ */
  function render() {
    var container = document.getElementById('step-container');
    if (!container) return;

    UI.updateStepper(state.step);

    switch (state.step) {
      case 1: _renderStep1(container); break;
      case 2: _renderStep2(container); break;
      case 3: _renderStep3(container); break;
      case 4: _renderStep4(container); break;
      case 5: _renderStep5(container); break;
    }

    // Scroll to top of content on step change
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Update document title
    var titles = ['Preferences', 'Meal Plan', 'Grocery List', 'Substitutions', 'Budget'];
    document.title = '🍳 CookPlan AI — ' + (titles[state.step - 1] || '');
  }

  /* ──────────────────────────────────────────────────────────
     STEP 1 — Preferences
     ────────────────────────────────────────────────────────── */
  function _renderStep1(container) {
    UI.renderStep1(container, state, function onSubmit(formData) {
      var allergies = formData.getAll('allergies');

      var newPrefs = {
        people:    Math.min(8, Math.max(1, parseInt(formData.get('people'), 10) || 2)),
        dietary:   _sanitise(formData.get('dietary')) || 'omnivore',
        cuisine:   _sanitise(formData.get('cuisine')) || 'any',
        budget:    _sanitise(formData.get('budget'))  || 'medium',
        allergies: allergies.filter(function (a) {
          return ['gluten','dairy','eggs','nuts','shellfish','soy'].includes(a);
        }),
      };

      var plan = MealEngine.generateMealPlan(newPrefs);

      // Initialise todo state for each meal
      var todoState = {};
      Object.values(plan).forEach(function (meal) {
        if (meal) todoState[meal.id] = {};
      });

      setState({
        step:        2,
        preferences: newPrefs,
        mealPlan:    plan,
        todoState:   todoState,
        customTodos: [],
        groceryChecked: {},
        selectedSubs:   {},
      });
    });
  }

  /* ──────────────────────────────────────────────────────────
     STEP 2 — Meal Plan / Cooking To-Do
     ────────────────────────────────────────────────────────── */
  function _renderStep2(container) {
    UI.renderStep2(container, state, {

      onRegen: function (type) {
        var current = state.mealPlan[type];
        var next = MealEngine.getNextAlternative(type, current ? current.id : '', state.preferences);
        if (!next) {
          UI.showToast('No other ' + type + ' options for your preferences.', 'error');
          return;
        }
        var newPlan = Object.assign({}, state.mealPlan, {});
        newPlan[type] = next;

        // Reset todo state for new meal
        var newTodoState = Object.assign({}, state.todoState);
        newTodoState[next.id] = {};

        setState({ mealPlan: newPlan, todoState: newTodoState });
        UI.showToast('Swapped to ' + next.name + '!', 'success');
      },

      onTodoToggle: function (mealIdOrCustom, index) {
        if (mealIdOrCustom === 'custom') {
          var todos = state.customTodos.slice();
          todos[index] = Object.assign({}, todos[index], { done: !todos[index].done });
          setState({ customTodos: todos });
        } else {
          var mealId = mealIdOrCustom;
          var newTodoState = Object.assign({}, state.todoState);
          var steps = Object.assign({}, newTodoState[mealId] || {});
          steps[index] = !steps[index];
          newTodoState[mealId] = steps;
          setState({ todoState: newTodoState });
        }
      },

      onAddTodo: function (text) {
        var safe = _sanitise(text).slice(0, 120);
        if (!safe) return;
        setState({ customTodos: state.customTodos.concat([{ text: safe, done: false }]) });
        UI.showToast('Task added!', 'success');
      },
    });

    _bindNavButtons('btn-back-2', function () { setState({ step: 1 }); });
    _bindNavButtons('btn-next-2', function () { setState({ step: 3 }); });
  }

  /* ──────────────────────────────────────────────────────────
     STEP 3 — Grocery List
     ────────────────────────────────────────────────────────── */
  function _renderStep3(container) {
    UI.renderStep3(container, state, {

      onServingChange: function (delta) {
        var newPeople = Math.min(8, Math.max(1, state.preferences.people + delta));
        setState({ preferences: Object.assign({}, state.preferences, { people: newPeople }) });
      },

      onCopy: function () {
        var groceries = GroceryBuilder.buildGroceryList(state.mealPlan, state.preferences.people);
        var categorised = GroceryBuilder.categorise(groceries);
        var text = '🛒 GROCERY LIST — CookPlan AI\n';
        text += '(' + state.preferences.people + ' person' + (state.preferences.people !== 1 ? 's' : '') + ')\n\n';
        Object.entries(categorised).forEach(function (entry) {
          var cat = entry[0], items = entry[1];
          text += '── ' + cat + ' ──\n';
          items.forEach(function (item) {
            text += '  □ ' + item.name + ' — ' + GroceryBuilder.formatQuantity(item.quantity, item.unit) + '\n';
          });
          text += '\n';
        });

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            UI.showToast('Grocery list copied to clipboard!', 'success');
          }).catch(function () {
            _fallbackCopy(text);
          });
        } else {
          _fallbackCopy(text);
        }
      },

      onGroceryCheck: function (itemName) {
        var key = itemName.toLowerCase();
        var updated = Object.assign({}, state.groceryChecked);
        updated[key] = !updated[key];
        setState({ groceryChecked: updated });
      },
    });

    _bindNavButtons('btn-back-3', function () { setState({ step: 2 }); });
    _bindNavButtons('btn-next-3', function () { setState({ step: 4 }); });
  }

  /* ──────────────────────────────────────────────────────────
     STEP 4 — Substitutions
     ────────────────────────────────────────────────────────── */
  function _renderStep4(container) {
    UI.renderStep4(container, state, {
      onSubSelect: function (ingredientName, optionName) {
        var updated = Object.assign({}, state.selectedSubs);
        // Toggle: clicking the same option deselects it
        updated[ingredientName] = updated[ingredientName] === optionName ? null : optionName;
        setState({ selectedSubs: updated });
      },
    });

    _bindNavButtons('btn-back-4', function () { setState({ step: 3 }); });
    _bindNavButtons('btn-next-4', function () { setState({ step: 5 }); });
  }

  /* ──────────────────────────────────────────────────────────
     STEP 5 — Budget Analysis
     ────────────────────────────────────────────────────────── */
  function _renderStep5(container) {
    UI.renderStep5(container, state, {
      onRestart: function () {
        state = _deepClone(DEFAULT_STATE);
        render();
      },
    });

    _bindNavButtons('btn-back-5', function () { setState({ step: 4 }); });
  }

  /* ============================================================
     UTILITIES
     ============================================================ */

  /**
   * Binds a click handler to a button by id (safe if element doesn't exist).
   */
  function _bindNavButtons(id, handler) {
    var btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', handler);
  }

  /**
   * Sanitises a string: strips leading/trailing whitespace and limits length.
   * NEVER used for innerHTML — only for values stored in state or displayed via textContent.
   * @param {string|null} val
   * @returns {string}
   */
  function _sanitise(val) {
    if (typeof val !== 'string') return '';
    return val.trim().substring(0, 200);
  }

  /**
   * Fallback clipboard copy using a textarea.
   * @param {string} text
   */
  function _fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity  = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      UI.showToast('Grocery list copied!', 'success');
    } catch (e) {
      UI.showToast('Could not copy — please copy manually.', 'error');
    }
    document.body.removeChild(ta);
  }

  /**
   * Deep clones a plain object (no functions, no circular refs).
   * @param {Object} obj
   * @returns {Object}
   */
  function _deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /* ============================================================
     INIT
     ============================================================ */
  document.addEventListener('DOMContentLoaded', function () {
    render();
  });

}());
