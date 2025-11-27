import CONSTANTS from '../module/constants.js';

export class ChatSystem {
	static activeChannel = 'global';
	static range = 60; // Default local range in feet
	static observers = new Map(); // Store observers by element ID

	static initialize() {
		// Hook into Chat Log rendering to add our UI
		Hooks.on('renderChatLog', (app, html, data) => {
			ChatSystem._injectChatControls(app, html);
		});

		// Hook into message creation to handle routing/filtering
		Hooks.on('preCreateChatMessage', (document, data, options, userId) => {
			return ChatSystem._handleMessageCreation(document, data, options, userId);
		});

		// Clean up observers when applications close
		Hooks.on('closeApplication', (app) => {
			if (app.id && ChatSystem.observers.has(app.id)) {
				ChatSystem.observers.get(app.id).disconnect();
				ChatSystem.observers.delete(app.id);
			}
		});
	}

	static async _injectChatControls(app, html) {
		// Support both sidebar chat and popout chat
		const htmlElement = html[0] || html;
		const chatForm = htmlElement.querySelector('#chat-form');

		// If there's no chat form (e.g. user has no permission), we might still want to filter messages
		// but we can't inject controls.
		if (!chatForm) return;

		// Avoid double injection
		if (htmlElement.querySelector('.chat-channels')) return;

		const template = `modules/${CONSTANTS.MODULE_NAME}/templates/chat-channels.hbs`;
		const rendered = await renderTemplate(template, {
			activeChannel: ChatSystem.activeChannel,
			range: ChatSystem.range
		});

		// Insert controls BEFORE the chat form
		chatForm.insertAdjacentHTML('beforebegin', rendered);

		// Add listeners
		const container = htmlElement.querySelector('.chat-channels');
		if (!container) return;

		// Channel Tabs
		container.querySelectorAll('.channel-tab').forEach(tab => {
			tab.addEventListener('click', (ev) => {
				ev.preventDefault();
				const channel = tab.dataset.channel;
				ChatSystem._setActiveChannel(channel, container);
			});
		});

		// Range Input
		const rangeInput = container.querySelector('input[name="range"]');
		if (rangeInput) {
			rangeInput.addEventListener('change', (ev) => {
				ChatSystem.range = parseInt(ev.target.value) || 60;
			});
		}

		// Initialize UI state
		ChatSystem._setActiveChannel(ChatSystem.activeChannel, container);

		// Setup MutationObserver for this chat log instance
		ChatSystem._observeChatLog(app, htmlElement);
	}

	static _setActiveChannel(channel, container) {
		ChatSystem.activeChannel = channel;

		// Update Tab Active State
		container.querySelectorAll('.channel-tab').forEach(t => {
			t.classList.toggle('active', t.dataset.channel === channel);
		});

		// Show/Hide Settings
		const settings = container.querySelector('.channel-settings');
		const localSettings = settings.querySelector('.local-settings');
		const groupSettings = settings.querySelector('.group-settings');

		settings.style.display = 'none';
		localSettings.style.display = 'none';
		groupSettings.style.display = 'none';

		if (channel === 'local') {
			settings.style.display = 'block';
			localSettings.style.display = 'block';
		} else if (channel === 'group') {
			settings.style.display = 'block';
			groupSettings.style.display = 'block';
		}
	}

	static _observeChatLog(app, htmlElement) {
		const log = htmlElement.querySelector('#chat-log');
		if (!log) return;

		// Disconnect existing observer if any
		if (ChatSystem.observers.has(app.id)) {
			ChatSystem.observers.get(app.id).disconnect();
		}

		// Create new observer
		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.type === 'childList') {
					mutation.addedNodes.forEach(node => {
						if (node.nodeType === 1 && node.classList.contains('message')) {
							ChatSystem._styleMessageNode(node);
						}
					});
				}
			}
		});

		observer.observe(log, { childList: true });
		ChatSystem.observers.set(app.id, observer);

		// Process existing messages immediately
		log.querySelectorAll('.message').forEach(node => ChatSystem._styleMessageNode(node));
	}

	static _styleMessageNode(node) {
		const messageId = node.dataset.messageId;
		const message = game.messages.get(messageId);
		if (!message) return;

		const channel = message.getFlag(CONSTANTS.MODULE_NAME, 'channel');
		if (!channel) return;

		node.classList.add(`channel-${channel}`);

		// Add visual indicator if not present
		const metadata = node.querySelector('.message-metadata');
		if (metadata && !metadata.querySelector('.channel-tag')) {
			const tag = document.createElement('span');
			tag.className = 'channel-tag';
			tag.textContent = `[${channel.toUpperCase()}]`;
			tag.style.marginLeft = '5px';
			tag.style.fontSize = '0.8em';
			tag.style.color = '#888';
			metadata.appendChild(tag);
		}

		// Apply specific styles
		if (channel === 'local') {
			node.style.borderLeft = '4px solid #ff6400';
			node.style.backgroundColor = 'rgba(255, 100, 0, 0.05)';
		} else if (channel === 'whisper') {
			node.style.borderLeft = '4px solid #6c25be';
			node.style.backgroundColor = 'rgba(108, 37, 190, 0.05)';
		}
	}

	static _handleMessageCreation(document, data, options, userId) {
		// If it's a roll or system message, ignore
		if (data.type === CONST.CHAT_MESSAGE_TYPES.ROLL || !data.content) return true;

		// If the user manually typed a command (e.g. /w), let Foundry handle it
		if (data.content.startsWith('/')) return true;

		const channel = ChatSystem.activeChannel;
		const speaker = ChatMessage.getSpeaker();
		const token = canvas.tokens.get(speaker.token);

		// Add channel flag
		document.updateSource({
			"flags.foundry-extras.channel": channel
		});

		if (channel === 'global') {
			return true;
		}

		if (channel === 'local') {
			if (!token) {
				ui.notifications.warn("You must have a token on the canvas to use Local Chat.");
				return false;
			}

			// Calculate recipients based on range
			const recipients = new Set();
			const range = ChatSystem.range;

			// Always include GM
			game.users.filter(u => u.isGM).forEach(u => recipients.add(u.id));

			// Include sender
			recipients.add(userId);

			// Check proximity
			const userTokens = canvas.tokens.placeables.filter(t => t.actor && t.actor.hasPlayerOwner);

			for (const t of userTokens) {
				const dist = canvas.grid.measureDistance(token, t);
				if (dist <= range) {
					t.actor.getOwners().forEach(u => {
						if (!u.isGM) recipients.add(u.id);
					});
				}
			}

			document.updateSource({
				whisper: Array.from(recipients),
				type: CONST.CHAT_MESSAGE_TYPES.IC,
				content: `[Local] ${data.content}`
			});
		}

		if (channel === 'whisper') {
			const targets = game.user.targets;
			if (targets.size === 0) {
				ui.notifications.warn("Select tokens to whisper to.");
				return false;
			}

			const recipients = new Set();
			game.user.targets.forEach(t => {
				if (t.actor) {
					t.actor.getOwners().forEach(u => {
						if (!u.isGM) recipients.add(u.id);
					});
				}
			});

			game.users.filter(u => u.isGM).forEach(u => recipients.add(u.id));
			recipients.add(userId);

			document.updateSource({
				whisper: Array.from(recipients),
				type: CONST.CHAT_MESSAGE_TYPES.WHISPER
			});
		}

		return true;
	}
}

