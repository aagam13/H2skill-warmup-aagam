/**
 * @fileoverview Unit Tests for CookPlan AI
 * Tests are written for the browser test runner (tests/runner.html).
 * All modules must be loaded via script tags before this file.
 *
 * Coverage:
 *  - MealEngine   : dietary filtering, allergen exclusion, fallback logic
 *  - GroceryBuilder: aggregation, scaling, deduplication, formatting
 *  - Substitutions : lookup, allergen filtering
 *  - BudgetAnalyzer: cost estimation, status evaluation, swap suggestions
 */

/* globals MealEngine, GroceryBuilder, Substitutions, BudgetAnalyzer, MEALS_DATA */
/* globals test, assert, assertEqual, assertDeepEqual, assertContains */

// ============================================================
// MEAL ENGINE TESTS
// ============================================================

test('MealEngine: omnivore gets all meal types', function () {
  var prefs = { people: 2, dietary: 'omnivore', cuisine: 'any', budget: 'medium', allergies: [] };
  var plan = MealEngine.generateMealPlan(prefs);
  assert(plan.breakfast !== null, 'Should have breakfast');
  assert(plan.lunch     !== null, 'Should have lunch');
  assert(plan.dinner    !== null, 'Should have dinner');
});

test('MealEngine: vegan filter returns only vegan meals', function () {
  var prefs = { people: 1, dietary: 'vegan', cuisine: 'any', budget: 'low', allergies: [] };
  var plan = MealEngine.generateMealPlan(prefs);
  if (plan.breakfast) {
    assert(plan.breakfast.tags.includes('vegan'), 'Breakfast must be vegan');
  }
  if (plan.lunch) {
    assert(plan.lunch.tags.includes('vegan'), 'Lunch must be vegan');
  }
  if (plan.dinner) {
    assert(plan.dinner.tags.includes('vegan'), 'Dinner must be vegan');
  }
});

test('MealEngine: vegetarian gets vegetarian + vegan meals', function () {
  var prefs = { people: 1, dietary: 'vegetarian', cuisine: 'any', budget: 'medium', allergies: [] };
  var plan = MealEngine.generateMealPlan(prefs);
  if (plan.breakfast) {
    var hasVeg = plan.breakfast.tags.includes('vegetarian') || plan.breakfast.tags.includes('vegan');
    assert(hasVeg, 'Breakfast must be vegetarian or vegan. Got: ' + plan.breakfast.tags.join(', '));
  }
});

test('MealEngine: keto filter returns keto-tagged meals', function () {
  var prefs = { people: 1, dietary: 'keto', cuisine: 'any', budget: 'high', allergies: [] };
  var plan = MealEngine.generateMealPlan(prefs);
  if (plan.breakfast) {
    assert(plan.breakfast.tags.includes('keto'), 'Breakfast must be keto. Got: ' + plan.breakfast.tags.join(', '));
  }
});

test('MealEngine: allergen exclusion removes meals with flagged ingredients', function () {
  var prefs = { people: 1, dietary: 'omnivore', cuisine: 'any', budget: 'medium', allergies: ['gluten'] };
  var breakfastCandidates = MealEngine.filterByType(MEALS_DATA.meals, 'breakfast', prefs);
  breakfastCandidates.forEach(function (meal) {
    var hasGluten = meal.ingredients.some(function (ing) {
      return ing.allergens.includes('gluten');
    });
    assert(!hasGluten, 'Meal ' + meal.name + ' should not contain gluten');
  });
});

test('MealEngine: cuisine filter narrows results correctly', function () {
  var prefs = { people: 1, dietary: 'omnivore', cuisine: 'italian', budget: 'high', allergies: [] };
  var dinnerCandidates = MealEngine.filterByType(MEALS_DATA.meals, 'dinner', prefs);
  dinnerCandidates.forEach(function (meal) {
    assertEqual(meal.cuisine, 'italian', 'Expected italian cuisine, got: ' + meal.cuisine);
  });
});

test('MealEngine: getNextAlternative returns a different meal', function () {
  var prefs = { people: 1, dietary: 'omnivore', cuisine: 'any', budget: 'medium', allergies: [] };
  var plan = MealEngine.generateMealPlan(prefs);
  var currentId = plan.breakfast ? plan.breakfast.id : '';
  if (currentId) {
    var alt = MealEngine.getNextAlternative('breakfast', currentId, prefs);
    if (alt) {
      assert(alt.id !== currentId, 'Alternative should differ from current meal');
    }
  }
});

test('MealEngine: no meal plan crashes on narrow preference combo', function () {
  var prefs = { people: 1, dietary: 'keto', cuisine: 'italian', budget: 'low', allergies: ['dairy','eggs'] };
  var threw = false;
  try {
    MealEngine.generateMealPlan(prefs);
  } catch (e) {
    threw = true;
  }
  assert(!threw, 'generateMealPlan should not throw even on narrow prefs');
});

// ============================================================
// GROCERY BUILDER TESTS
// ============================================================

test('GroceryBuilder: scales quantities correctly', function () {
  var mockPlan = {
    breakfast: {
      ingredients: [
        { name: 'Eggs', quantity: 2, unit: 'whole', cost: 0.60, category: 'Dairy & Eggs', allergens: ['eggs'] },
      ],
      steps: [],
    },
    lunch:  null,
    dinner: null,
  };
  var list = GroceryBuilder.buildGroceryList(mockPlan, 4);
  var eggs = list.find(function (i) { return i.name === 'Eggs'; });
  assert(eggs !== undefined, 'Should find Eggs');
  assertEqual(eggs.quantity, 8, 'Should scale 2 eggs × 4 servings = 8');
});

test('GroceryBuilder: deduplicates ingredients from multiple meals', function () {
  var mockPlan = {
    breakfast: {
      ingredients: [
        { name: 'Olive oil', quantity: 1, unit: 'tbsp', cost: 0.10, category: 'Pantry', allergens: [] },
      ],
    },
    lunch: {
      ingredients: [
        { name: 'Olive oil', quantity: 1, unit: 'tbsp', cost: 0.10, category: 'Pantry', allergens: [] },
      ],
    },
    dinner: null,
  };
  var list = GroceryBuilder.buildGroceryList(mockPlan, 1);
  var oilEntries = list.filter(function (i) { return i.name.toLowerCase() === 'olive oil'; });
  assertEqual(oilEntries.length, 1, 'Olive oil should be deduplicated into one entry');
  assertEqual(oilEntries[0].quantity, 2, 'Quantities should be summed: 1 + 1 = 2');
});

test('GroceryBuilder: categorise returns items in canonical order', function () {
  var items = [
    { name: 'Bread',     category: 'Bakery',        quantity: 1, unit: 'loaf', cost: 1 },
    { name: 'Chicken',   category: 'Proteins',       quantity: 1, unit: 'g',   cost: 2 },
    { name: 'Tomatoes',  category: 'Produce',        quantity: 2, unit: 'whole', cost: 0.5 },
  ];
  var groups = GroceryBuilder.categorise(items);
  var keys = Object.keys(groups);
  var produceIdx = keys.indexOf('Produce');
  var proteinsIdx = keys.indexOf('Proteins');
  var bakeryIdx   = keys.indexOf('Bakery');
  assert(produceIdx < bakeryIdx, 'Produce should appear before Bakery');
  assert(produceIdx < proteinsIdx || proteinsIdx < bakeryIdx, 'Ordering should follow canonical list');
});

test('GroceryBuilder: formatQuantity handles whole numbers', function () {
  var result = GroceryBuilder.formatQuantity(3, 'cups');
  assertEqual(result, '3 cups', 'Should format 3 as "3 cups"');
});

test('GroceryBuilder: formatQuantity handles fractions', function () {
  var result = GroceryBuilder.formatQuantity(0.5, 'cup');
  assertEqual(result, '½ cup', 'Should convert 0.5 to ½');
});

test('GroceryBuilder: formatQuantity handles 0.25', function () {
  var result = GroceryBuilder.formatQuantity(0.25, 'tsp');
  assertEqual(result, '¼ tsp', 'Should convert 0.25 to ¼');
});

test('GroceryBuilder: totalCost sums all item costs', function () {
  var items = [
    { cost: 1.50 },
    { cost: 2.00 },
    { cost: 0.50 },
  ];
  var total = GroceryBuilder.totalCost(items);
  assertEqual(total, 4.00, 'Total should be 4.00');
});

test('GroceryBuilder: handles empty meal plan gracefully', function () {
  var list = GroceryBuilder.buildGroceryList({ breakfast: null, lunch: null, dinner: null }, 2);
  assertEqual(list.length, 0, 'Empty plan should produce empty grocery list');
});

// ============================================================
// SUBSTITUTIONS TESTS
// ============================================================

test('Substitutions: finds substitution for eggs', function () {
  var result = Substitutions.getSubstitutions('Eggs', []);
  assert(result !== null, 'Should find substitutions for Eggs');
  assert(result.options.length > 0, 'Should have at least one substitution option');
});

test('Substitutions: returns null for unknown ingredient', function () {
  var result = Substitutions.getSubstitutions('Unobtainium', []);
  assertEqual(result, null, 'Should return null for unknown ingredient');
});

test('Substitutions: filters out options containing user allergens', function () {
  // Silken tofu option for eggs has soy allergen — should be filtered if user is soy-allergic
  var result = Substitutions.getSubstitutions('Eggs', ['soy']);
  if (result) {
    result.options.forEach(function (opt) {
      assert(!opt.allergens.includes('soy'), 'Should not suggest soy-containing option to soy-allergic user');
    });
  }
});

test('Substitutions: findSubstitutables returns array', function () {
  var prefs = { people: 1, dietary: 'omnivore', cuisine: 'any', budget: 'medium', allergies: [] };
  var plan = MealEngine.generateMealPlan(prefs);
  var subs = Substitutions.findSubstitutables(plan, []);
  assert(Array.isArray(subs), 'Should return an array');
});

test('Substitutions: no duplicate ingredient entries', function () {
  var prefs = { people: 1, dietary: 'omnivore', cuisine: 'any', budget: 'medium', allergies: [] };
  var plan = MealEngine.generateMealPlan(prefs);
  var subs = Substitutions.findSubstitutables(plan, []);
  var names = subs.map(function (s) { return s.name.toLowerCase(); });
  var unique = names.filter(function (name, idx) { return names.indexOf(name) === idx; });
  assertEqual(names.length, unique.length, 'No duplicate ingredient entries in substitutables');
});

// ============================================================
// BUDGET ANALYZER TESTS
// ============================================================

test('BudgetAnalyzer: estimateCost returns total and perPerson', function () {
  var mockPlan = {
    breakfast: {
      ingredients: [
        { name: 'Bread', quantity: 1, unit: 'slice', cost: 0.50, category: 'Bakery', allergens: [] },
      ],
    },
    lunch:  null,
    dinner: null,
  };
  var result = BudgetAnalyzer.estimateCost(mockPlan, 2);
  assertEqual(result.total, 1.00, 'Total should be $0.50 × 2 = $1.00');
  assertEqual(result.perPerson, 0.50, 'Per person should be $0.50');
});

test('BudgetAnalyzer: evaluateBudget returns "under" when cost is low', function () {
  var result = BudgetAnalyzer.evaluateBudget(5, 'medium');
  assertEqual(result.status, 'under', 'Should be under budget');
  assertEqual(result.limit, 20, 'Medium limit should be $20');
});

test('BudgetAnalyzer: evaluateBudget returns "over" when cost exceeds limit', function () {
  var result = BudgetAnalyzer.evaluateBudget(25, 'medium');
  assertEqual(result.status, 'over', '$25 > $20 medium limit, should be over');
});

test('BudgetAnalyzer: evaluateBudget returns "near" at 90% of limit', function () {
  var result = BudgetAnalyzer.evaluateBudget(18, 'medium');  // 18/20 = 90%
  assertEqual(result.status, 'near', '$18 is 90% of $20 limit — should be near');
});

test('BudgetAnalyzer: percentage is capped at 120 when severely over', function () {
  var result = BudgetAnalyzer.evaluateBudget(100, 'low');
  assert(result.percentage <= 120, 'Percentage should be capped at 120');
});

test('BudgetAnalyzer: getBudgetLimitLabel formats correctly', function () {
  assertEqual(BudgetAnalyzer.getBudgetLimitLabel('low'),    '$10 / person', 'Low budget label');
  assertEqual(BudgetAnalyzer.getBudgetLimitLabel('medium'), '$20 / person', 'Medium budget label');
  assertEqual(BudgetAnalyzer.getBudgetLimitLabel('high'),   '$35 / person', 'High budget label');
});

test('BudgetAnalyzer: getSwapSuggestions returns array', function () {
  var prefs = { people: 1, dietary: 'omnivore', cuisine: 'any', budget: 'medium', allergies: [] };
  var plan = MealEngine.generateMealPlan(prefs);
  var swaps = BudgetAnalyzer.getSwapSuggestions(plan, 'low', 'omnivore');
  assert(Array.isArray(swaps), 'Should return an array');
});

test('BudgetAnalyzer: swap suggestions save money (saving > 0)', function () {
  var prefs = { people: 1, dietary: 'omnivore', cuisine: 'any', budget: 'low', allergies: [] };
  var plan = MealEngine.generateMealPlan(prefs);
  var swaps = BudgetAnalyzer.getSwapSuggestions(plan, 'low', 'omnivore');
  swaps.forEach(function (swap) {
    assert(swap.saving > 0, 'Each swap should save money: ' + swap.swapName);
  });
});

test('BudgetAnalyzer: BUDGET_LIMITS are positive numbers', function () {
  var limits = BudgetAnalyzer.BUDGET_LIMITS;
  assert(limits.low    > 0, 'Low limit should be positive');
  assert(limits.medium > limits.low,    'Medium should be greater than low');
  assert(limits.high   > limits.medium, 'High should be greater than medium');
});

// ============================================================
// INTEGRATION TEST
// ============================================================

test('Integration: full flow produces valid grocery list and budget', function () {
  var prefs = { people: 3, dietary: 'vegetarian', cuisine: 'any', budget: 'medium', allergies: ['nuts'] };
  var plan  = MealEngine.generateMealPlan(prefs);

  // Grocery list
  var groceries = GroceryBuilder.buildGroceryList(plan, prefs.people);
  assert(groceries.length > 0, 'Should produce grocery items');

  // No nut allergens in any ingredient
  groceries.forEach(function (item) {
    assert(!item.allergens.includes('nuts'), item.name + ' should not contain nuts');
  });

  // Budget evaluation
  var costData = BudgetAnalyzer.estimateCost(plan, prefs.people);
  assert(costData.total >= 0, 'Total cost should be non-negative');
  assert(costData.perPerson >= 0, 'Per-person cost should be non-negative');
  var eval_ = BudgetAnalyzer.evaluateBudget(costData.perPerson, prefs.budget);
  assert(['under','near','over'].includes(eval_.status), 'Budget status should be valid');

  // Substitutions
  var subs = Substitutions.findSubstitutables(plan, ['nuts']);
  assert(Array.isArray(subs), 'Substitutables should be an array');
});
