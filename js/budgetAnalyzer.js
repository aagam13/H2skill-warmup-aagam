/**
 * @fileoverview Budget Analyzer — estimates meal plan costs, evaluates
 * budget feasibility, and suggests cheaper meal swaps when over budget.
 */

const BudgetAnalyzer = (function () {
  'use strict';

  /**
   * Daily spending limits (USD) per person, per day.
   * These represent the maximum comfortable spend for each budget tier.
   */
  var BUDGET_LIMITS = {
    low:    10,
    medium: 20,
    high:   35,
  };

  /** Fraction of the limit at which we consider the budget "near" (warning zone) */
  var NEAR_THRESHOLD = 0.85;

  /**
   * Estimates the total cost of a meal plan scaled to number of servings.
   *
   * @param {{ breakfast, lunch, dinner }} mealPlan
   * @param {number} servings
   * @returns {{ total: number, perPerson: number, breakdown: Object }}
   */
  function estimateCost(mealPlan, servings) {
    var scale = Math.max(1, servings || 1);
    var breakdown = {};
    var total = 0;

    Object.entries(mealPlan).forEach(function (entry) {
      var type = entry[0];
      var meal = entry[1];
      if (!meal) {
        breakdown[type] = { name: '—', cost: 0 };
        return;
      }
      var cost = _mealCost(meal) * scale;
      breakdown[type] = { name: meal.name, emoji: meal.emoji, cost: cost };
      total += cost;
    });

    return {
      total:     Math.round(total * 100) / 100,
      perPerson: Math.round((total / scale) * 100) / 100,
      breakdown: breakdown,
    };
  }

  /**
   * Sums the ingredient costs for a single meal (1 serving).
   * @param {Object} meal
   * @returns {number}
   * @private
   */
  function _mealCost(meal) {
    return meal.ingredients.reduce(function (sum, ing) { return sum + ing.cost; }, 0);
  }

  /**
   * Compares estimated cost per person to the chosen budget limit.
   *
   * @param {number} perPersonCost - Estimated cost per person per day
   * @param {string} budgetTier    - 'low' | 'medium' | 'high'
   * @returns {{ status: string, limit: number, percentage: number }}
   *   status: 'under' | 'near' | 'over'
   */
  function evaluateBudget(perPersonCost, budgetTier) {
    var limit = BUDGET_LIMITS[budgetTier] || BUDGET_LIMITS.medium;
    var pct   = Math.min((perPersonCost / limit) * 100, 120); // cap at 120%

    var status;
    if (perPersonCost > limit) {
      status = 'over';
    } else if (perPersonCost >= limit * NEAR_THRESHOLD) {
      status = 'near';
    } else {
      status = 'under';
    }

    return { status: status, limit: limit, percentage: Math.round(pct) };
  }

  /**
   * Suggests cheaper meal alternatives for the type(s) that are most expensive.
   * Returns up to 3 concrete swap recommendations.
   *
   * @param {{ breakfast, lunch, dinner }} mealPlan  - Current plan
   * @param {string} budgetTier                      - User's budget tier
   * @param {string} dietary                         - User's dietary preference
   * @returns {Object[]}  Array of { type, currentName, swapName, swapEmoji, saving }
   */
  function getSwapSuggestions(mealPlan, budgetTier, dietary) {
    var allMeals = MEALS_DATA.meals;
    var suggestions = [];

    Object.entries(mealPlan).forEach(function (entry) {
      var type = entry[0];
      var current = entry[1];
      if (!current) return;

      var currentCost = _mealCost(current);

      // Find cheaper meals of same type with compatible diet
      var cheaper = allMeals.filter(function (m) {
        if (m.type !== type) return false;
        if (m.id === current.id) return false;
        if (!_dietOk(m, dietary)) return false;
        return _mealCost(m) < currentCost - 0.50; // at least 50c cheaper
      });

      if (cheaper.length === 0) return;

      // Sort by cost ascending and take the cheapest
      cheaper.sort(function (a, b) { return _mealCost(a) - _mealCost(b); });
      var best = cheaper[0];
      var saving = currentCost - _mealCost(best);

      suggestions.push({
        type:        type,
        currentName: current.name,
        swapName:    best.name,
        swapId:      best.id,
        swapEmoji:   best.emoji,
        saving:      Math.round(saving * 100) / 100,
      });
    });

    // Sort by biggest saving first, take top 3
    suggestions.sort(function (a, b) { return b.saving - a.saving; });
    return suggestions.slice(0, 3);
  }

  /**
   * Quick diet compatibility check (mirrors mealEngine logic, avoids circular dep).
   * @param {Object} meal
   * @param {string} dietary
   * @returns {boolean}
   * @private
   */
  function _dietOk(meal, dietary) {
    switch (dietary) {
      case 'vegan':       return meal.tags.includes('vegan');
      case 'vegetarian':  return meal.tags.includes('vegetarian') || meal.tags.includes('vegan');
      case 'keto':        return meal.tags.includes('keto');
      default:            return true;
    }
  }

  /**
   * Returns a human-readable budget limit string.
   * @param {string} tier
   * @returns {string}  e.g. "$20 / person"
   */
  function getBudgetLimitLabel(tier) {
    var limit = BUDGET_LIMITS[tier] || BUDGET_LIMITS.medium;
    return '$' + limit + ' / person';
  }

  // Public API
  return {
    estimateCost:       estimateCost,
    evaluateBudget:     evaluateBudget,
    getSwapSuggestions: getSwapSuggestions,
    getBudgetLimitLabel: getBudgetLimitLabel,
    BUDGET_LIMITS:      BUDGET_LIMITS,
  };
}());
