import { LogOutIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { clearSession } from "@/lib/session";
import { spotifyClient } from "@/lib/spotify/api";
import { Button } from "../ui/button";

async function logout() {
  "use server";
  await clearSession();
  return redirect("/login");
}

export default async function Profile() {
  const spotify = await spotifyClient();
  const profile = await spotify.getProfile();

  return (
    <div className="flex items-center justify-end justify-self-end gap-2">
      {profile.success ? (
        <img
          src={profile.data.images[0]?.url}
          alt="Profile"
          className="size-9 rounded-lg inline-block"
        />
      ) : (
        <span className="text-destructive">
          Profil konnte nicht geladen werden
        </span>
      )}
      <form action={logout}>
        <Button variant="outline" size="icon" title="Logout">
          <LogOutIcon />
        </Button>
      </form>
    </div>
  );
}
