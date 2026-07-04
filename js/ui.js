/**
 * @fileoverview UI module — all DOM rendering helpers.
 * All user-supplied text is inserted via textContent (never innerHTML) to
 * prevent XSS. Dynamic HTML is built using the createEl() helper or safe
 * template patterns.
 */

/* globals GroceryBuilder, BudgetAnalyzer, Substitutions */
const UI = (function () {
  'use strict';

  /* ── XSS-safe text helper ── */
  /**
   * Sets text content safely on an element.
   * @param {HTMLElement} el
   * @param {string} text
   * @returns {HTMLElement}
   */
  function setText(el, text) {
    el.textContent = String(text);
    return el;
  }

  /**
   * Creates a DOM element with optional attributes and children.
   * @param {string} tag
   * @param {Object} [attrs={}]   - key/value attribute map; 'cls' maps to className
   * @param {Array}  [children=[]]- child elements or text strings
   * @returns {HTMLElement}
   */
  function createEl(tag, attrs, children) {
    var el = document.createElement(tag);
    attrs = attrs || {};
    children = children || [];

    Object.entries(attrs).forEach(function (pair) {
      var k = pair[0], v = pair[1];
      if (k === 'cls') {
        el.className = v;
      } else if (k === 'data') {
        Object.entries(v).forEach(function (d) {
          el.dataset[d[0]] = d[1];
        });
      } else if (k === 'aria') {
        Object.entries(v).forEach(function (a) {
          el.setAttribute('aria-' + a[0], a[1]);
        });
      } else {
        el.setAttribute(k, v);
      }
    });

    children.forEach(function (child) {
      if (child === null || child === undefined) return;
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else {
        el.appendChild(child);
      }
    });

    return el;
  }

  /* ──────────────────────────────────────────────────────────
     STEP 1 — Preferences form
     ────────────────────────────────────────────────────────── */
  /**
   * Renders the preferences form into the given container.
   * @param {HTMLElement} container
   * @param {Object} state - Current app state
   * @param {Function} onSubmit - Called with FormData on form submission
   */
  function renderStep1(container, state, onSubmit) {
    container.innerHTML = '';

    var header = _stepHeader('Step 1 of 5', 'Plan Your Day', 'Tell us about your cooking preferences', '📋');

    // Emoji row decoration
    var emojiRow = createEl('div', { cls: 'hero-emoji-row', 'aria-hidden': 'true' });
    emojiRow.textContent = '🥑 🍳 🥗 🍜 🌮';

    var form = createEl('form', { id: 'pref-form', cls: 'card pref-card', novalidate: '' });

    var grid = createEl('div', { cls: 'form-grid' });

    // People count
    var peopleGroup = createEl('div', { cls: 'form-group' });
    var peopleLabel = createEl('label', { cls: 'form-label', for: 'people-range' });
    peopleLabel.innerHTML = '<span class="form-label__icon">👥</span> Cooking for';
    var rangeGroup = createEl('div', { cls: 'range-group' });
    var rangeDisplay = createEl('div', { cls: 'range-display' });
    var rangeVal = createEl('span', { cls: 'range-value', id: 'people-display' });
    setText(rangeVal, state.preferences.people);
    var rangeHint = createEl('span', { cls: 'range-label' });
    setText(rangeHint, 'people');
    rangeDisplay.appendChild(rangeVal);
    rangeDisplay.appendChild(rangeHint);
    var rangeInput = createEl('input', {
      type: 'range', id: 'people-range', name: 'people',
      min: '1', max: '8', value: String(state.preferences.people),
      cls: 'form-range',
      'aria-label': 'Number of people',
      'aria-valuemin': '1', 'aria-valuemax': '8',
      'aria-valuenow': String(state.preferences.people),
    });
    rangeInput.addEventListener('input', function () {
      setText(rangeVal, this.value);
      this.setAttribute('aria-valuenow', this.value);
    });
    rangeGroup.appendChild(rangeDisplay);
    rangeGroup.appendChild(rangeInput);
    peopleGroup.appendChild(peopleLabel);
    peopleGroup.appendChild(rangeGroup);

    // Dietary preference
    var dietGroup = createEl('div', { cls: 'form-group form-group--full' });
    var dietLabel = createEl('label', { cls: 'form-label' });
    dietLabel.innerHTML = '<span class="form-label__icon">🌱</span> Dietary preference';
    var dietRadios = createEl('div', {
      cls: 'radio-group',
      role: 'group',
      'aria-label': 'Dietary preference',
    });
    [
      { val: 'omnivore',    label: '🍖 Omnivore' },
      { val: 'vegetarian',  label: '🥦 Vegetarian' },
      { val: 'vegan',       label: '🌿 Vegan' },
      { val: 'keto',        label: '🥑 Keto' },
    ].forEach(function (opt) {
      var id = 'diet-' + opt.val;
      var inp = createEl('input', {
        type: 'radio', id: id, name: 'dietary', value: opt.val,
        cls: 'radio-option',
      });
      if (state.preferences.dietary === opt.val) inp.setAttribute('checked', '');
      var lbl = createEl('label', { cls: 'radio-label', for: id });
      setText(lbl, opt.label);
      dietRadios.appendChild(inp);
      dietRadios.appendChild(lbl);
    });
    dietGroup.appendChild(dietLabel);
    dietGroup.appendChild(dietRadios);

    // Cuisine style
    var cuisineGroup = createEl('div', { cls: 'form-group' });
    var cuisineLabel = createEl('label', { cls: 'form-label', for: 'cuisine-select' });
    cuisineLabel.innerHTML = '<span class="form-label__icon">🌍</span> Cuisine style';
    var cuisineSelect = createEl('select', {
      id: 'cuisine-select', name: 'cuisine', cls: 'form-select',
      'aria-label': 'Cuisine style',
    });
    [
      { val: 'any',      label: '🌐 Any Cuisine' },
      { val: 'american', label: '🇺🇸 American' },
      { val: 'italian',  label: '🇮🇹 Italian' },
      { val: 'indian',   label: '🇮🇳 Indian' },
      { val: 'mexican',  label: '🇲🇽 Mexican' },
      { val: 'asian',    label: '🌏 Asian' },
    ].forEach(function (opt) {
      var o = createEl('option', { value: opt.val });
      setText(o, opt.label);
      if (state.preferences.cuisine === opt.val) o.setAttribute('selected', '');
      cuisineSelect.appendChild(o);
    });
    cuisineGroup.appendChild(cuisineLabel);
    cuisineGroup.appendChild(cuisineSelect);

    // Budget
    var budgetGroup = createEl('div', { cls: 'form-group' });
    var budgetLabel = createEl('label', { cls: 'form-label' });
    budgetLabel.innerHTML = '<span class="form-label__icon">💰</span> Daily budget';
    var budgetRadios = createEl('div', {
      cls: 'radio-group',
      role: 'group',
      'aria-label': 'Daily budget',
    });
    [
      { val: 'low',    label: '💵 Budget (&lt;$10/person)' },
      { val: 'medium', label: '💳 Medium (&lt;$20/person)' },
      { val: 'high',   label: '✨ Generous (&lt;$35/person)' },
    ].forEach(function (opt) {
      var id = 'budget-' + opt.val;
      var inp = createEl('input', {
        type: 'radio', id: id, name: 'budget', value: opt.val,
        cls: 'radio-option',
      });
      if (state.preferences.budget === opt.val) inp.setAttribute('checked', '');
      var lbl = createEl('label', { cls: 'radio-label', for: id });
      lbl.innerHTML = opt.label; // Static content only, no user input
      budgetRadios.appendChild(inp);
      budgetRadios.appendChild(lbl);
    });
    budgetGroup.appendChild(budgetLabel);
    budgetGroup.appendChild(budgetRadios);

    // Allergies
    var allergyGroup = createEl('div', { cls: 'form-group form-group--full' });
    var allergyLabel = createEl('label', { cls: 'form-label' });
    allergyLabel.innerHTML = '<span class="form-label__icon">⚠️</span> Allergies / intolerances';
    var allergyBoxes = createEl('div', {
      cls: 'checkbox-group',
      role: 'group',
      'aria-label': 'Select any allergies or intolerances',
    });
    [
      { val: 'gluten',    label: '🌾 Gluten' },
      { val: 'dairy',     label: '🥛 Dairy' },
      { val: 'eggs',      label: '🥚 Eggs' },
      { val: 'nuts',      label: '🥜 Nuts' },
      { val: 'shellfish', label: '🦐 Shellfish' },
      { val: 'soy',       label: '🫘 Soy' },
    ].forEach(function (opt) {
      var id = 'allergy-' + opt.val;
      var inp = createEl('input', {
        type: 'checkbox', id: id, name: 'allergies', value: opt.val,
        cls: 'checkbox-option',
      });
      if (state.preferences.allergies.includes(opt.val)) inp.setAttribute('checked', '');
      var lbl = createEl('label', { cls: 'checkbox-label', for: id });
      setText(lbl, opt.label);
      allergyBoxes.appendChild(inp);
      allergyBoxes.appendChild(lbl);
    });
    allergyGroup.appendChild(allergyLabel);
    allergyGroup.appendChild(allergyBoxes);

    grid.appendChild(peopleGroup);
    grid.appendChild(cuisineGroup);
    grid.appendChild(dietGroup);
    grid.appendChild(budgetGroup);
    grid.appendChild(allergyGroup);
    form.appendChild(emojiRow);
    form.appendChild(grid);

    // Submit button
    var btnGroup = createEl('div', { cls: 'btn-group' });
    var submitBtn = createEl('button', {
      type: 'submit', cls: 'btn btn--primary', id: 'generate-btn',
    });
    submitBtn.innerHTML = '✨ Generate My Meal Plan &rarr;';
    btnGroup.appendChild(createEl('div')); // spacer
    btnGroup.appendChild(submitBtn);
    form.appendChild(btnGroup);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      onSubmit(fd);
    });

    container.appendChild(header);
    container.appendChild(form);
  }

  /* ──────────────────────────────────────────────────────────
     STEP 2 — Meal Plan + Cooking To-Do
     ────────────────────────────────────────────────────────── */
  /**
   * @param {HTMLElement} container
   * @param {Object} state
   * @param {Object} callbacks - { onRegen, onTodoToggle, onAddTodo }
   */
  function renderStep2(container, state, callbacks) {
    container.innerHTML = '';

    var header = _stepHeader('Step 2 of 5', "Your Meal Plan", "Check off each cooking step as you go", '🍽️');
    container.appendChild(header);

    // Overall progress ring
    var allSteps  = _countAllSteps(state);
    var doneSteps = _countDoneSteps(state);
    var pct = allSteps > 0 ? Math.round((doneSteps / allSteps) * 100) : 0;
    container.appendChild(_renderOverallProgress(doneSteps, allSteps, pct));

    // Meal cards
    var mealTypes = ['breakfast', 'lunch', 'dinner'];
    var typeLabels = { breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', dinner: '🌙 Dinner' };

    mealTypes.forEach(function (type) {
      var meal = state.mealPlan[type];
      if (!meal) return;
      container.appendChild(_renderMealCard(meal, type, typeLabels[type], state, callbacks));
    });

    // Custom to-do
    var customCard = createEl('div', { cls: 'card mt-16' });
    var customTitle = createEl('h3', { cls: 'form-label' });
    customTitle.innerHTML = '📝 Add Custom Task';
    customCard.appendChild(customTitle);

    var customList = createEl('ul', { cls: 'todo-list', id: 'custom-todos', 'aria-label': 'Custom tasks' });
    state.customTodos.forEach(function (task, i) {
      customList.appendChild(_renderCustomTodo(task, i, callbacks.onTodoToggle));
    });
    customCard.appendChild(customList);

    var addForm = createEl('div', { cls: 'add-todo-form' });
    var addInput = createEl('input', {
      type: 'text', cls: 'form-input', id: 'custom-todo-input',
      placeholder: 'e.g. Marinate chicken overnight',
      maxlength: '120',
      'aria-label': 'Add a custom cooking task',
    });
    var addBtn = createEl('button', { cls: 'btn btn--ghost', id: 'add-todo-btn', type: 'button' });
    setText(addBtn, '+ Add');
    addBtn.addEventListener('click', function () {
      var val = addInput.value.trim();
      if (val) {
        callbacks.onAddTodo(val);
        addInput.value = '';
      }
    });
    addInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        addBtn.click();
      }
    });
    addForm.appendChild(addInput);
    addForm.appendChild(addBtn);
    customCard.appendChild(addForm);
    container.appendChild(customCard);

    // Navigation
    container.appendChild(_navButtons('← Back', 'Grocery List →', 'btn-back-2', 'btn-next-2'));
  }

  function _renderMealCard(meal, type, typeLabel, state, callbacks) {
    var doneTodos = state.todoState[meal.id] || {};
    var totalSteps = meal.steps.length;
    var doneCount  = Object.values(doneTodos).filter(Boolean).length;
    var pct = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0;

    var card = createEl('article', {
      cls: 'meal-card meal-card--' + type,
      'aria-label': typeLabel + ': ' + meal.name,
    });

    // Header
    var cardHeader = createEl('div', { cls: 'meal-card__header' });

    var emojiWrap = createEl('div', { cls: 'meal-card__emoji-wrap', 'aria-hidden': 'true' });
    setText(emojiWrap, meal.emoji);

    var meta = createEl('div', { cls: 'meal-card__meta' });
    var mealType = createEl('div', { cls: 'meal-card__meal-type' });
    setText(mealType, typeLabel);
    var mealName = createEl('h3', { cls: 'meal-card__name' });
    setText(mealName, meal.name);
    var mealDesc = createEl('p', { cls: 'meal-card__desc' });
    setText(mealDesc, meal.description);
    meta.appendChild(mealType);
    meta.appendChild(mealName);
    meta.appendChild(mealDesc);

    var badges = createEl('div', { cls: 'meal-card__badges' });
    var timeBadge = createEl('span', { cls: 'badge badge--time' });
    setText(timeBadge, '⏱ ' + (meal.prepTime + meal.cookTime) + ' min');
    var diffBadge = createEl('span', {
      cls: 'badge badge--difficulty-' + meal.difficulty,
    });
    setText(diffBadge, meal.difficulty.charAt(0).toUpperCase() + meal.difficulty.slice(1));

    // Regenerate button
    var regenBtn = createEl('button', {
      cls: 'btn--regen', type: 'button',
      'aria-label': 'Regenerate ' + type + ' meal',
      data: { type: type },
    });
    regenBtn.innerHTML = '🔄 Swap';
    regenBtn.addEventListener('click', function () {
      callbacks.onRegen(type);
    });

    badges.appendChild(timeBadge);
    badges.appendChild(diffBadge);
    badges.appendChild(regenBtn);

    cardHeader.appendChild(emojiWrap);
    cardHeader.appendChild(meta);
    cardHeader.appendChild(badges);
    card.appendChild(cardHeader);

    // Cooking Steps To-Do List
    var body = createEl('div', { cls: 'meal-card__body' });
    var todoList = createEl('ol', {
      cls: 'todo-list',
      role: 'list',
      'aria-label': meal.name + ' cooking steps',
    });

    meal.steps.forEach(function (step, i) {
      var done = doneTodos[i] === true;
      var item = createEl('li', {
        cls: 'todo-item' + (done ? ' todo-item--done' : ''),
        role: 'listitem',
        tabindex: '0',
        data: { mealId: meal.id, stepIndex: String(i) },
      });

      var cb = createEl('div', {
        cls: 'todo-item__checkbox',
        role: 'checkbox',
        'aria-checked': done ? 'true' : 'false',
        'aria-label': 'Step ' + (i + 1) + ': ' + step,
      });
      var checkIcon = createEl('span', { cls: 'todo-item__check-icon', 'aria-hidden': 'true' });
      setText(checkIcon, '✓');
      cb.appendChild(checkIcon);

      var text = createEl('span', { cls: 'todo-item__text' });
      setText(text, step);

      item.appendChild(cb);
      item.appendChild(text);

      function toggle() {
        callbacks.onTodoToggle(meal.id, i);
      }
      item.addEventListener('click', toggle);
      item.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); }
      });

      todoList.appendChild(item);
    });

    body.appendChild(todoList);
    card.appendChild(body);

    // Progress bar
    var prog = createEl('div', { cls: 'meal-progress', 'aria-label': 'Progress' });
    var barTrack = createEl('div', { cls: 'meal-progress__bar-track', role: 'progressbar',
      'aria-valuenow': String(pct), 'aria-valuemin': '0', 'aria-valuemax': '100' });
    var barFill = createEl('div', { cls: 'meal-progress__bar-fill' });
    barFill.style.width = pct + '%';
    barTrack.appendChild(barFill);
    var progLabel = createEl('span', { cls: 'meal-progress__label' });
    setText(progLabel, doneCount + '/' + totalSteps + ' done');
    prog.appendChild(barTrack);
    prog.appendChild(progLabel);
    card.appendChild(prog);

    return card;
  }

  function _renderCustomTodo(task, index, onToggle) {
    var done = task.done;
    var item = createEl('li', {
      cls: 'todo-item' + (done ? ' todo-item--done' : ''),
      tabindex: '0',
      data: { customIndex: String(index) },
      role: 'listitem',
    });
    var cb = createEl('div', {
      cls: 'todo-item__checkbox',
      role: 'checkbox',
      'aria-checked': done ? 'true' : 'false',
      'aria-label': task.text,
    });
    var checkIcon = createEl('span', { cls: 'todo-item__check-icon', 'aria-hidden': 'true' });
    setText(checkIcon, '✓');
    cb.appendChild(checkIcon);
    var text = createEl('span', { cls: 'todo-item__text' });
    setText(text, task.text);
    item.appendChild(cb);
    item.appendChild(text);
    function toggle() { onToggle('custom', index); }
    item.addEventListener('click', toggle);
    item.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); }
    });
    return item;
  }

  function _renderOverallProgress(done, total, pct) {
    var r = 26, circ = 2 * Math.PI * r;
    var offset = circ - (pct / 100) * circ;

    var wrap = createEl('div', {
      cls: 'overall-progress card',
      role: 'status',
      'aria-live': 'polite',
      'aria-label': 'Overall cooking progress: ' + pct + '%',
    });

    var ringWrap = createEl('div', { cls: 'overall-progress__ring', 'aria-hidden': 'true' });
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', '64');
    svg.setAttribute('height', '64');
    svg.setAttribute('viewBox', '0 0 64 64');

    var defs = document.createElementNS(ns, 'defs');
    var grad = document.createElementNS(ns, 'linearGradient');
    grad.setAttribute('id', 'ringGrad');
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '0%');
    var stop1 = document.createElementNS(ns, 'stop');
    stop1.setAttribute('offset', '0%'); stop1.setAttribute('stop-color', '#f59e0b');
    var stop2 = document.createElementNS(ns, 'stop');
    stop2.setAttribute('offset', '100%'); stop2.setAttribute('stop-color', '#f97316');
    grad.appendChild(stop1); grad.appendChild(stop2);
    defs.appendChild(grad);
    svg.appendChild(defs);

    var track = document.createElementNS(ns, 'circle');
    track.setAttribute('cx', '32'); track.setAttribute('cy', '32'); track.setAttribute('r', String(r));
    track.setAttribute('class', 'ring-track');

    var fill = document.createElementNS(ns, 'circle');
    fill.setAttribute('cx', '32'); fill.setAttribute('cy', '32'); fill.setAttribute('r', String(r));
    fill.setAttribute('stroke-dasharray', String(circ));
    fill.setAttribute('stroke-dashoffset', String(offset));
    fill.setAttribute('class', 'ring-fill');

    svg.appendChild(track); svg.appendChild(fill);
    ringWrap.appendChild(svg);

    var pctEl = createEl('div', { cls: 'overall-progress__pct', 'aria-hidden': 'true' });
    setText(pctEl, pct + '%');
    ringWrap.appendChild(pctEl);

    var info = createEl('div', { cls: 'overall-progress__info' });
    var infoTitle = createEl('h3');
    setText(infoTitle, 'Today\'s Cooking Progress');
    var infoDesc = createEl('p');
    setText(infoDesc, done + ' of ' + total + ' steps completed');
    info.appendChild(infoTitle);
    info.appendChild(infoDesc);

    wrap.appendChild(ringWrap);
    wrap.appendChild(info);
    return wrap;
  }

  function _countAllSteps(state) {
    var count = 0;
    Object.values(state.mealPlan).forEach(function (meal) {
      if (meal) count += meal.steps.length;
    });
    return count;
  }

  function _countDoneSteps(state) {
    var count = 0;
    Object.values(state.todoState).forEach(function (stepMap) {
      Object.values(stepMap).forEach(function (done) {
        if (done) count++;
      });
    });
    return count;
  }

  /* ──────────────────────────────────────────────────────────
     STEP 3 — Grocery List
     ────────────────────────────────────────────────────────── */
  function renderStep3(container, state, callbacks) {
    container.innerHTML = '';
    var header = _stepHeader('Step 3 of 5', 'Grocery List', 'Everything you need — categorised and costed', '🛒');
    container.appendChild(header);

    // Serving control
    var servCtrl = createEl('div', { cls: 'serving-control card', role: 'group', 'aria-label': 'Adjust servings' });
    var servLabel = createEl('span', { cls: 'serving-control__label' });
    setText(servLabel, '👥 Portions');
    var minusBtn = createEl('button', {
      cls: 'serving-control__btn', type: 'button',
      'aria-label': 'Decrease servings',
      id: 'serving-minus',
    });
    setText(minusBtn, '−');
    var countEl = createEl('span', {
      cls: 'serving-control__count',
      id: 'serving-count',
      'aria-live': 'polite',
      'aria-atomic': 'true',
    });
    setText(countEl, state.preferences.people);
    var plusBtn = createEl('button', {
      cls: 'serving-control__btn', type: 'button',
      'aria-label': 'Increase servings',
      id: 'serving-plus',
    });
    setText(plusBtn, '+');
    minusBtn.addEventListener('click', function () { callbacks.onServingChange(-1); });
    plusBtn.addEventListener('click',  function () { callbacks.onServingChange(+1); });
    servCtrl.appendChild(servLabel);
    servCtrl.appendChild(minusBtn);
    servCtrl.appendChild(countEl);
    servCtrl.appendChild(plusBtn);
    container.appendChild(servCtrl);

    // Actions
    var actions = createEl('div', { cls: 'grocery-header' });
    var totalEl = createEl('div', { cls: 'form-label' });

    var groceries = GroceryBuilder.buildGroceryList(state.mealPlan, state.preferences.people);
    var total = GroceryBuilder.totalCost(groceries);
    totalEl.innerHTML = '🧾 Estimated total: <strong style="color:var(--amber)">$' + total.toFixed(2) + '</strong>';

    var actionsRight = createEl('div', { cls: 'grocery-actions' });
    var copyBtn = createEl('button', {
      cls: 'btn btn--ghost btn--sm', type: 'button', id: 'copy-grocery-btn',
      'aria-label': 'Copy grocery list to clipboard',
    });
    setText(copyBtn, '📋 Copy');
    var printBtn = createEl('button', {
      cls: 'btn btn--ghost btn--sm', type: 'button', id: 'print-btn',
      'aria-label': 'Print grocery list',
    });
    setText(printBtn, '🖨️ Print');
    copyBtn.addEventListener('click', function () { callbacks.onCopy(); });
    printBtn.addEventListener('click', function () { window.print(); });
    actionsRight.appendChild(copyBtn);
    actionsRight.appendChild(printBtn);
    actions.appendChild(totalEl);
    actions.appendChild(actionsRight);
    container.appendChild(actions);

    // Categorised list
    var categorised = GroceryBuilder.categorise(groceries);
    var listWrap = createEl('div', { cls: 'card', id: 'grocery-list-wrap' });

    Object.entries(categorised).forEach(function (entry) {
      var cat = entry[0], items = entry[1];
      var catSection = createEl('div', { cls: 'grocery-category' });
      var catTitle = createEl('h3', { cls: 'grocery-category__title' });
      catTitle.innerHTML = GroceryBuilder.getCategoryIcon(cat) + ' ';
      catTitle.appendChild(document.createTextNode(cat));
      catSection.appendChild(catTitle);

      var itemList = createEl('ul', {
        cls: 'grocery-items',
        role: 'list',
        'aria-label': cat + ' items',
      });

      items.forEach(function (item) {
        var li = createEl('li', {
          cls: 'grocery-item',
          tabindex: '0',
          role: 'listitem',
          data: { itemKey: item.name.toLowerCase() },
        });
        var cb = createEl('div', {
          cls: 'grocery-item__cb' + (state.groceryChecked[item.name.toLowerCase()] ? ' grocery-item--checked' : ''),
          role: 'checkbox',
          'aria-checked': state.groceryChecked[item.name.toLowerCase()] ? 'true' : 'false',
          'aria-label': item.name,
        });
        if (state.groceryChecked[item.name.toLowerCase()]) setText(cb, '✓');
        var name = createEl('span', { cls: 'grocery-item__name' });
        setText(name, item.name);
        var qty = createEl('span', { cls: 'grocery-item__qty' });
        setText(qty, GroceryBuilder.formatQuantity(item.quantity, item.unit));
        var cost = createEl('span', { cls: 'grocery-item__cost' });
        setText(cost, '$' + item.cost.toFixed(2));

        if (state.groceryChecked[item.name.toLowerCase()]) {
          li.classList.add('grocery-item--checked');
        }

        li.appendChild(cb);
        li.appendChild(name);
        li.appendChild(qty);
        li.appendChild(cost);

        function toggleItem() { callbacks.onGroceryCheck(item.name); }
        li.addEventListener('click', toggleItem);
        li.addEventListener('keydown', function (e) {
          if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleItem(); }
        });
        itemList.appendChild(li);
      });
      catSection.appendChild(itemList);
      listWrap.appendChild(catSection);
    });

    container.appendChild(listWrap);
    container.appendChild(_navButtons('← Back', 'Substitutions →', 'btn-back-3', 'btn-next-3'));
  }

  /* ──────────────────────────────────────────────────────────
     STEP 4 — Substitutions
     ────────────────────────────────────────────────────────── */
  function renderStep4(container, state, callbacks) {
    container.innerHTML = '';
    var header = _stepHeader('Step 4 of 5', 'Smart Swaps', 'Ingredient substitutions tailored to your needs', '🔄');
    container.appendChild(header);

    var substitutables = Substitutions.findSubstitutables(state.mealPlan, state.preferences.allergies);

    if (substitutables.length === 0) {
      var noSubs = createEl('div', { cls: 'card no-subs' });
      var noSubsEmoji = createEl('span', { cls: 'emoji', 'aria-hidden': 'true' });
      setText(noSubsEmoji, '✅');
      var noSubsText = createEl('p');
      setText(noSubsText, 'Great news! All ingredients in your plan are compatible with your preferences — no swaps needed.');
      noSubs.appendChild(noSubsEmoji);
      noSubs.appendChild(noSubsText);
      container.appendChild(noSubs);
    } else {
      var introText = createEl('p', { cls: 'step-desc text-center' });
      setText(introText, substitutables.length + ' ingredient(s) have alternatives. Click any option to note your swap.');
      container.appendChild(introText);

      var grid = createEl('div', { cls: 'subs-grid mt-16' });

      substitutables.forEach(function (sub) {
        var card = createEl('div', { cls: 'sub-card' });
        var ingName = createEl('div', { cls: 'sub-card__ingredient' });
        ingName.innerHTML = '🔁 ';
        ingName.appendChild(document.createTextNode(sub.name));
        var reason = createEl('p', { cls: 'sub-card__reason' });
        setText(reason, sub.reason);
        card.appendChild(ingName);
        card.appendChild(reason);

        var opts = createEl('div', { cls: 'sub-options', role: 'group', 'aria-label': 'Substitution options for ' + sub.name });
        sub.options.forEach(function (opt) {
          var selected = state.selectedSubs[sub.name] === opt.name;
          var isSafe = opt.allergens.length === 0;
          var btn = createEl('button', {
            type: 'button',
            cls: 'sub-option' + (selected ? ' sub-option--selected' : '') + (isSafe ? ' sub-option--safe' : ''),
            'aria-pressed': selected ? 'true' : 'false',
            'aria-label': (isSafe ? 'Allergen-safe: ' : '') + opt.name,
          });
          setText(btn, (isSafe ? '✅ ' : '') + opt.name);
          btn.addEventListener('click', function () {
            callbacks.onSubSelect(sub.name, opt.name);
          });
          opts.appendChild(btn);
        });
        card.appendChild(opts);
        grid.appendChild(card);
      });
      container.appendChild(grid);
    }

    container.appendChild(_navButtons('← Back', 'Budget Analysis →', 'btn-back-4', 'btn-next-4'));
  }

  /* ──────────────────────────────────────────────────────────
     STEP 5 — Budget Analysis
     ────────────────────────────────────────────────────────── */
  function renderStep5(container, state, callbacks) {
    container.innerHTML = '';
    var header = _stepHeader('Step 5 of 5', 'Budget Analysis', 'Your meal plan cost breakdown', '💰');
    container.appendChild(header);

    var costData   = BudgetAnalyzer.estimateCost(state.mealPlan, state.preferences.people);
    var budgetEval = BudgetAnalyzer.evaluateBudget(costData.perPerson, state.preferences.budget);

    // Summary stats
    var summary = createEl('div', { cls: 'budget-summary', role: 'region', 'aria-label': 'Budget summary' });

    var statColor = budgetEval.status === 'under' ? 'green' : budgetEval.status === 'near' ? 'amber' : 'red';

    var stats = [
      { label: 'Total Cost', value: '$' + costData.total.toFixed(2),      sub: state.preferences.people + ' people',  color: 'amber' },
      { label: 'Per Person',  value: '$' + costData.perPerson.toFixed(2), sub: 'per day',                              color: statColor },
      { label: 'Budget Limit',value: BudgetAnalyzer.getBudgetLimitLabel(state.preferences.budget), sub: state.preferences.budget + ' tier', color: 'green' },
    ];

    stats.forEach(function (s) {
      var stat = createEl('div', { cls: 'budget-stat budget-stat--' + s.color });
      var lbl = createEl('div', { cls: 'budget-stat__label' });
      setText(lbl, s.label);
      var val = createEl('div', { cls: 'budget-stat__value budget-stat__value--' + s.color });
      setText(val, s.value);
      var sub = createEl('div', { cls: 'budget-stat__sub' });
      setText(sub, s.sub);
      stat.appendChild(lbl); stat.appendChild(val); stat.appendChild(sub);
      summary.appendChild(stat);
    });
    container.appendChild(summary);

    // Budget meter
    var meter = createEl('div', { cls: 'budget-meter card' });
    var meterLabel = createEl('div', { cls: 'budget-meter__label' });
    var meterTitle = createEl('span', { cls: 'budget-meter__title' });
    setText(meterTitle, 'Daily Spend vs. Limit');
    var statusBadge = createEl('span', { cls: 'budget-meter__status status--' + budgetEval.status });
    var statusIcons = { under: '✅ Under Budget', near: '⚠️ Near Budget', over: '❌ Over Budget' };
    setText(statusBadge, statusIcons[budgetEval.status]);
    meterLabel.appendChild(meterTitle);
    meterLabel.appendChild(statusBadge);

    var barTrack = createEl('div', {
      cls: 'budget-bar-track',
      role: 'progressbar',
      'aria-valuenow': String(budgetEval.percentage),
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-label': 'Budget usage: ' + budgetEval.percentage + '%',
    });
    var barFill = createEl('div', {
      cls: 'budget-bar-fill budget-bar-fill--' + budgetEval.status,
    });
    barFill.style.width = '0%';
    barTrack.appendChild(barFill);
    setTimeout(function () { barFill.style.width = Math.min(budgetEval.percentage, 100) + '%'; }, 100);

    var barLabels = createEl('div', { cls: 'budget-bar-labels' });
    var lblLeft = createEl('span');
    setText(lblLeft, '$0');
    var lblRight = createEl('span');
    setText(lblRight, '$' + BudgetAnalyzer.BUDGET_LIMITS[state.preferences.budget]);
    barLabels.appendChild(lblLeft);
    barLabels.appendChild(lblRight);

    meter.appendChild(meterLabel);
    meter.appendChild(barTrack);
    meter.appendChild(barLabels);
    container.appendChild(meter);

    // Meal cost breakdown
    var breakdown = createEl('div', { cls: 'cost-breakdown card' });
    var bTitle = createEl('h3', { cls: 'form-label', style: 'margin-bottom:14px' });
    bTitle.innerHTML = '🍽️ Cost Breakdown';
    breakdown.appendChild(bTitle);

    var maxCost = Math.max.apply(null, Object.values(costData.breakdown).map(function (b) { return b.cost; }));

    ['breakfast', 'lunch', 'dinner'].forEach(function (type) {
      var b = costData.breakdown[type];
      if (!b || b.cost === 0) return;
      var row = createEl('div', { cls: 'cost-row' });
      var emoji = createEl('span', { cls: 'cost-row__emoji', 'aria-hidden': 'true' });
      setText(emoji, b.emoji || '🍽️');
      var name = createEl('span', { cls: 'cost-row__name' });
      setText(name, b.name);
      var barWrap = createEl('div', { cls: 'cost-row__bar-wrap' });
      var bar = createEl('div', { cls: 'cost-row__bar' });
      bar.style.width = '0%';
      barWrap.appendChild(bar);
      setTimeout(function () {
        bar.style.width = (maxCost > 0 ? (b.cost / maxCost) * 100 : 0) + '%';
      }, 200);
      var amount = createEl('span', { cls: 'cost-row__amount' });
      setText(amount, '$' + b.cost.toFixed(2));
      row.appendChild(emoji); row.appendChild(name); row.appendChild(barWrap); row.appendChild(amount);
      breakdown.appendChild(row);
    });
    container.appendChild(breakdown);

    // Swap suggestions (only if over/near budget)
    if (budgetEval.status !== 'under') {
      var swaps = BudgetAnalyzer.getSwapSuggestions(state.mealPlan, state.preferences.budget, state.preferences.dietary);
      if (swaps.length > 0) {
        var swapWrap = createEl('div', { cls: 'card swap-suggestions' });
        var swapTitle = createEl('h3', { cls: 'swap-suggestions__title' });
        swapTitle.innerHTML = '💡 Budget-Friendly Swaps';
        swapWrap.appendChild(swapTitle);
        swaps.forEach(function (swap) {
          var swapItem = createEl('div', { cls: 'swap-item', role: 'listitem' });
          var info = createEl('div', { cls: 'swap-item__info' });
          info.innerHTML = swap.swapEmoji + ' Swap <em>' + _safeTxt(swap.currentName) + '</em> → <strong>' + _safeTxt(swap.swapName) + '</strong>';
          var saving = createEl('span', { cls: 'swap-item__saving' });
          setText(saving, 'Save $' + swap.saving.toFixed(2));
          swapItem.appendChild(info);
          swapItem.appendChild(saving);
          swapWrap.appendChild(swapItem);
        });
        container.appendChild(swapWrap);
      }
    }

    // Finish card
    var finishCard = createEl('div', { cls: 'card card--accent finish-card' });
    var finEmoji = createEl('span', { cls: 'finish-card__emoji', 'aria-hidden': 'true' });
    setText(finEmoji, '🎉');
    var finTitle = createEl('h2', { cls: 'finish-card__title' });
    setText(finTitle, 'You\'re ready to cook!');
    var finDesc = createEl('p', { cls: 'finish-card__desc' });
    setText(finDesc, 'Your personalised meal plan, grocery list, and budget analysis are ready. Happy cooking!');
    var restartBtn = createEl('button', {
      cls: 'btn btn--primary', type: 'button', id: 'restart-btn',
    });
    setText(restartBtn, '🔄 Plan Another Day');
    restartBtn.addEventListener('click', function () { callbacks.onRestart(); });
    finishCard.appendChild(finEmoji);
    finishCard.appendChild(finTitle);
    finishCard.appendChild(finDesc);
    finishCard.appendChild(restartBtn);
    container.appendChild(finishCard);

    container.appendChild(_navButtons('← Back', null, 'btn-back-5', null));
  }

  /* ──────────────────────────────────────────────────────────
     PROGRESS STEPPER
     ────────────────────────────────────────────────────────── */
  function updateStepper(step) {
    var labels = ['Preferences', 'Meal Plan', 'Groceries', 'Swaps', 'Budget'];
    var dots = document.querySelectorAll('.progress-step__dot');
    var lines = document.querySelectorAll('.progress-step__line');

    dots.forEach(function (dot, i) {
      var stepNum = i + 1;
      dot.removeAttribute('aria-current');
      dot.classList.remove('progress-step__dot--done');
      dot.textContent = stepNum < 10 ? String(stepNum) : String(stepNum);

      if (stepNum < step) {
        dot.classList.add('progress-step__dot--done');
        dot.textContent = '✓';
        dot.setAttribute('aria-label', labels[i] + ' — completed');
      } else if (stepNum === step) {
        dot.setAttribute('aria-current', 'step');
        dot.textContent = String(stepNum);
        dot.setAttribute('aria-label', labels[i] + ' — current step');
      } else {
        dot.setAttribute('aria-label', labels[i]);
      }
    });

    lines.forEach(function (line, i) {
      line.classList.toggle('progress-step__line--done', i < step - 1);
    });
  }

  /* ──────────────────────────────────────────────────────────
     TOAST
     ────────────────────────────────────────────────────────── */
  function showToast(message, type) {
    type = type || 'success';
    var container = document.getElementById('toast-container');
    if (!container) return;

    var toast = createEl('div', {
      cls: 'toast toast--' + type,
      role: 'alert',
      'aria-live': 'assertive',
    });
    var icons = { success: '✅', error: '❌' };
    toast.innerHTML = (icons[type] || '') + ' ';
    toast.appendChild(document.createTextNode(message));

    container.appendChild(toast);

    setTimeout(function () {
      toast.classList.add('toast--leaving');
      setTimeout(function () { toast.remove(); }, 280);
    }, 2800);
  }

  /* ──────────────────────────────────────────────────────────
     SHARED HELPERS
     ────────────────────────────────────────────────────────── */
  function _stepHeader(tag, title, desc, icon) {
    var wrap = createEl('div', { cls: 'step-header' });
    var stepTag = createEl('div', { cls: 'step-tag', 'aria-hidden': 'true' });
    stepTag.innerHTML = icon + ' ' + tag;
    var h1 = createEl('h1', { cls: 'step-title' });
    h1.textContent = title;
    var d = createEl('p', { cls: 'step-desc' });
    setText(d, desc);
    wrap.appendChild(stepTag);
    wrap.appendChild(h1);
    wrap.appendChild(d);
    return wrap;
  }

  function _navButtons(backLabel, nextLabel, backId, nextId) {
    var group = createEl('div', { cls: 'btn-group' });
    if (backLabel) {
      var back = createEl('button', { cls: 'btn btn--ghost', type: 'button', id: backId });
      setText(back, backLabel);
      group.appendChild(back);
    } else {
      group.appendChild(createEl('div'));
    }
    if (nextLabel) {
      var next = createEl('button', { cls: 'btn btn--primary', type: 'button', id: nextId });
      setText(next, nextLabel);
      group.appendChild(next);
    }
    return group;
  }

  /**
   * Escapes HTML entities for use inside innerHTML contexts where we must interpolate.
   * @param {string} str
   * @returns {string}
   * @private
   */
  function _safeTxt(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // Public API
  return {
    renderStep1: renderStep1,
    renderStep2: renderStep2,
    renderStep3: renderStep3,
    renderStep4: renderStep4,
    renderStep5: renderStep5,
    updateStepper: updateStepper,
    showToast: showToast,
    createEl: createEl,
    setText: setText,
  };
}());
