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

	static hookRenderAmbientSoundConfig() {
		Hooks.on('renderAmbientSoundConfig', (app, html, data) => {
			const playlistSelect = $(`
				<div class="form-group">
					<label>Linked Playlist</label>
					<div class="form-fields">
						<select name="flags.${CONSTANTS.MODULE_NAME}.playlistId">
							<option value="">None</option>
						</select>
					</div>
					<p class="notes">Select a playlist to cycle through its tracks.</p>
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

			const $html = $(html);
			const target = $html.find('input[name="path"]').closest('.form-group');
			if (target.length) {
				target.before(playlistSelect);
			} else {
				$html.find('form').append(playlistSelect);
			}

			select.on('change', async (ev) => {
				const playlistId = select.val();
				if (playlistId) {
					const playlist = game.playlists?.get(playlistId);
					if (playlist && playlist.sounds.size > 0) {
						const firstSound = playlist.sounds.contents[0];
						$html.find('input[name="path"]').val(firstSound.path);
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

	static hookRenderPlaylistDirectory() {
		Hooks.on('renderPlaylistDirectory', (app, html, data) => {
			const $html = $(html);
			$html.find('.playlist-name').attr('draggable', true).on('dragstart', (ev) => {
				const playlistId = $(ev.currentTarget).parents('.playlist').data('documentId');
				const playlist = game.playlists.get(playlistId);

				if (playlist) {
					const dragData = {
						type: 'Playlist',
						playlistId: playlist.id
					};
					ev.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(dragData));
				}
			});
		});
	}

	static hookCanvasDrop() {
		Hooks.on('canvasDrop', async (canvas, data) => {
			try {
				// Handle both raw data and parsed data
				let dropData = data;

				// If data is not an object, try to parse it (though Foundry usually parses it)
				// But for our custom drag event, we might need to handle it.
				// However, Foundry's canvasDrop hook usually provides the parsed data object.

				if (dropData.type === 'Playlist' && dropData.playlistId) {
					const playlist = game.playlists?.get(dropData.playlistId);
					if (!playlist || !playlist.sounds || playlist.sounds.size === 0) {
						ui.notifications.warn("Playlist is empty or not found.");
						return false;
					}

					// Get position
					// data.x and data.y are usually present in canvasDrop data
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
					return false; // Prevent default
				}
			} catch (error) {
				console.error("SoundLinker | Error in canvasDrop:", error);
			}
			return true;
		});
	}

	static hookAmbientSoundPlayback() {
		// Placeholder for future logic
	}
}
