function getEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === null) {
    throw new Error(`Environment variable ${name} is not defined`);
  }
  return value;
}

export const config = {
  spotifyClientId: getEnvironmentVariable("SPOTIFY_CLIENT_ID"),
  spotifyClientSecret: getEnvironmentVariable("SPOTIFY_CLIENT_SECRET"),
  spotifyRedirectUri: getEnvironmentVariable("SPOTIFY_REDIRECT_URI"),
};
