import CONSTANTS from './module/constants.js';
import { CompendiumBuilder } from './scripts/compendium-builder.js';
import { ClothingHUD } from './scripts/clothing-hud.js';
import { SoundLinker } from './scripts/sound-linker.js';
import { PDFConverter } from './scripts/pdf-converter.js';
import { ClothingSystem } from './scripts/clothing-system.js';
import { ChatSystem } from './scripts/chat-system.js';

/*  --------------------------------------  */
/*            Initialization                */
/*  --------------------------------------  */

Hooks.once('init', () => {
	console.log(`${CONSTANTS.MODULE_NAME} | Initializing module`);

	// Initialize Subsystems
	SoundLinker.initialize();
	CompendiumBuilder.initialize();
	PDFConverter.initialize();
	ChatSystem.initialize();
	ClothingSystem.initialize();

	// Register Settings
	// registerSettings(); // Moved to ready hook to ensure it runs
});

Hooks.once('ready', () => {
	console.log(`${CONSTANTS.MODULE_NAME} | Ready`);

	// Register Settings
	registerSettings();

	// Initialize Playlist Importer (Legacy support)
	PLIMP.playlistImporter = new PlaylistImporter();

	// ============================================
	// CLOTHING HUD INITIALIZATION
	// ============================================
	// Create the HUD instance but DO NOT render it yet
	// It will only render when a token is selected via the bind() method
	// This ensures it NEVER appears in Settings or other windows
	ui.clothingHUD = new ClothingHUD();
	// DO NOT call render() here - it will render when token is selected

	// ============================================
	// TOKEN SELECTION HOOK - Only fires when selecting/deselecting tokens
	// ============================================
	// This hook ONLY fires when tokens are selected on the canvas
	// It does NOT fire for Settings, Actor sheets, or other windows
	Hooks.on('controlToken', (token, controlled) => {
		if (controlled && token?.actor?.isOwner) {
			// Token was selected - show the HUD on the right side
			ui.clothingHUD.bind(token);
		} else {
			// Token was deselected - check if other tokens are still selected
			const controlledTokens = canvas.tokens?.controlled || [];
			if (controlledTokens.length > 0) {
				const firstToken = controlledTokens.find(t => t.actor?.isOwner);
				if (firstToken) {
					// Another token is selected - bind to that one
					ui.clothingHUD.bind(firstToken);
				} else {
					// No owned tokens selected - hide HUD
					ui.clothingHUD.bind(null);
				}
			} else {
				// No tokens selected - hide HUD
				ui.clothingHUD.bind(null);
			}
		}
	});

	// ============================================
	// CANVAS READY HOOK - Check for already-selected tokens when canvas loads
	// ============================================
	// This only fires once when the canvas is ready
	// It checks if tokens are already selected and shows HUD if so
	Hooks.once('canvasReady', () => {
		const controlledTokens = canvas.tokens?.controlled || [];
		if (controlledTokens.length > 0) {
			const firstToken = controlledTokens.find(t => t.actor?.isOwner);
			if (firstToken) {
				setTimeout(() => {
					ui.clothingHUD.bind(firstToken);
				}, 500);
			}
		}
	});

	// Update HUD when actor updates
	Hooks.on('updateActor', (actor) => {
		if (ui.clothingHUD?._actor === actor) ui.clothingHUD.render();
	});

	// Register other hook listeners
	PlaylistImporterInitializer.hookDeletePlaylist();
	PlaylistImporterInitializer.hookDeletePlaylistSound();
	PlaylistImporterInitializer.hookRenderSettings();
});

/*  --------------------------------------  */
/*           Legacy / Helper Classes        */
/*  --------------------------------------  */

// Keeping these for now to avoid breaking existing logic, but refactored slightly
class PlaylistImporterInitializer {
	static _removeSound(playlistName, soundNames) {
		const currentList = game.settings.get(CONSTANTS.MODULE_NAME, 'songs');
		soundNames.forEach((soundName) => {
			const trackName = PlaylistImporter._convertToUserFriendly(PlaylistImporter._getBaseName(soundName));
			const mergedName = (playlistName + trackName).toLowerCase();
			if (trackName && playlistName) {
				if (currentList[mergedName]) {
					delete currentList[mergedName];
				}
			}
		});
		game.settings.set(CONSTANTS.MODULE_NAME, 'songs', currentList);
	}

	static hookDeletePlaylist() {
		Hooks.on('deletePlaylist', (playlist, flags, id) => {
			const playlistName = playlist.name;
			const soundObjects = playlist.sounds;
			const sounds = [];
			for (let i = 0; i < soundObjects.length; ++i) {
				sounds.push(soundObjects[i].path);
			}
			PlaylistImporterInitializer._removeSound(playlistName, sounds);
		});
	}

	static hookDeletePlaylistSound() {
		Hooks.on('deletePlaylistSound', (playlist, data, flags, id) => {
			const playlistName = playlist.name;
			const soundName = data.path;
			PlaylistImporterInitializer._removeSound(playlistName, [soundName]);
		});
	}

	static hookRenderSettings() {
		Hooks.on('renderSettings', (app, html) => {
			const clearMemoryString = game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ClearMemory`);
			const importButton = $(`<button>${clearMemoryString}</button>`);
			if (game.user?.isGM || game.user?.can('SETTINGS_MODIFY')) {
				const $html = $(html);
				$html.find("button[data-action='players']").after(importButton);
				importButton.click((ev) => {
					PLIMP.playlistImporter.clearMemoryInterface();
				});
			}
		});
	}
}

class PlaylistImporter {
	constructor() {
		this.DEBUG = false;
	}

	static _getBaseName(filePath) {
		return filePath.split('/').reverse()[0];
	}

	_validateFileType(fileName) {
		const ext = fileName.split('.').pop();
		return !!ext.match(/(mp3|wav|ogg|flac|webm|m4a)+/g);
	}

	static _convertCamelCase(match, p1, p2, p3, offset, input_string) {
		let replace;
		const small = ['a', 'an', 'at', 'and', 'but', 'by', 'for', 'if', 'nor', 'on', 'of', 'or', 'so', 'the', 'to', 'yet'];
		if (p3) {
			if (small.includes(p2.toLowerCase())) {
				p2 = p2.toLowerCase();
			}
			replace = p1 + ' ' + p2 + ' ' + p3;
		} else {
			replace = p1 + ' ' + p2;
		}
		return replace;
	}

	static _convertToUserFriendly(name) {
		let words = [];
		const small = ['a', 'an', 'at', 'and', 'but', 'by', 'for', 'if', 'nor', 'on', 'of', 'or', 'so', 'the', 'to', 'yet'];
		const regexReplace = new RegExp(game.settings?.get(CONSTANTS.MODULE_NAME, 'customRegexDelete'));
		name = decodeURIComponent(name);
		name = name
			.split(/(.mp3|.mp4|.wav|.ogg|.flac|.m4a)+/g)[0]
			.replace(regexReplace, '')
			.replace(/[_]+/g, ' ');

		while (name !== name.replace(/([a-z])([A-Z][a-z]*)([A-Z])?/, PlaylistImporter._convertCamelCase)) {
			name = name.replace(/([a-z])([A-Z][a-z]*)([A-Z])?/, PlaylistImporter._convertCamelCase);
		}

		words = name.replace(/\s+/g, ' ').trim().split(' ');

		for (let i = 0; i < words.length; i++) {
			if (i === 0 || i === words.length - 1 || !small.includes(words[i])) {
				try {
					words[i] = words[i][0].toUpperCase() + words[i].substring(1);
				} catch (error) {
					console.log(error);
				}
			}
		}
		name = words.join(' ');
		return name;
	}

	_generatePlaylist(playlistName) {
		return new Promise(async (resolve, reject) => {
			let playlist = game.playlists?.contents.find((p) => p.name === playlistName);
			let playlistExists = playlist ? true : false;
			if (playlistExists) {
				const shouldOverridePlaylist = game.settings?.get(CONSTANTS.MODULE_NAME, 'shouldOverridePlaylist');
				if (shouldOverridePlaylist) {
					await playlist.delete();
				}
				playlistExists = false;
			}
			if (!playlistExists) {
				try {
					const playlistData = {
						name: playlistName,
						permission: { default: 0 },
						flags: {},
						sounds: [],
						mode: 0,
						playing: false,
					};
					const createdPlaylists = await Playlist.createDocuments([playlistData]);
					playlist = createdPlaylists[0];
					await playlist?.setFlag(CONSTANTS.MODULE_NAME, 'isPlaylistImported', true);
					resolve(true);
				} catch (error) {
					reject(false);
				}
			}
			resolve(false);
		});
	}

	_getItemsFromDir(source, path, playlistName, options) {
		const dupCheck = game.settings.get(CONSTANTS.MODULE_NAME, 'enableDuplicateChecking');
		const shouldRepeat = game.settings.get(CONSTANTS.MODULE_NAME, 'shouldRepeat');
		const shouldStream = game.settings.get(CONSTANTS.MODULE_NAME, 'shouldStream');
		let logVolume = parseFloat(game.settings?.get(CONSTANTS.MODULE_NAME, 'logVolume'));
		if (isNaN(logVolume)) return;
		logVolume = AudioHelper.inputToVolume(logVolume);

		const playlist = game.playlists?.contents.find((p) => p.name === playlistName);
		if (!playlist) {
			ui.notifications?.warn("Cannot find a playlist with name '" + playlistName + "'");
		}

		return new Promise(async (resolve, reject) => {
			FilePicker.browse(source, path, options).then(
				async function (resp) {
					const localFiles = resp.files;
					for (const fileName of localFiles) {
						const valid = await this._validateFileType(fileName);
						if (valid) {
							const trackName = PlaylistImporter._convertToUserFriendly(PlaylistImporter._getBaseName(fileName));
							const currentList = await game.settings.get(CONSTANTS.MODULE_NAME, 'songs');
							const currentPlaylist = game.playlists?.contents.find((playlist) => {
								return playlist && playlist.name == playlistName;
							});
							if (currentPlaylist) {
								const currentSound = currentPlaylist.sounds.find((sound) => {
									return sound && sound.name == trackName;
								});
								if (dupCheck && currentSound) {
									// DO NOTHING
								} else {
									await this._addSong(
										currentList,
										trackName,
										fileName,
										playlistName,
										playlist,
										shouldRepeat,
										logVolume,
										shouldStream,
									);
								}
							}
						}
					}
					resolve(true);
				}.bind(this),
			);
		});
	}

	async _addSong(currentList, trackName, fileName, playlistName, playlist, shouldRepeat, logVolume, shouldStream) {
		currentList[(playlistName + trackName).toLowerCase()] = true;
		await game.settings.set(CONSTANTS.MODULE_NAME, 'songs', currentList);
		await playlist.createEmbeddedDocuments(
			'PlaylistSound',
			[{ name: trackName, path: fileName, repeat: shouldRepeat, volume: logVolume }],
			{},
		);
	}

	_playlistCompletePrompt() {
		const playlistComplete = new Dialog({
			title: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.OperationFinishTitle`),
			content: `<p>${game.i18n.localize(`${CONSTANTS.MODULE_NAME}.OperationFinishContent`)}</p>`,
			buttons: {
				one: {
					icon: '<i class="fas fa-check"></i>',
					label: '',
					callback: () => { },
				},
			},
			default: 'Ack',
			close: () => { },
		});
		playlistComplete.render(true);
	}

	_playlistStatusPrompt() {
		const playlistComplete = new Dialog({
			title: 'Status Update',
			content: `<p>Number of playlists completed <span id="finished_playlists">0</span>/<span id="total_playlists">0</span></p>`,
			buttons: {
				one: {
					icon: '<i class="fas fa-check"></i>',
					label: '',
					callback: () => { },
				},
			},
			default: 'Ack',
			close: () => { },
		});
		playlistComplete.render(true);
	}

	_clearSongHistory() {
		game.settings.set(CONSTANTS.MODULE_NAME, 'songs', {});
	}

	clearMemoryInterface() {
		const clearMemoryPrompt = new Dialog({
			title: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ClearMemoryTitle`),
			content: `<p>${game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ClearMemoryDescription`)}</p>`,
			buttons: {
				one: {
					label: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ClearMemoryWarning`),
					callback: () => this._clearSongHistory(),
				},
				two: {
					label: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.CancelOperation`),
					callback: () => console.log('Playlist-Importer: Canceled'),
				},
			},
			default: 'Cancel',
			close: () => console.log('Playlist-Importer: Prompt Closed'),
		});
		clearMemoryPrompt.render(true);
	}

	playlistDirectoryInterface() {
		const playlistPrompt = new Dialog({
			title: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ImportMusicTitle`),
			content: `<p>${game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ImportMusicDescription`)}</p>`,
			buttons: {
				one: {
					icon: '<i class="fas fa-check"></i>',
					label: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.ImportMusicLabel`),
					callback: () => {
						this._playlistStatusPrompt();
						this.beginPlaylistImport(
							game.settings.get(CONSTANTS.MODULE_NAME, 'source'),
							game.settings.get(CONSTANTS.MODULE_NAME, 'folderDir'),
						);
					},
				},
				two: {
					icon: '<i class="fas fa-times"></i>',
					label: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.CancelOperation`),
					callback: () => console.log('Playlist-Importer: Canceled'),
				},
			},
			default: 'Cancel',
			close: () => { },
		});
		playlistPrompt.render(true);
	}

	async beginPlaylistImport(source, path) {
		const shouldDeletePlaylist = game.settings.get(CONSTANTS.MODULE_NAME, 'shouldDeletePlaylist');
		if (shouldDeletePlaylist) {
			const playlists = game.playlists?.contents;
			for (const playlist of playlists) {
				const playlistHasFlag = playlist.getFlag(CONSTANTS.MODULE_NAME, 'isPlaylistImported');
				if (playlistHasFlag && playlistHasFlag == true) {
					await playlist.delete();
				}
			}
		}

		const options = {};
		if (source === 's3') {
			options['bucket'] = game.settings.get(CONSTANTS.MODULE_NAME, 'bucket');
		}

		FilePicker.browse(source, path, options).then(async (resp) => {
			try {
				const localDirs = resp.dirs || [];
				let finishedDirs = 0;
				const dirName = resp.target;
				const playlistName = PlaylistImporter._convertToUserFriendly(PlaylistImporter._getBaseName(dirName));
				const success = await this._generatePlaylist(playlistName);
				await this._getItemsFromDir(source, dirName, playlistName, options);

				for (const dirName of localDirs) {
					if (resp.target != dirName && !this._blackList.includes(dirName)) {
						finishedDirs = this._searchOnSubFoler(source, dirName, options, playlistName, finishedDirs);
						this._blackList.push(dirName);
					}
				}

				$('#finished_playlists').html(++finishedDirs);
				$('#total_playlists').html(this._blackList.length);
				this._playlistCompletePrompt();
			} finally {
				this._blackList = [];
			}
		});
	}

	_blackList = [];

	_searchOnSubFoler(source, path, options, dirNameParent, finishedDirs) {
		FilePicker.browse(source, path, options).then(async (resp) => {
			const localDirs = resp.dirs || [];
			const dirName = resp.target;
			const playlistName = PlaylistImporter._convertToUserFriendly(PlaylistImporter._getBaseName(dirName));
			let dirNameCustom = dirNameParent ? dirNameParent + '_' + playlistName : playlistName;
			if (game.settings.get(CONSTANTS.MODULE_NAME, 'maintainOriginalFolderName')) {
				dirNameCustom = playlistName;
			}
			const myPlaylists = game.playlists?.contents.filter((p) => p.name === dirNameCustom) || [];
			const myPlaylistExists = myPlaylists.length > 0 ? true : false;
			if (myPlaylistExists) {
				dirNameCustom = dirNameCustom + '-' + myPlaylists.length;
			}

			const success = await this._generatePlaylist(dirNameCustom);
			await this._getItemsFromDir(source, dirName, dirNameCustom, options);

			for (const dirName of localDirs) {
				if (resp.target != dirName && !this._blackList.includes(dirName)) {
					finishedDirs = this._searchOnSubFoler(source, dirName, options, dirNameCustom, finishedDirs);
					this._blackList.push(dirName);
				}
			}
			return finishedDirs;
		});
	}
}

// Global PLIMP object for legacy compatibility
window.PLIMP = {
	playlistImporter: null
};

// Register Settings Function (Helper)
function registerSettings() {
	game.settings.register(CONSTANTS.MODULE_NAME, 'songs', {
		scope: 'world',
		config: false,
		type: Object,
		default: {},
	});

	game.settings.register(CONSTANTS.MODULE_NAME, 'hudPosition', {
		scope: 'client',
		config: false,
		type: Object,
		default: {}
	});

	game.settings.register(CONSTANTS.MODULE_NAME, 'hudMinimized', {
		scope: 'client',
		config: false,
		type: Boolean,
		default: false
	});

	game.settings.register(CONSTANTS.MODULE_NAME, 'hudLocked', {
		scope: 'client',
		config: false,
		type: Boolean,
		default: false
	});
	// ... (Other settings can be registered here or in a separate file)
}

