export const MENU_CATEGORY_ORDER = [
  'signature_cocktails',
  'spritz',
  'vodka',
  'cognac',
  'whisky',
  'rum',
  'tequila_mezcal',
  'gin',
  'liqueurs',
  'wine',
  'beer',
  'cider',
  'premium_mixers',
  'water',
  'soft_drinks',
  'fresh_juices',
  'hot_beverages',
  'cigars',
] as const;

export const getMenuCategoryRank = (category: string) => {
  const index = MENU_CATEGORY_ORDER.indexOf(category as (typeof MENU_CATEGORY_ORDER)[number]);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

export const sortMenuCategories = <T extends string>(categories: T[]) =>
  [...categories].sort((left, right) => {
    const rankDifference = getMenuCategoryRank(left) - getMenuCategoryRank(right);
    if (rankDifference !== 0) return rankDifference;
    return left.localeCompare(right);
  });
