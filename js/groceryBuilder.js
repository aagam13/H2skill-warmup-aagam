/**
 * @fileoverview Grocery Builder — aggregates and categorises ingredients
 * from a meal plan, scaled to the number of servings.
 */

const GroceryBuilder = (function () {
  'use strict';

  /** Canonical category display order */
  var CATEGORY_ORDER = [
    'Produce',
    'Proteins',
    'Dairy & Eggs',
    'Bakery',
    'Frozen',
    'Dairy-Free',
    'Pantry',
  ];

  /** Category emoji icons */
  var CATEGORY_ICONS = {
    'Produce':    '🥦',
    'Proteins':   '🍗',
    'Dairy & Eggs': '🥛',
    'Bakery':     '🍞',
    'Frozen':     '🧊',
    'Dairy-Free': '🌿',
    'Pantry':     '🫙',
  };

  /**
   * Builds a flat, de-duplicated ingredient list from a meal plan, scaled to servings.
   *
   * @param {{ breakfast: Object|null, lunch: Object|null, dinner: Object|null }} mealPlan
   * @param {number} servings - Number of people to scale for (default 1)
   * @returns {Object[]} Scaled, merged ingredient objects
   */
  function buildGroceryList(mealPlan, servings) {
    var scale = Math.max(1, servings || 1);
    var merged = {}; // key: normalised ingredient name

    Object.values(mealPlan).forEach(function (meal) {
      if (!meal) return;
      meal.ingredients.forEach(function (ing) {
        var key = _normalise(ing.name);
        if (merged[key]) {
          // Accumulate quantity and cost
          merged[key].quantity += ing.quantity * scale;
          merged[key].cost    += ing.cost * scale;
        } else {
          merged[key] = Object.assign({}, ing, {
            quantity: ing.quantity * scale,
            cost:     ing.cost * scale,
          });
        }
      });
    });

    return Object.values(merged);
  }

  /**
   * Groups a flat ingredient list by category in canonical order.
   *
   * @param {Object[]} items - Flat ingredient list
   * @returns {Object} { categoryName: Object[] } ordered map
   */
  function categorise(items) {
    var groups = {};

    items.forEach(function (item) {
      var cat = item.category || 'Pantry';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });

    // Sort each group alphabetically by name
    Object.keys(groups).forEach(function (cat) {
      groups[cat].sort(function (a, b) { return a.name.localeCompare(b.name); });
    });

    // Return in canonical order, then any unknown categories at the end
    var ordered = {};
    CATEGORY_ORDER.forEach(function (cat) {
      if (groups[cat]) ordered[cat] = groups[cat];
    });
    Object.keys(groups).forEach(function (cat) {
      if (!ordered[cat]) ordered[cat] = groups[cat];
    });

    return ordered;
  }

  /**
   * Returns the emoji icon for a category.
   * @param {string} category
   * @returns {string}
   */
  function getCategoryIcon(category) {
    return CATEGORY_ICONS[category] || '📦';
  }

  /**
   * Formats a numeric quantity + unit into a human-readable string.
   * Rounds to at most 2 decimal places; removes trailing zeros.
   *
   * @param {number} quantity
   * @param {string} unit
   * @returns {string}  e.g. "1.5 cups", "3 whole"
   */
  function formatQuantity(quantity, unit) {
    var q = Math.round(quantity * 100) / 100;
    // Convert decimals to fractions for common cases
    var frac = _toFraction(q);
    return frac + ' ' + unit;
  }

  /**
   * Converts a decimal to a readable fraction string for common values.
   * @param {number} n
   * @returns {string}
   * @private
   */
  function _toFraction(n) {
    var fractions = {
      0.25: '¼', 0.33: '⅓', 0.5: '½', 0.67: '⅔', 0.75: '¾',
    };
    var whole = Math.floor(n);
    var dec   = Math.round((n - whole) * 100) / 100;
    var fracStr = fractions[dec] || (dec > 0 ? dec : '');
    if (whole === 0) return fracStr || String(n);
    if (!fracStr) return String(n);
    return whole + ' ' + fracStr;
  }

  /**
   * Normalises an ingredient name for deduplication purposes.
   * @param {string} name
   * @returns {string}
   * @private
   */
  function _normalise(name) {
    return name.toLowerCase().trim();
  }

  /**
   * Computes total estimated cost of the grocery list.
   * @param {Object[]} items
   * @returns {number}
   */
  function totalCost(items) {
    return items.reduce(function (sum, item) { return sum + item.cost; }, 0);
  }

  // Public API
  return {
    buildGroceryList: buildGroceryList,
    categorise: categorise,
    getCategoryIcon: getCategoryIcon,
    formatQuantity: formatQuantity,
    totalCost: totalCost,
  };
}());
