import { cache } from "react";
import z from "zod";
import type { Result } from "..";
import { getSession } from "../session";
import {
  Devices,
  Playlist,
  Profile,
  RefreshTokenResponse,
  SearchPlaylistResponse,
  SimplifiedPlaylist,
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
  return new SpotifyApiClient(
    session.access_token,
    session.refresh_token,
    session.expiry,
    async (_token) => {
      // await createSession(token);
    }
  );
});

export class SpotifyApiClient {
  private readonly apiBaseUrl = "https://api.spotify.com/v1";

  constructor(
    private accessToken: string,
    private refreshToken: string,
    private expiry: number,
    private onTokenRefresh: (token: TokenResponse) => void
  ) {
    this.expiry = expiry - 5 * 60 * 1000; // 5 min buffer
  }

  static async withAuthorizationCode(
    code: string,
    onTokenRefresh: (token: TokenResponse) => void
  ): Promise<Result<SpotifyApiClient>> {
    const tokenData = await SpotifyApiClient.tokenRequest({
      grant_type: "authorization_code",
      code: code,
    });
    if (!tokenData.success) {
      return { success: false, error: tokenData.error };
    }
    const client = new SpotifyApiClient(
      tokenData.data.access_token,
      tokenData.data.refresh_token,
      Date.now() + tokenData.data.expires_in * 1000,
      onTokenRefresh
    );
    onTokenRefresh(tokenData.data);
    return { success: true, data: client };
  }

  private async apiRequest<T>(
    endpoint: string,
    schema: z.ZodSchema<T>,
    options: RequestInit = {}
  ): Promise<Result<T>> {
    let retry = true;

    if (Date.now() >= this.expiry) {
      const refreshResult = await this.refreshTokens();
      if (refreshResult.success) {
        retry = false;
      }
    }

    let response: Response;
    do {
      const url = `${this.apiBaseUrl}${endpoint}`;
      response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          ...options.headers,
        },
      });
      if (response.ok) {
        break;
      }

      if (retry && response.status === 401) {
        const refreshResult = await this.refreshTokens();
        if (!refreshResult.success) {
          return refreshResult;
        }
        retry = false;
      } else {
        return {
          success: false,
          error: `Failed to ${options.method || "GET"} ${endpoint}`,
        };
      }
    } while (retry);

    const json = await response.json();
    const parseResult = schema.safeParse(json);
    if (!parseResult.success) {
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
      | { grant_type: "refresh_token"; refresh_token: string }
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
              `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
            ).toString("base64"),
        },
        body: new URLSearchParams({
          ...params,
          ...(params.grant_type === "authorization_code"
            ? { redirect_uri: process.env.SPOTIFY_REDIRECT_URI }
            : {}),
        }),
      }
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

  async isTokenValid(): Promise<boolean> {
    if (Date.now() >= this.expiry) {
      const refreshResult = await this.refreshTokens();
      return refreshResult.success;
    }
    return true;
  }

  async refreshTokens(): Promise<Result<TokenResponse>> {
    const refreshResult = await SpotifyApiClient.tokenRequest({
      grant_type: "refresh_token",
      refresh_token: this.refreshToken,
    });
    if (!refreshResult.success) {
      return { success: false, error: "Failed to refresh token" };
    }

    this.accessToken = refreshResult.data.access_token;
    this.refreshToken = refreshResult.data.refresh_token;
    this.expiry = Date.now() + (refreshResult.data.expires_in - 5 * 60) * 1000;
    this.onTokenRefresh(refreshResult.data);
    return { success: true, data: refreshResult.data };
  }

  async getProfile(): Promise<Result<Profile>> {
    return this.apiRequest("/me", Profile);
  }

  async getMyPlaylists(
    page: Page = DEFAULT_PAGE
  ): Promise<Result<SimplifiedPlaylistsResponse>> {
    const { offset, limit } = { ...DEFAULT_PAGE, ...page };
    const params = new URLSearchParams({
      offset: offset.toString(),
      limit: limit.toString(),
    });
    return this.apiRequest(
      `/me/playlists?${params}`,
      SimplifiedPlaylistsResponse
    );
  }

  async getUserPlaylists(
    userId: string,
    page: Page = DEFAULT_PAGE
  ): Promise<Result<SimplifiedPlaylistsResponse>> {
    const { offset, limit } = { ...DEFAULT_PAGE, ...page };
    const params = new URLSearchParams({
      offset: offset.toString(),
      limit: limit.toString(),
    });
    return this.apiRequest(
      `/users/${userId}/playlists?${params}`,
      SimplifiedPlaylistsResponse
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
    page: Page = DEFAULT_PAGE
  ): Promise<Result<TracksResponse>> {
    const { offset, limit } = { ...DEFAULT_PAGE, ...page };
    const params = new URLSearchParams({
      offset: offset.toString(),
      limit: limit.toString(),
      fields: `items(${this.trackFields}),total,limit,offset`,
    });
    return this.apiRequest(
      `/playlists/${playlistId}/tracks?${params}`,
      TracksResponse
    );
  }

  async getDevices(): Promise<Result<Devices>> {
    return this.apiRequest("/me/player/devices", Devices);
  }

  async playTrack(trackId: string): Promise<Result<null>> {
    const response = await this.apiRequest(`/me/player/play`, z.any(), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uris: [`spotify:track:${trackId}`],
      }),
    });
    return response.success ? { success: true, data: null } : response;
  }

  async searchPlaylist(
    query: string,
    page: Page = DEFAULT_PAGE
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
      SearchPlaylistResponse
    );
    if (!result.success) {
      return result;
    }
    return {
      success: true,
      data: {
        ...result.data.playlists,
        items: result.data.playlists.items.filter(
          (i): i is SimplifiedPlaylist => i !== null
        ),
      },
    };
  }
}
