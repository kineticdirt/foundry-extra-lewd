import CONSTANTS from '../module/constants.js';
import { ClothingManager } from './clothing-manager.js';

export class ClothingHUD extends Application {
	constructor() {
		super();
		this._token = null;
		this._actor = null;
		this._minimized = false;
		this._locked = false;
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
		if (!this._token) return { sections: {}, minimized: this._minimized, locked: this._locked };
		return {
			sections: ClothingManager.getClothingData(this._token.document),
			minimized: this._minimized,
			locked: this._locked
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

		// Remove drag-over class
		slotElement.classList.remove('drag-over');

		const slotKey = slotElement.dataset.slot;

		await ClothingManager.handleDrop(this._token.document, this._actor, slotKey, data);
		this.render();
	}

	_onDragOver(event) {
		const slotElement = event.target.closest('.clothing-slot');
		if (slotElement) {
			event.preventDefault();
			slotElement.classList.add('drag-over');
		}
	}

	_onDragLeave(event) {
		const slotElement = event.target.closest('.clothing-slot');
		if (slotElement) {
			slotElement.classList.remove('drag-over');
		}
	}

	_getHeaderButtons() {
		// Return empty array to remove Foundry's default window header buttons
		return [];
	}

	activateListeners(html) {
		super.activateListeners(html);

		// Minimize/Expand Toggle
		html.find('.hud-minimize-btn').click((ev) => {
			ev.stopPropagation();
			ev.preventDefault();
			this.toggleMinimize();
		});

		// Lock/Unlock Toggle
		html.find('.hud-lock-btn').click((ev) => {
			ev.stopPropagation();
			ev.preventDefault();
			this.toggleLock();
		});

		// Remove Item
		html.find('.remove-item').click(async (ev) => {
			ev.stopPropagation();
			ev.preventDefault();
			if (!this._actor?.isOwner) return;

			const slotKey = ev.currentTarget.closest('.clothing-slot').dataset.slot;
			await ClothingManager.removeItem(this._token.document, slotKey);
			this.render();
		});

		// Drag and Drop handlers for visual feedback
		html.find('.clothing-slot').on('dragover', (ev) => {
			ev.preventDefault();
			ev.currentTarget.classList.add('drag-over');
		});

		html.find('.clothing-slot').on('dragleave', (ev) => {
			ev.currentTarget.classList.remove('drag-over');
		});

		html.find('.clothing-slot').on('drop', (ev) => {
			ev.currentTarget.classList.remove('drag-over');
		});

		// Make HUD draggable via header (simple implementation)
		const hudHeader = html.find('.hud-header')[0];
		if (hudHeader) {
			let isDragging = false;
			let startX, startY, initialLeft, initialTop;
			let windowApp = null;

			hudHeader.addEventListener('mousedown', (e) => {
				if (e.target.closest('.hud-minimize-btn') || e.target.closest('.hud-lock-btn')) return; // Don't drag if clicking buttons
				if (this._locked) return; // Don't drag if locked
				isDragging = true;
				startX = e.clientX;
				startY = e.clientY;
				
				// Find the window-app wrapper
				windowApp = $(hudHeader).closest('.window-app')[0] || $(hudHeader).closest('#clothing-hud.window-app')[0];
				if (!windowApp) {
					windowApp = $(hudHeader).parents('.window-app')[0];
				}
				
				if (windowApp) {
					const rect = windowApp.getBoundingClientRect();
					initialLeft = rect.left;
					initialTop = rect.top;
					hudHeader.style.cursor = 'grabbing';
				}
			});

			window.addEventListener('mousemove', (e) => {
				if (!isDragging || !windowApp) return;
				const dx = e.clientX - startX;
				const dy = e.clientY - startY;
				$(windowApp).css({
					left: `${initialLeft + dx}px`,
					top: `${initialTop + dy}px`,
					right: 'auto',
					bottom: 'auto',
					transform: 'none'
				});
			});

			window.addEventListener('mouseup', async (e) => {
				if (!isDragging) return;
				isDragging = false;
				hudHeader.style.cursor = 'default';

				if (windowApp) {
					// Persist Position
					const rect = windowApp.getBoundingClientRect();
					const position = {
						left: `${rect.left}px`,
						top: `${rect.top}px`
					};
					await game.settings.set(CONSTANTS.MODULE_NAME, 'hudPosition', position);
				}
			});
		}
	}

	toggleMinimize() {
		this._minimized = !this._minimized;
		this.render();
		// Persist minimize state
		game.settings.set(CONSTANTS.MODULE_NAME, 'hudMinimized', this._minimized);
	}

	toggleLock() {
		this._locked = !this._locked;
		this.render();
		// Persist lock state
		game.settings.set(CONSTANTS.MODULE_NAME, 'hudLocked', this._locked);
	}

	// Override render to append to body but keep position fixed via CSS
	async _render(force, options) {
		await super._render(force, options);
		
		// Restore minimize and lock state
		const savedMinimized = game.settings.get(CONSTANTS.MODULE_NAME, 'hudMinimized');
		if (savedMinimized !== undefined) {
			this._minimized = savedMinimized;
		}
		const savedLocked = game.settings.get(CONSTANTS.MODULE_NAME, 'hudLocked');
		if (savedLocked !== undefined) {
			this._locked = savedLocked;
		}
		
		// Use setTimeout to ensure DOM is fully rendered
		setTimeout(() => {
			if (!this.element || !this.element.length) {
				console.warn('ClothingHUD: element not found after render');
				return;
			}

			// Hide Foundry's window frame - target the window-app wrapper
			// this.element is a jQuery object, so closest() returns jQuery object
			const $windowApp = this.element.closest('.window-app');
			if (!$windowApp || !$windowApp.length) {
				console.warn('ClothingHUD: window-app not found');
				return;
			}

			// Get the actual DOM element
			const windowApp = $windowApp[0];
			
			windowApp.classList.add('clothing-hud-window');
			windowApp.setAttribute('data-app-id', 'clothing-hud');
					
					// Aggressively hide header and all its children
					const windowHeader = windowApp.querySelector('.window-header');
					if (windowHeader) {
						windowHeader.remove(); // Remove it entirely instead of hiding
					}
					
					// Also remove any close buttons
					const closeButtons = windowApp.querySelectorAll('.header-button.close, .control.close, a.close');
					closeButtons.forEach(btn => btn.remove());
					
					// Style the window-app itself
					windowApp.style.cssText = 'background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important;';
					
					// Style window-content
					const windowContent = windowApp.querySelector('.window-content');
					if (windowContent) {
						windowContent.style.cssText = 'padding: 0 !important; margin: 0 !important; border: none !important; background: transparent !important; overflow: visible !important;';
					}
				}

				// Find the actual clothing-hud div inside window-content
				const hudDiv = this.element.find('.clothing-hud').length ? this.element.find('.clothing-hud') : this.element;
				
				// Apply minimize and lock state
				if (this._minimized) {
					hudDiv.addClass('minimized');
				} else {
					hudDiv.removeClass('minimized');
				}
				if (this._locked) {
					hudDiv.addClass('locked');
					const header = hudDiv.find('.hud-header');
					if (header.length) {
						header.css('cursor', 'default');
					}
				} else {
					hudDiv.removeClass('locked');
					const header = hudDiv.find('.hud-header');
					if (header.length) {
						header.css('cursor', 'move');
					}
				}

				// Ensure it's visible and positioned correctly
				hudDiv.css({ display: 'flex' });

			// Position the window-app wrapper, not the inner element
			// Calculate right offset to avoid chat sidebar (typically 300px wide)
			const chatSidebar = document.querySelector('#sidebar') || document.querySelector('.sidebar');
			const chatWidth = chatSidebar ? chatSidebar.offsetWidth : 300;
			const rightOffset = chatWidth + 20; // 20px padding from chat
			
			// Restore Position (only if user has manually moved it)
			const position = game.settings.get(CONSTANTS.MODULE_NAME, 'hudPosition');
			if (position && position.left && position.top && position.left !== 'auto' && typeof position.left === 'string' && position.left.includes('px')) {
				// User has manually positioned it (has actual pixel values)
				$windowApp.css({
					position: 'fixed',
					left: position.left,
					top: position.top,
					bottom: 'auto',
					right: 'auto',
					transform: 'none',
					zIndex: 50,
					display: 'block',
					visibility: 'visible',
					opacity: '1'
				});
			} else {
				// Default to right side, accounting for chat sidebar
				$windowApp.css({
					position: 'fixed',
					left: 'auto',
					right: `${rightOffset}px`,
					top: '50%',
					bottom: 'auto',
					transform: 'translateY(-50%)',
					zIndex: 50,
					display: 'block',
					visibility: 'visible',
					opacity: '1'
				});
			}

			console.log('ClothingHUD: Positioned at', $windowApp.css('right'), 'from right edge');
			}
		}, 0);
	}
}
