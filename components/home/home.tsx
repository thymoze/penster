"use client";

import { InfoIcon, SearchIcon, XIcon } from "lucide-react";
import {
  startTransition,
  useActionState,
  useCallback,
  useDeferredValue,
  useEffect,
  useState,
} from "react";
import type { Result } from "@/lib";
import type { Page } from "@/lib/spotify/api";
import type { SimplifiedPlaylistsResponse } from "@/lib/spotify/types";
import { Playlists } from "../playlists/playlists";
import { Alert, AlertDescription } from "../ui/alert";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../ui/input-group";
import { Spinner } from "../ui/spinner";

const DEFAULT_SEARCH_RESULT: Result<SimplifiedPlaylistsResponse> = {
  success: true,
  data: { items: [], limit: 0, offset: 0, total: 0 },
};

export default function Home({
  profile,
  playlists,
  searchAction,
}: {
  profile: React.ReactNode;
  playlists: React.ReactNode;
  searchAction: (
    query: string,
    page?: Page,
  ) => Promise<Result<SimplifiedPlaylistsResponse>>;
}) {
  const [query, setQuery] = useState("");
  const [debouncedIsEmpty, setDebouncedIsEmpty] = useState(query === "");

  const [searchResults, search, isSearching] = useActionState(
    async (_prev: unknown, query: string) =>
      query === ""
        ? DEFAULT_SEARCH_RESULT
        : searchAction(query, { offset: 0, limit: 24 }),
    DEFAULT_SEARCH_RESULT,
  );

  const loadMore = useDeferredValue(
    useCallback(
      async (offset: number) => searchAction(query, { offset, limit: 24 }),
      [query, searchAction],
    ),
  );

  useEffect(() => {
    const fn = () => {
      setDebouncedIsEmpty(query === "");
      startTransition(() => search(query));
    };

    if (query === "") {
      // clear immediately
      fn();
      return;
    }

    const timeout = setTimeout(fn, 400);
    return () => clearTimeout(timeout);
  }, [query, search]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="w-full p-4 border-b border-b-muted">
        <div className="max-w-7xl mx-auto grid grid-cols-[1fr_auto] md:grid-cols-[1fr_minmax(0,3fr)_1fr] place-items-center gap-4">
          <div className="hidden md:block"></div>

          <InputGroup className="rounded-full">
            <InputGroupInput
              placeholder="Suche"
              className="w-full"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            {query !== "" && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  className="rounded-full"
                  onClick={(e) => {
                    setQuery("");
                    e.currentTarget.parentElement?.parentElement
                      ?.querySelector("input")
                      ?.focus();
                  }}
                >
                  <XIcon />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>

          {profile}
        </div>
      </header>
      <div className="flex-1 bg-card rounded-md">
        <main className="max-w-7xl mx-auto w-full p-4">
          {query !== "" && !debouncedIsEmpty ? (
            isSearching ? (
              <div className="flex justify-center py-16">
                <Spinner className="size-16" />
              </div>
            ) : (
              <>
                <Alert className="w-fit mx-auto mb-4">
                  <InfoIcon />
                  <AlertDescription>
                    Empfehlungen und offizielle Spotify-Playlists können nicht
                    angezeigt werden. Diese müssen vorher in eine User-Playlist
                    kopiert werden.
                  </AlertDescription>
                </Alert>
                <Playlists playlists={searchResults} loadMore={loadMore} />
              </>
            )
          ) : (
            playlists
          )}
        </main>
      </div>
    </div>
  );
}
