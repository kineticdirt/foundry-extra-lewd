import CONSTANTS from '../module/constants.js';

export class SoundLinker {
	static initialize() {
		SoundLinker.hookCanvasDrop();
		SoundLinker.hookRenderAmbientSoundConfig();
		SoundLinker.hookAmbientSoundPlayback();
		SoundLinker.hookRenderPlaylistDirectory();

		// Hook into sound creation to detect when a track ends
		Hooks.on('ready', () => {
			SoundLinker.patchAmbientSound();
		});
	}

	static patchAmbientSound() {
		const originalCreateSound = AmbientSound.prototype._createSound;
		AmbientSound.prototype._createSound = function () {
			const sound = originalCreateSound.apply(this, arguments);
			if (sound) {
				sound.on('end', () => {
					SoundLinker.onSoundEnd(this);
				});
			}
			return sound;
		};
	}

	static async onSoundEnd(ambientSound) {
		// Only the GM should update the sound to avoid conflicts
		if (!game.user.isGM) return;

		const playlistId = ambientSound.document.getFlag(CONSTANTS.MODULE_NAME, 'playlistId');
		const playlistMode = ambientSound.document.getFlag(CONSTANTS.MODULE_NAME, 'playlistMode');

		if (playlistId && playlistMode) {
			const playlist = game.playlists.get(playlistId);
			if (playlist && playlist.sounds.size > 0) {
				// Get current sound path
				const currentPath = ambientSound.document.path;

				// Find current index
				const sounds = Array.from(playlist.sounds);
				const currentIndex = sounds.findIndex(s => s.path === currentPath);

				// Pick next index (looping)
				let nextIndex = currentIndex + 1;
				if (nextIndex >= sounds.length) {
					nextIndex = 0;
				}

				const nextSound = sounds[nextIndex];

				// Update the AmbientSound document with the new path
				// This will trigger a refresh on all clients
				await ambientSound.document.update({
					path: nextSound.path,
					flags: {
						[CONSTANTS.MODULE_NAME]: {
							currentTrackIndex: nextIndex
						}
					}
				});
			}
		}
	}

	static hookRenderPlaylistDirectory() {
		Hooks.on('renderPlaylistDirectory', (app, html, data) => {
			console.log("SoundLinker | renderPlaylistDirectory fired");
			// Make playlists draggable onto the canvas
			const items = html.find('.directory-item');
			console.log(`SoundLinker | Found ${items.length} playlist items`);

			items.each((index, element) => {
				const $item = $(element);
				const playlistId = $item.data('document-id');
				if (playlistId) {
					$item.attr('draggable', 'true');
					$item.on('dragstart', (ev) => {
						console.log(`SoundLinker | Drag started for playlist ${playlistId}`);
						ev.originalEvent.dataTransfer.setData('text/plain', JSON.stringify({
							type: 'Playlist',
							playlistId: playlistId
						}));
						ev.originalEvent.dataTransfer.effectAllowed = 'copy';
					});
				}
			});
		});
	}

	static hookRenderAmbientSoundConfig() {
		Hooks.on('renderAmbientSoundConfig', (app, html, data) => {
			console.log("SoundLinker | renderAmbientSoundConfig fired");
			const playlistSelect = $(`
        <div class="form-group">
          <label>${game.i18n.localize(`${CONSTANTS.MODULE_NAME}.SelectPlaylist`)}</label>
          <select name="playlist-select" style="width: 100%;">
            <option value="">${game.i18n.localize(`${CONSTANTS.MODULE_NAME}.NoPlaylist`)}</option>
          </select>
          <p class="notes">${game.i18n.localize(`${CONSTANTS.MODULE_NAME}.SelectPlaylistHint`)}</p>
        </div>
      `);

			const select = playlistSelect.find('select');
			const playlists = game.playlists?.contents || [];

			playlists.forEach(playlist => {
				const option = $(`<option value="${playlist.id}">${playlist.name}</option>`);
				const currentPlaylistId = app.object.getFlag(CONSTANTS.MODULE_NAME, 'playlistId');
				if (currentPlaylistId === playlist.id) {
					option.attr('selected', 'selected');
				}
				select.append(option);
			});

			const target = html.find('input[name="path"]').closest('.form-group');
			if (target.length) {
				console.log("SoundLinker | Injecting playlist selector");
				target.before(playlistSelect);
			} else {
				console.warn("SoundLinker | Could not find input[name='path'] to inject selector");
				// Fallback: try appending to the end of the form
				html.find('form').append(playlistSelect);
			}

			select.on('change', async (ev) => {
				const playlistId = select.val();
				if (playlistId) {
					const playlist = game.playlists?.get(playlistId);
					if (playlist && playlist.sounds.size > 0) {
						const firstSound = playlist.sounds.contents[0];
						html.find('input[name="path"]').val(firstSound.path);
						await app.object.setFlag(CONSTANTS.MODULE_NAME, 'playlistId', playlistId);
						await app.object.setFlag(CONSTANTS.MODULE_NAME, 'playlistMode', true);
					}
				} else {
					await app.object.unsetFlag(CONSTANTS.MODULE_NAME, 'playlistId');
					await app.object.unsetFlag(CONSTANTS.MODULE_NAME, 'playlistMode');
				}
			});
		});
	}

	static hookCanvasDrop() {
		Hooks.on('canvasDrop', async (canvas, data) => {
			try {
				const dropData = data;
				if (dropData.type === 'Playlist' && dropData.playlistId) {
					const playlist = game.playlists?.get(dropData.playlistId);
					if (!playlist || !playlist.sounds || playlist.sounds.size === 0) {
						ui.notifications.warn("Playlist is empty or not found.");
						return false;
					}

					const coords = canvas.grid.getSnappedPosition(data.x, data.y);
					const firstSound = playlist.sounds.contents[0];

					const ambientSoundData = {
						t: 'l',
						x: coords.x,
						y: coords.y,
						radius: 20,
						path: firstSound.path,
						volume: firstSound.volume || 0.5,
						easing: true,
						hidden: false,
						locked: false,
						flags: {
							[CONSTANTS.MODULE_NAME]: {
								playlistId: playlist.id,
								playlistMode: true
							}
						}
					};

					await canvas.scene.createEmbeddedDocuments('AmbientSound', [ambientSoundData]);
					ui.notifications.info(`Created Ambient Sound for playlist: ${playlist.name}`);
					return false;
				}
			} catch (error) {
				// Ignore errors
			}
			return true;
		});
	}

	static hookAmbientSoundPlayback() {
		// We don't want to intercept playback anymore, we want to let it play the current track
		// and then switch to the next one when it ends.
		// So we REMOVE the previous logic that called playlist.playAll()

		// However, we might want to ensure that if a sound is clicked in the playlist UI, it doesn't conflict?
		// No, this hook was 'playAmbientSound', which is triggered when the AmbientSound object starts playing.

		// If we want to support "Random" mode vs "Sequential", we could add that flag later.
		// For now, we just let the default behavior happen (play the 'path'), and our 'end' listener handles the rest.
	}
}
