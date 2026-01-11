import { AlertCircleIcon } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SPOTIFY_SCOPES, SPOTIFY_STATE_COOKIE } from "@/lib/spotify/auth";

export default async function Login({ searchParams }: PageProps<"/login">) {
  async function redirectToSpotify() {
    "use server";
    const state = crypto.randomUUID();
    const cookieStorage = await cookies();
    cookieStorage.set(SPOTIFY_STATE_COOKIE, state);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.SPOTIFY_CLIENT_ID!,
      scope: SPOTIFY_SCOPES,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
      state,
    });

    return redirect(`https://accounts.spotify.com/authorize?${params}`);
  }

  const error = (await searchParams).error;

  return (
    <form
      action={redirectToSpotify}
      className="flex flex-col items-center min-h-screen justify-center"
    >
      <Button
        size="lg"
        className="bg-[#1ed760] hover:bg-[#3be377] text-lg h-12"
      >
        Spotify verbinden
      </Button>
      {error && (
        <Alert variant="destructive" className="mt-4 w-64">
          <AlertCircleIcon />
          <AlertDescription>
            Anmeldung fehlgeschlagen. Bitte versuche es erneut.
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}
