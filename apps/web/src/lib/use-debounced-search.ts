import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

const SEARCH_DEBOUNCE_MS = 400;

/**
 * Keeps a search box responsive while committing the (trimmed) text to the URL only after
 * the user pauses typing. A URL change that did not come from this box (Back/Forward)
 * is copied into the box.
 */
export function useDebouncedSearch(
  committedSearch: string,
  commit: (search: string) => void,
): readonly [string, (search: string) => void] {
  const [searchInput, setSearchInput] = useState(committedSearch);
  const [seenSearch, setSeenSearch] = useState(committedSearch);
  const [dispatchedSearch, setDispatchedSearch] = useState(committedSearch);

  const commitSearch = useDebouncedCallback((search: string) => {
    if (search !== committedSearch) {
      setDispatchedSearch(search);
      commit(search);
    }
  }, SEARCH_DEBOUNCE_MS);

  // Adjusting state while rendering is React's way to derive it from changed props.
  if (committedSearch !== seenSearch) {
    setSeenSearch(committedSearch);
    if (committedSearch !== dispatchedSearch) {
      setDispatchedSearch(committedSearch);
      setSearchInput(committedSearch);
    }
  }

  function changeSearch(search: string): void {
    setSearchInput(search);
    commitSearch(search.trim());
  }

  return [searchInput, changeSearch];
}
