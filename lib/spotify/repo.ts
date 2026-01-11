// async function getPlaylistTracks(
//   playlistId: string,
//   token: string
// ): Promise<Track[]> {
//   const playlist = await getPlaylist(playlistId, locals.session.access_token);

//   if (playlist.success) {
//     let offset = playlist.data.tracks.items.length;
//     while (offset < playlist.data.tracks.total) {
//       const result = await getPlaylistTracks(
//         playlistId,
//         locals.session.access_token,
//         {
//           offset,
//           limit: 50,
//         }
//       );
//       if (result.success) {
//         playlist.data.tracks.items.push(...result.data.items);
//         offset += result.data.items.length;
//       } else {
//         break;
//       }
//     }
//   }
// }
