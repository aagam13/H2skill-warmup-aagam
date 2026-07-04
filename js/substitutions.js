/**
 * @fileoverview Substitutions module — provides ingredient swap suggestions
 * based on dietary preferences and allergy constraints.
 */

const Substitutions = (function () {
  'use strict';

  /**
   * Substitution database.
   * Structure: { [normalisedIngredientName]: { reason, options: [{ name, allergens[] }] } }
   */
  var DB = {
    'eggs': {
      reason: 'Egg-free / vegan alternative',
      options: [
        { name: 'Flax egg (1 tbsp ground flaxseed + 3 tbsp water)', allergens: [] },
        { name: 'Chia egg (1 tbsp chia seeds + 3 tbsp water)',       allergens: [] },
        { name: 'Applesauce (¼ cup per egg)',                        allergens: [] },
        { name: 'Commercial egg replacer',                           allergens: [] },
        { name: 'Silken tofu (¼ cup blended per egg)',               allergens: ['soy'] },
      ],
    },
    'egg': {
      reason: 'Egg-free / vegan alternative',
      options: [
        { name: 'Flax egg (1 tbsp ground flaxseed + 3 tbsp water)', allergens: [] },
        { name: 'Chia egg (1 tbsp chia seeds + 3 tbsp water)',       allergens: [] },
        { name: 'Applesauce (¼ cup per egg)',                        allergens: [] },
        { name: 'Commercial egg replacer',                           allergens: [] },
      ],
    },
    'butter': {
      reason: 'Dairy-free / vegan alternative',
      options: [
        { name: 'Vegan butter (e.g. Earth Balance)',  allergens: [] },
        { name: 'Coconut oil (same quantity)',         allergens: [] },
        { name: 'Olive oil (use ¾ the amount)',        allergens: [] },
        { name: 'Avocado (mashed, for baked goods)',   allergens: [] },
      ],
    },
    'heavy cream': {
      reason: 'Dairy-free / lower-fat alternative',
      options: [
        { name: 'Coconut cream (full-fat)',            allergens: [] },
        { name: 'Oat cream',                          allergens: ['gluten'] },
        { name: 'Cashew cream (soaked cashews blended)', allergens: ['nuts'] },
        { name: 'Silken tofu cream',                  allergens: ['soy'] },
      ],
    },
    'milk': {
      reason: 'Dairy-free alternative',
      options: [
        { name: 'Oat milk',     allergens: ['gluten'] },
        { name: 'Soy milk',     allergens: ['soy'] },
        { name: 'Almond milk',  allergens: ['nuts'] },
        { name: 'Coconut milk', allergens: [] },
        { name: 'Rice milk',    allergens: [] },
      ],
    },
    'buttermilk': {
      reason: 'Dairy-free alternative',
      options: [
        { name: 'Oat milk + 1 tbsp lemon juice (let sit 5 min)', allergens: ['gluten'] },
        { name: 'Soy milk + 1 tbsp apple cider vinegar',          allergens: ['soy'] },
        { name: 'Coconut milk + 1 tbsp vinegar',                  allergens: [] },
      ],
    },
    'greek yogurt': {
      reason: 'Dairy-free / vegan alternative',
      options: [
        { name: 'Coconut yogurt',    allergens: [] },
        { name: 'Soy yogurt',        allergens: ['soy'] },
        { name: 'Cashew yogurt',     allergens: ['nuts'] },
        { name: 'Oat yogurt',        allergens: ['gluten'] },
      ],
    },
    'yogurt': {
      reason: 'Dairy-free / vegan alternative',
      options: [
        { name: 'Coconut yogurt',    allergens: [] },
        { name: 'Soy yogurt',        allergens: ['soy'] },
        { name: 'Cashew yogurt',     allergens: ['nuts'] },
      ],
    },
    'parmesan': {
      reason: 'Dairy-free alternative',
      options: [
        { name: 'Nutritional yeast (savoury, cheesy flavour)', allergens: [] },
        { name: 'Vegan Parmesan (store-bought)',               allergens: ['nuts'] },
        { name: 'Hemp seeds (for texture)',                    allergens: [] },
      ],
    },
    'cheddar cheese': {
      reason: 'Dairy-free alternative',
      options: [
        { name: 'Vegan cheddar shreds',                              allergens: ['nuts'] },
        { name: 'Cashew cheese sauce',                               allergens: ['nuts'] },
        { name: 'Nutritional yeast (for flavour only)',              allergens: [] },
      ],
    },
    'mozzarella': {
      reason: 'Dairy-free alternative',
      options: [
        { name: 'Vegan mozzarella (e.g. Violife)',      allergens: [] },
        { name: 'Cashew mozzarella (homemade)',         allergens: ['nuts'] },
        { name: 'Sliced tofu (for texture)',            allergens: ['soy'] },
      ],
    },
    'fresh mozzarella': {
      reason: 'Dairy-free alternative',
      options: [
        { name: 'Vegan mozzarella (e.g. Violife)',  allergens: [] },
        { name: 'Cashew mozzarella (homemade)',     allergens: ['nuts'] },
      ],
    },
    'sourdough bread': {
      reason: 'Gluten-free alternative',
      options: [
        { name: 'Gluten-free sourdough bread',     allergens: [] },
        { name: 'Rice cakes',                      allergens: [] },
        { name: 'Gluten-free toast',               allergens: [] },
      ],
    },
    'multigrain bread': {
      reason: 'Gluten-free alternative',
      options: [
        { name: 'Gluten-free bread',   allergens: [] },
        { name: 'Rice cakes',          allergens: [] },
        { name: 'Lettuce wraps',       allergens: [] },
      ],
    },
    'flour tortilla': {
      reason: 'Gluten-free alternative',
      options: [
        { name: 'Corn tortilla',          allergens: [] },
        { name: 'Gluten-free flour wrap', allergens: [] },
        { name: 'Lettuce wrap',           allergens: [] },
        { name: 'Rice paper wrap',        allergens: [] },
      ],
    },
    'all-purpose flour': {
      reason: 'Gluten-free alternative',
      options: [
        { name: 'Rice flour',           allergens: [] },
        { name: 'Almond flour',         allergens: ['nuts'] },
        { name: 'Oat flour',            allergens: ['gluten'] },
        { name: 'Gluten-free blend',    allergens: [] },
        { name: 'Cassava flour',        allergens: [] },
      ],
    },
    'spaghetti': {
      reason: 'Gluten-free alternative',
      options: [
        { name: 'Gluten-free spaghetti (rice or corn)',  allergens: [] },
        { name: 'Zucchini noodles (zoodles)',             allergens: [] },
        { name: 'Chickpea pasta',                        allergens: [] },
        { name: 'Lentil pasta',                          allergens: [] },
      ],
    },
    'penne pasta': {
      reason: 'Gluten-free alternative',
      options: [
        { name: 'Gluten-free penne',   allergens: [] },
        { name: 'Chickpea penne',      allergens: [] },
        { name: 'Lentil pasta',        allergens: [] },
        { name: 'Zucchini noodles',    allergens: [] },
      ],
    },
    'almond milk': {
      reason: 'Nut-free alternative',
      options: [
        { name: 'Oat milk',     allergens: ['gluten'] },
        { name: 'Soy milk',     allergens: ['soy'] },
        { name: 'Rice milk',    allergens: [] },
        { name: 'Coconut milk', allergens: [] },
      ],
    },
    'granola': {
      reason: 'Nut-free / gluten-free alternative',
      options: [
        { name: 'Nut-free granola',       allergens: ['gluten'] },
        { name: 'Puffed rice cereal',     allergens: [] },
        { name: 'Gluten-free granola',    allergens: [] },
        { name: 'Seeds & dried fruit mix',allergens: [] },
      ],
    },
    'pesto': {
      reason: 'Nut-free / dairy-free alternative',
      options: [
        { name: 'Nut-free pesto (sunflower seed based)', allergens: [] },
        { name: 'Sun-dried tomato spread',               allergens: [] },
        { name: 'Hummus',                                allergens: [] },
        { name: 'Olive tapenade',                        allergens: [] },
      ],
    },
    'soy sauce': {
      reason: 'Soy-free / lower sodium alternative',
      options: [
        { name: 'Tamari (gluten-free soy sauce)',    allergens: ['soy'] },
        { name: 'Coconut aminos (soy-free)',         allergens: [] },
        { name: 'Liquid aminos (Bragg)',             allergens: [] },
      ],
    },
    'firm tofu': {
      reason: 'Soy-free / higher protein alternative',
      options: [
        { name: 'Tempeh (fermented, soy-based)',      allergens: ['soy'] },
        { name: 'Seitan (wheat gluten)',               allergens: ['gluten'] },
        { name: 'Chickpeas',                           allergens: [] },
        { name: 'White beans',                         allergens: [] },
        { name: 'Paneer (Indian cheese, has dairy)',   allergens: ['dairy'] },
      ],
    },
    'canned tuna': {
      reason: 'Shellfish-free / plant-based alternative',
      options: [
        { name: 'Canned chickpeas (mashed)',    allergens: [] },
        { name: 'Hearts of palm (flaked)',      allergens: [] },
        { name: 'Jackfruit (in brine)',         allergens: [] },
        { name: 'White beans (mashed)',         allergens: [] },
      ],
    },
    'salmon fillet': {
      reason: 'Shellfish-free / plant-based alternative',
      options: [
        { name: 'Tofu steak',                    allergens: ['soy'] },
        { name: 'Chicken breast (non-fish)',      allergens: [] },
        { name: 'Portobello mushroom',            allergens: [] },
        { name: 'Cauliflower steak',              allergens: [] },
      ],
    },
    'beef mince': {
      reason: 'Plant-based / leaner alternative',
      options: [
        { name: 'Lentils (cooked)',           allergens: [] },
        { name: 'Mushroom & walnut mince',    allergens: ['nuts'] },
        { name: 'Soy mince (textured soy)',   allergens: ['soy'] },
        { name: 'Turkey mince (leaner)',      allergens: [] },
        { name: 'Chicken mince',             allergens: [] },
      ],
    },
    'chicken breast': {
      reason: 'Alternative protein option',
      options: [
        { name: 'Tofu (firm, marinated)',    allergens: ['soy'] },
        { name: 'Turkey breast',             allergens: [] },
        { name: 'Chickpeas',                 allergens: [] },
        { name: 'Tempeh',                    allergens: ['soy'] },
      ],
    },
    'chicken thigh': {
      reason: 'Alternative protein option',
      options: [
        { name: 'Firm tofu (marinated)',    allergens: ['soy'] },
        { name: 'Chickpeas',               allergens: [] },
        { name: 'Turkey thigh',            allergens: [] },
      ],
    },
    'tahini': {
      reason: 'Nut/sesame-free alternative',
      options: [
        { name: 'Sunflower seed butter',      allergens: [] },
        { name: 'Hummus (without tahini)',    allergens: [] },
        { name: 'Peanut butter (thinned)',    allergens: ['nuts'] },
      ],
    },
    'honey': {
      reason: 'Vegan alternative',
      options: [
        { name: 'Maple syrup',       allergens: [] },
        { name: 'Agave nectar',      allergens: [] },
        { name: 'Date syrup',        allergens: [] },
        { name: 'Brown rice syrup',  allergens: [] },
      ],
    },
    'maple syrup': {
      reason: 'Lower sugar alternative',
      options: [
        { name: 'Agave nectar',       allergens: [] },
        { name: 'Date syrup',         allergens: [] },
        { name: 'Honey',              allergens: [] },
        { name: 'Stevia + water',     allergens: [] },
      ],
    },
    'basmati rice': {
      reason: 'Lower carb / alternative grain',
      options: [
        { name: 'Cauliflower rice (keto-friendly)', allergens: [] },
        { name: 'Quinoa',                           allergens: [] },
        { name: 'Brown rice',                       allergens: [] },
        { name: 'Farro',                            allergens: ['gluten'] },
      ],
    },
    'jasmine rice': {
      reason: 'Lower carb / alternative grain',
      options: [
        { name: 'Cauliflower rice (keto-friendly)', allergens: [] },
        { name: 'Quinoa',                           allergens: [] },
        { name: 'Brown rice',                       allergens: [] },
      ],
    },
    'sour cream': {
      reason: 'Dairy-free alternative',
      options: [
        { name: 'Coconut cream + lemon juice',  allergens: [] },
        { name: 'Cashew sour cream',            allergens: ['nuts'] },
        { name: 'Vegan sour cream',             allergens: [] },
        { name: 'Greek yogurt (if dairy ok)',   allergens: ['dairy'] },
      ],
    },
    'walnuts': {
      reason: 'Nut-free alternative',
      options: [
        { name: 'Pumpkin seeds',     allergens: [] },
        { name: 'Sunflower seeds',   allergens: [] },
        { name: 'Hemp seeds',        allergens: [] },
        { name: 'Rolled oats (toasted)', allergens: ['gluten'] },
      ],
    },
  };

  /**
   * Retrieves substitution suggestions for a given ingredient name.
   * Filters out suggestions that contain allergens the user is allergic to.
   *
   * @param {string}   ingredientName - Raw ingredient name
   * @param {string[]} userAllergens  - User's allergen list
   * @returns {{ reason: string, options: Object[] }|null}  null if no subs exist
   */
  function getSubstitutions(ingredientName, userAllergens) {
    var key = ingredientName.toLowerCase().trim();
    var entry = DB[key];
    if (!entry) return null;

    var safeOptions = entry.options.filter(function (opt) {
      return !opt.allergens.some(function (a) { return userAllergens.includes(a); });
    });

    if (safeOptions.length === 0) return null;

    return {
      reason: entry.reason,
      options: safeOptions,
    };
  }

  /**
   * Finds all ingredients in a meal plan that have available substitutions.
   * De-duplicates by ingredient name.
   *
   * @param {{ breakfast, lunch, dinner }} mealPlan
   * @param {string[]} userAllergens
   * @returns {Array<{ name: string, reason: string, options: Object[] }>}
   */
  function findSubstitutables(mealPlan, userAllergens) {
    var seen = new Set();
    var result = [];

    Object.values(mealPlan).forEach(function (meal) {
      if (!meal) return;
      meal.ingredients.forEach(function (ing) {
        var key = ing.name.toLowerCase().trim();
        if (seen.has(key)) return;
        seen.add(key);

        var subs = getSubstitutions(ing.name, userAllergens);
        if (subs) {
          result.push({
            name: ing.name,
            reason: subs.reason,
            options: subs.options,
          });
        }
      });
    });

    return result;
  }

  // Public API
  return {
    getSubstitutions: getSubstitutions,
    findSubstitutables: findSubstitutables,
  };
}());
