export const SHOPS_PER_PAGE = 4;

export function paginateShops<T>(shops: readonly T[], requestedPage: number) {
  const pages = Math.max(1, Math.ceil(shops.length / SHOPS_PER_PAGE));
  const page = Math.max(0, Math.min(Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 0, pages - 1));
  return { page, pages, items: shops.slice(page * SHOPS_PER_PAGE, (page + 1) * SHOPS_PER_PAGE) };
}
