import CONSTANTS from '../module/constants.js';
import { ClothingManager } from './clothing-manager.js';

export class ClothingHUD extends Application {
	constructor() {
		super();
		this._token = null;
		this._actor = null;
	}

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: 'clothing-hud',
			template: `modules/${CONSTANTS.MODULE_NAME}/templates/clothing-hud.hbs`,
			popOut: false,
			minimizable: false,
			resizable: false,
			classes: ['clothing-hud-app'],
			dragDrop: [{ dragSelector: ".clothing-slot", dropSelector: ".clothing-slot" }]
		});
	}

	async getData() {
		if (!this._token) return { sections: {} };
		return {
			sections: ClothingManager.getClothingData(this._token.document)
		};
	}

	bind(token) {
		if (token === this._token) return;

		// Condition: Only bind if token exists and user has owner permission
		if (!token || !token.actor?.isOwner) {
			this._token = null;
			this._actor = null;
			this.close();
			return;
		}

		this._token = token;
		this._actor = token.actor;

		if (this._actor) {
			this.render(true);
		} else {
			this.close();
		}
	}

	async _onDrop(event) {
		if (!this._token || !this._actor) return;

		// Condition: Check ownership again just in case
		if (!this._actor.isOwner) return;

		const data = TextEditor.getDragEventData(event);
		const slotElement = event.target.closest('.clothing-slot');
		if (!slotElement) return;

		const slotKey = slotElement.dataset.slot;

		await ClothingManager.handleDrop(this._token.document, this._actor, slotKey, data);
		this.render();
	}

	activateListeners(html) {
		super.activateListeners(html);

		// Remove Item
		html.find('.remove-item').click(async (ev) => {
			ev.stopPropagation();
			ev.preventDefault();
			if (!this._actor?.isOwner) return;

			const slotKey = ev.currentTarget.closest('.clothing-slot').dataset.slot;
			await ClothingManager.removeItem(this._token.document, slotKey);
			this.render();
		});

		// Make HUD draggable (simple implementation)
		const hud = html[0];
		let isDragging = false;
		let startX, startY, initialLeft, initialTop;

		hud.addEventListener('mousedown', (e) => {
			if (e.target.closest('.clothing-slot')) return; // Don't drag if clicking a slot
			isDragging = true;
			startX = e.clientX;
			startY = e.clientY;
			const rect = hud.getBoundingClientRect();
			initialLeft = rect.left;
			initialTop = rect.top;
			hud.style.cursor = 'grabbing';
		});

		window.addEventListener('mousemove', (e) => {
			if (!isDragging) return;
			const dx = e.clientX - startX;
			const dy = e.clientY - startY;
			hud.style.left = `${initialLeft + dx}px`;
			hud.style.top = `${initialTop + dy}px`;
			hud.style.bottom = 'auto'; // Override CSS bottom
			hud.style.right = 'auto';
		});

		window.addEventListener('mouseup', async (e) => {
			if (!isDragging) return;
			isDragging = false;
			hud.style.cursor = 'default';

			// Persist Position
			const position = {
				left: hud.style.left,
				top: hud.style.top
			};
			await game.settings.set(CONSTANTS.MODULE_NAME, 'hudPosition', position);
		});
	}

	// Override render to append to body but keep position fixed via CSS
	async _render(force, options) {
		await super._render(force, options);
		// Ensure it's visible
		if (this.element) {
			this.element.css({ display: 'flex' });

			// Restore Position
			const position = game.settings.get(CONSTANTS.MODULE_NAME, 'hudPosition');
			if (position && position.left && position.top) {
				this.element.css({
					left: position.left,
					top: position.top,
					bottom: 'auto',
					right: 'auto'
				});
			}
		}
	}
}
