const KEY = 'zaineen-recently-viewed-v1';
const MAX = 8;

export type RecentItem = {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
};

export const getRecent = (): RecentItem[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
};

export const pushRecent = (item: RecentItem) => {
  try {
    const list = getRecent().filter((i) => i.id !== item.id);
    list.unshift(item);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
    window.dispatchEvent(new Event('zaineen-recent-updated'));
  } catch {}
};
