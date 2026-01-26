import { cache } from "react";
import type z from "zod";
import { config } from "@/lib/config";
import type { Result } from "..";
import { createSession, getSession, type Session } from "../session";
import {
  Devices,
  PlaybackState,
  Playlist,
  Profile,
  RefreshTokenResponse,
  SearchPlaylistResponse,
  type SimplifiedPlaylist,
  SimplifiedPlaylistsResponse,
  TokenResponse,
  TracksResponse,
} from "./types";

export type Page = { offset?: number; limit?: number };
const DEFAULT_PAGE: Required<Page> = { offset: 0, limit: 20 };

export const spotifyClient = cache(async (): Promise<SpotifyApiClient> => {
  const session = await getSession();
  if (!session) {
    throw new Error("No valid session");
  }
  return new SpotifyApiClient(session);
});

export class SpotifyApiClient {
  private readonly apiBaseUrl = "https://api.spotify.com/v1";

  private accessToken: string;
  private refreshToken: string;
  private expiry: number;

  constructor(session: Session) {
    this.accessToken = session.accessToken;
    this.refreshToken = session.refreshToken;
    this.expiry = session.expiry;
  }

  get session(): Session {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      expiry: this.expiry,
    };
  }

  set session(session: Session) {
    this.accessToken = session.accessToken;
    this.refreshToken = session.refreshToken;
    this.expiry = session.expiry;
  }

  static async authorizationCode(code: string): Promise<Result<Session>> {
    const tokenData = await SpotifyApiClient.tokenRequest({
      grant_type: "authorization_code",
      code: code,
    });
    if (!tokenData.success) {
      return { success: false, error: tokenData.error };
    }
    return { success: true, data: createSession(tokenData.data) };
  }

  private async apiRequest<T>(
    endpoint: string,
    schema: z.ZodSchema<T> | null,
    options: RequestInit = {},
  ): Promise<Result<T>> {
    const url = `${this.apiBaseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...options.headers,
      },
    });
    if (!response.ok) {
      console.error(
        `Spotify API request failed: ${response.status} ${response.statusText}`,
      );
      return {
        success: false,
        error: `Failed to ${options.method || "GET"} ${endpoint}`,
      };
    }

    if (schema === null) {
      return { success: true, data: null as T };
    }

    const json = await response.json();
    const parseResult = schema.safeParse(json);
    if (!parseResult.success) {
      console.error(
        `Spotify API response parsing failed for ${endpoint}:`,
        parseResult.error,
      );
      return {
        success: false,
        error: `Invalid response from ${endpoint}:\n${parseResult.error.message}`,
      };
    }

    return { success: true, data: parseResult.data };
  }

  private static async tokenRequest(
    params:
      | { grant_type: "authorization_code"; code: string }
      | { grant_type: "refresh_token"; refresh_token: string },
  ): Promise<Result<TokenResponse>> {
    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(
              `${config.spotifyClientId}:${config.spotifyClientSecret}`,
            ).toString("base64"),
        },
        body: new URLSearchParams({
          ...params,
          ...(params.grant_type === "authorization_code"
            ? { redirect_uri: config.spotifyRedirectUri }
            : {}),
        }),
      },
    );

    if (!tokenResponse.ok) {
      return { success: false, error: "Failed to get tokens" };
    }

    const json = await tokenResponse.json();

    let tokenData: z.ZodSafeParseResult<TokenResponse>;
    if (params.grant_type === "authorization_code") {
      tokenData = TokenResponse.safeParse(json);
    } else {
      tokenData = RefreshTokenResponse(params.refresh_token).safeParse(json);
    }
    if (!tokenData.success) {
      return { success: false, error: "Invalid token response" };
    }

    return { success: true, data: tokenData.data };
  }

  isTokenExpired(): boolean {
    return Date.now() >= this.expiry - 60 * 1000; // consider token expired 1 minute before actual expiry
  }

  async refreshTokens(): Promise<Result<Session>> {
    const refreshResult = await SpotifyApiClient.tokenRequest({
      grant_type: "refresh_token",
      refresh_token: this.refreshToken,
    });
    if (!refreshResult.success) {
      return { success: false, error: "Failed to refresh token" };
    }

    const session = createSession(refreshResult.data);
    this.session = session;
    return { success: true, data: session };
  }

  async getProfile(): Promise<Result<Profile>> {
    return this.apiRequest("/me", Profile);
  }

  async getMyPlaylists(
    page: Page = DEFAULT_PAGE,
  ): Promise<Result<SimplifiedPlaylistsResponse>> {
    const { offset, limit } = { ...DEFAULT_PAGE, ...page };
    const params = new URLSearchParams({
      offset: offset.toString(),
      limit: limit.toString(),
    });
    return this.apiRequest(
      `/me/playlists?${params}`,
      SimplifiedPlaylistsResponse,
    );
  }

  async getUserPlaylists(
    userId: string,
    page: Page = DEFAULT_PAGE,
  ): Promise<Result<SimplifiedPlaylistsResponse>> {
    const { offset, limit } = { ...DEFAULT_PAGE, ...page };
    const params = new URLSearchParams({
      offset: offset.toString(),
      limit: limit.toString(),
    });
    return this.apiRequest(
      `/users/${userId}/playlists?${params}`,
      SimplifiedPlaylistsResponse,
    );
  }

  private trackFields =
    "track(id,name,is_playable,is_local,artists(name),album(name,images,release_date))";

  async getPlaylist(playlistId: string): Promise<Result<Playlist>> {
    const params = new URLSearchParams({
      fields: `id,name,images,tracks(items(${this.trackFields}),total,limit,offset)`,
    });
    return this.apiRequest(`/playlists/${playlistId}?${params}`, Playlist);
  }

  async getPlaylistTracks(
    playlistId: string,
    page: Page = DEFAULT_PAGE,
  ): Promise<Result<TracksResponse>> {
    const { offset, limit } = { ...DEFAULT_PAGE, ...page };
    const params = new URLSearchParams({
      offset: offset.toString(),
      limit: limit.toString(),
      fields: `items(${this.trackFields}),total,limit,offset`,
    });
    return this.apiRequest(
      `/playlists/${playlistId}/tracks?${params}`,
      TracksResponse,
    );
  }

  async getDevices(): Promise<Result<Devices>> {
    return this.apiRequest("/me/player/devices", Devices);
  }

  async setDevice(deviceId: string): Promise<Result<null>> {
    const response = await this.apiRequest(`/me/player`, null, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        device_ids: [deviceId],
      }),
    });
    return response.success ? { success: true, data: null } : response;
  }

  async playbackState(): Promise<Result<PlaybackState>> {
    return this.apiRequest("/me/player", PlaybackState);
  }

  async play(trackId?: string): Promise<Result<null>> {
    const response = await this.apiRequest(`/me/player/play`, null, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uris: trackId ? [`spotify:track:${trackId}`] : undefined,
      }),
    });
    return response.success ? { success: true, data: null } : response;
  }

  async pause(): Promise<Result<null>> {
    const response = await this.apiRequest(`/me/player/pause`, null, {
      method: "PUT",
    });
    return response.success ? { success: true, data: null } : response;
  }

  async searchPlaylist(
    query: string,
    page: Page = DEFAULT_PAGE,
  ): Promise<Result<SimplifiedPlaylistsResponse>> {
    const { offset, limit } = { ...DEFAULT_PAGE, ...page };
    const params = new URLSearchParams({
      q: query,
      type: "playlist",
      offset: offset.toString(),
      limit: limit.toString(),
    });
    const result = await this.apiRequest(
      `/search?${params}`,
      SearchPlaylistResponse,
    );
    if (!result.success) {
      return result;
    }
    return {
      success: true,
      data: {
        ...result.data.playlists,
        items: result.data.playlists.items.filter(
          (i): i is SimplifiedPlaylist => i !== null,
        ),
      },
    };
  }
}
