/**
 * @fileoverview Meal Engine — filters and selects meals based on user preferences.
 * Uses a deterministic seeded selection to ensure reproducibility.
 */

/* global MEALS_DATA */
const MealEngine = (function () {
  'use strict';

  /**
   * @typedef {Object} Preferences
   * @property {number}   people   - Number of people to cook for (1–8)
   * @property {string}   dietary  - 'vegan' | 'vegetarian' | 'keto' | 'omnivore'
   * @property {string}   cuisine  - 'any' | 'american' | 'italian' | 'indian' | 'mexican' | 'asian'
   * @property {string}   budget   - 'low' | 'medium' | 'high'
   * @property {string[]} allergies - e.g. ['nuts', 'dairy', 'gluten']
   */

  /**
   * Filters meals of a given type that match dietary preference and have no allergen conflicts.
   *
   * @param {Object[]} meals       - Full meals array from MEALS_DATA
   * @param {string}   type        - 'breakfast' | 'lunch' | 'dinner'
   * @param {Preferences} prefs    - User preferences
   * @returns {Object[]} Filtered meals
   */
  function filterByType(meals, type, prefs) {
    return meals.filter(function (meal) {
      if (meal.type !== type) return false;

      // Dietary filter
      if (!_matchesDiet(meal, prefs.dietary)) return false;

      // Cuisine filter
      if (prefs.cuisine !== 'any' && meal.cuisine !== prefs.cuisine) return false;

      // Allergen filter — exclude meals containing any selected allergen
      if (prefs.allergies.length > 0 && _hasAllergenConflict(meal, prefs.allergies)) return false;

      return true;
    });
  }

  /**
   * Determines whether a meal satisfies a dietary preference.
   *
   * @param {Object} meal    - Meal object
   * @param {string} dietary - Dietary preference string
   * @returns {boolean}
   */
  function _matchesDiet(meal, dietary) {
    switch (dietary) {
      case 'vegan':
        return meal.tags.includes('vegan');
      case 'vegetarian':
        return meal.tags.includes('vegetarian') || meal.tags.includes('vegan');
      case 'keto':
        return meal.tags.includes('keto');
      case 'omnivore':
      default:
        return true; // omnivores can eat everything
    }
  }

  /**
   * Returns true if any ingredient in the meal contains a flagged allergen.
   *
   * @param {Object}   meal      - Meal object
   * @param {string[]} allergies - User's allergen list
   * @returns {boolean}
   */
  function _hasAllergenConflict(meal, allergies) {
    return meal.ingredients.some(function (ing) {
      return ing.allergens.some(function (a) {
        return allergies.includes(a);
      });
    });
  }

  /**
   * Picks a meal from a filtered list. If the list is empty, falls back to
   * the full set for that type, ignoring cuisine (but still respecting diet/allergens).
   *
   * @param {Object[]} candidates  - Pre-filtered candidate meals
   * @param {Object[]} allMeals    - Full meal DB for fallback
   * @param {string}   type        - 'breakfast' | 'lunch' | 'dinner'
   * @param {Preferences} prefs    - Original preferences
   * @param {number}   index       - Selection index (for variety across calls)
   * @returns {Object|null}
   */
  function selectMeal(candidates, allMeals, type, prefs, index) {
    var pool = candidates;

    if (pool.length === 0) {
      // Relax cuisine constraint
      pool = filterByType(allMeals, type, Object.assign({}, prefs, { cuisine: 'any' }));
    }
    if (pool.length === 0) {
      // Relax dietary + cuisine — return first meal of that type as absolute fallback
      pool = allMeals.filter(function (m) { return m.type === type; });
    }
    if (pool.length === 0) return null;

    return pool[index % pool.length];
  }

  /**
   * Generates a complete meal plan (breakfast, lunch, dinner) based on preferences.
   *
   * @param {Preferences} prefs - User preferences
   * @returns {{ breakfast: Object|null, lunch: Object|null, dinner: Object|null }}
   */
  function generateMealPlan(prefs) {
    var allMeals = MEALS_DATA.meals;
    var result = {};

    ['breakfast', 'lunch', 'dinner'].forEach(function (type, idx) {
      var candidates = filterByType(allMeals, type, prefs);
      result[type] = selectMeal(candidates, allMeals, type, prefs, idx);
    });

    return result;
  }

  /**
   * Returns alternative meals (not the currently selected one) for the given type.
   *
   * @param {string}   type        - 'breakfast' | 'lunch' | 'dinner'
   * @param {string}   currentId   - Currently selected meal id
   * @param {Preferences} prefs    - User preferences
   * @returns {Object[]} Alternatives (up to 5)
   */
  function getAlternatives(type, currentId, prefs) {
    var allMeals = MEALS_DATA.meals;
    var candidates = filterByType(allMeals, type, prefs);

    // Relax cuisine if too narrow
    if (candidates.length <= 1) {
      candidates = filterByType(allMeals, type, Object.assign({}, prefs, { cuisine: 'any' }));
    }

    return candidates
      .filter(function (m) { return m.id !== currentId; })
      .slice(0, 5);
  }

  /**
   * Computes the next meal in the alternative cycle (for "regenerate" button).
   *
   * @param {string}     type       - 'breakfast' | 'lunch' | 'dinner'
   * @param {string}     currentId  - Current meal id
   * @param {Preferences} prefs     - User preferences
   * @returns {Object|null}
   */
  function getNextAlternative(type, currentId, prefs) {
    var alts = getAlternatives(type, currentId, prefs);
    return alts.length > 0 ? alts[0] : null;
  }

  // Public API
  return {
    generateMealPlan: generateMealPlan,
    getAlternatives: getAlternatives,
    getNextAlternative: getNextAlternative,
    filterByType: filterByType,
  };
}());
