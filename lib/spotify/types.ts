import z from "zod";

export function Paginated<T extends z.ZodType>(recordSchema: T) {
  return z.object({
    items: z.array(recordSchema),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
  });
}

export const TokenResponse = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  refresh_token: z.string(),
  scope: z.string(),
});

export type TokenResponse = z.infer<typeof TokenResponse>;

export const RefreshTokenResponse = (refresh_token: string) =>
  TokenResponse.extend({
    refresh_token: z.string().optional().default(refresh_token),
  });

export const Image = z.object({
  url: z.string(),
  height: z.number().nullable(),
  width: z.number().nullable(),
});
export type Image = z.infer<typeof Image>;

export const Profile = z.object({
  country: z.string(),
  display_name: z.string().nullable(),
  id: z.string(),
  images: z.array(Image),
});
export type Profile = z.infer<typeof Profile>;

export const SimplifiedPlaylist = z.object({
  id: z.string(),
  name: z.string(),
  images: z.array(Image),
});
export type SimplifiedPlaylist = z.infer<typeof SimplifiedPlaylist>;

export const SimplifiedPlaylistsResponse = Paginated(SimplifiedPlaylist);
export type SimplifiedPlaylistsResponse = z.infer<
  typeof SimplifiedPlaylistsResponse
>;

export const SearchPlaylistResponse = z.object({
  playlists: Paginated(z.nullable(SimplifiedPlaylist)),
});
export type SearchPlaylistResponse = z.infer<typeof SearchPlaylistResponse>;

export const Track = z.object({
  id: z.string(),
  name: z.string(),
  is_playable: z.boolean().default(true),
  is_local: z.boolean(),
  artists: z.array(
    z.object({
      name: z.string(),
    }),
  ),
  album: z.object({
    name: z.string(),
    release_date: z.string(),
    images: z.array(Image),
  }),
});
export type Track = z.infer<typeof Track>;

export const TracksResponse = Paginated(z.object({ track: Track }));
export type TracksResponse = z.infer<typeof TracksResponse>;

export const Playlist = SimplifiedPlaylist.extend({
  tracks: TracksResponse,
});
export type Playlist = z.infer<typeof Playlist>;

export const Devices = z.object({
  devices: z.array(
    z.object({
      id: z.string().nullable(),
      is_active: z.boolean(),
      is_private_session: z.boolean(),
      is_restricted: z.boolean(),
      name: z.string(),
      type: z.string(),
      volume_percent: z.number().nullable(),
      supports_volume: z.boolean(),
    }),
  ),
});
export type Devices = z.infer<typeof Devices>;

export const PlaybackState = z.object({
  is_playing: z.boolean(),
  progress_ms: z.number().nullable(),
  item: Track.nullable(),
});
export type PlaybackState = z.infer<typeof PlaybackState>;
