export const PAGE_IDS = [
  'home',
  'outreach',
  'progress',
  'learning',
  'fitness',
  'trading',
  'method',
  'setup',
] as const;

export type PageId = (typeof PAGE_IDS)[number];

export const PAGE_LABELS: Readonly<Record<PageId, string>> = {
  home: 'Today',
  outreach: 'Outreach',
  progress: 'Progress',
  learning: 'Learning',
  fitness: 'Fitness',
  trading: 'Trading',
  method: 'Method',
  setup: 'Setup',
};

/** The pages in the tab bar and the top bar. "More" holds the other pages. */
export const PRIMARY_PAGES: readonly PageId[] = ['home', 'outreach', 'progress'];
export const MORE_PAGES: readonly PageId[] = ['learning', 'fitness', 'trading', 'method', 'setup'];

export interface Route {
  page: PageId;
  /** The parts of the route after the page, for example "day" in #/trading/day. */
  segments: string[];
}

function isPageId(value: string | undefined): value is PageId {
  return PAGE_IDS.some((page) => page === value);
}

function parts(hash: string): string[] {
  return hash
    .replace(/^#\/?/, '')
    .split('/')
    .map((part) => {
      try {
        return decodeURIComponent(part);
      } catch {
        return part;
      }
    })
    .filter((part) => part !== '');
}

/** Old routes that moved. The Calendar is now the "Days" tab of Progress. */
const MOVED: Readonly<Record<string, readonly string[]>> = {
  calendar: ['progress', 'days'],
};

/** The cards on Today that open into an expanded view, and the id in the route #/home/<id>. */
export const EXPAND_IDS = ['outreach', 'fitness', 'learning', 'reading', 'trading', 'signoff', 'progress'] as const;
export type ExpandId = (typeof EXPAND_IDS)[number];

export function isExpandId(value: unknown): value is ExpandId {
  return EXPAND_IDS.some((id) => id === value);
}

/** The expanded view of a route: #/home/outreach gives "outreach". Any other route gives null. */
export function expandedFrom(route: Route): ExpandId | null {
  const first = route.segments[0];
  return route.page === 'home' && isExpandId(first) ? first : null;
}

/** Closing a view: go back when the app pushed the entry, else replace the hash with #/home. */
export function closeAction(openedByPush: boolean): 'back' | 'replace' {
  return openedByPush ? 'back' : 'replace';
}

/**
 * The new hash for a route that moved, for example "#/calendar/2026-10-21" gives
 * "#/progress/days/2026-10-21". Null when the route did not move.
 */
export function redirectHash(hash: string): string | null {
  const [first, ...rest] = parts(hash);
  // #/home/foo is not a view: show Today and clean the hash.
  if (first === 'home' && rest.length > 0 && !isExpandId(rest[0])) {
    return '#/home';
  }
  const target = first === undefined ? undefined : MOVED[first];
  if (!target) {
    return null;
  }
  // The old "template" tab is now Setup → Week.
  if (first === 'calendar' && rest[0] === 'template') {
    return '#/setup/week';
  }
  return `#/${[...target, ...rest].map(encodeURIComponent).join('/')}`;
}

/** Reads a hash route. A moved route gives its new page. An unknown route gives the Today page. */
export function parseRoute(hash: string): Route {
  const moved = redirectHash(hash);
  const [page, ...segments] = parts(moved ?? hash);
  if (!isPageId(page)) {
    return { page: 'home', segments: [] };
  }
  return { page, segments };
}

export function routeHref(page: PageId, ...segments: string[]): string {
  return `#/${[page, ...segments].map(encodeURIComponent).join('/')}`;
}
