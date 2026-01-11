import { HitsterPlaylists } from "../playlists/hitster_playlists";
import { MyPlaylists } from "../playlists/my_playlists";

export default function DefaultPlaylists() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-lg font-semibold">Meine Playlists</h1>
        <MyPlaylists />
      </div>
      <div className="space-y-2">
        <h1 className="text-lg font-semibold">Hitster Playlists</h1>
        <HitsterPlaylists />
      </div>
    </div>
  );
}
