import CONSTANTS from '../module/constants.js';
import { ClothingManager } from './clothing-manager.js';

/**
 * ============================================
 * CLOTHING PANEL - Left-side panel near chat input
 * ============================================
 * This is a SIMPLE panel that appears to the LEFT of the chat input box.
 * It shows 8 vertical slots with a woman silhouette background.
 * It ONLY activates when a token is selected, and hides when deselected.
 */
export class ClothingPanel extends Application {
	constructor() {
		super();
		this._token = null;
		this._actor = null;
	}

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: 'clothing-panel',
			template: `modules/${CONSTANTS.MODULE_NAME}/templates/clothing-panel.hbs`,
			popOut: false,
			minimizable: false,
			resizable: false,
			classes: ['clothing-panel-app'],
			dragDrop: [{ dragSelector: ".clothing-slot", dropSelector: ".clothing-slot" }]
		});
	}

	async getData() {
		// If no token, return empty slots
		if (!this._token || !this._actor) {
			return {
				slots: this._getEmptySlots()
			};
		}

		// Get clothing data and flatten to single array of 8 slots
		const sections = ClothingManager.getClothingData(this._token.document);
		const slots = this._flattenSectionsToSlots(sections);

		return { slots };
	}

	/**
	 * Get empty slots structure (8 slots total)
	 */
	_getEmptySlots() {
		return [
			{ key: 'head_1', label: 'Head', icon: 'fas fa-head-side', item: null },
			{ key: 'necklace', label: 'Necklace', icon: 'fas fa-gem', item: null },
			{ key: 'chest', label: 'Chest', icon: 'fas fa-vest', item: null },
			{ key: 'arms', label: 'Arms', icon: 'fas fa-hand-paper', item: null },
			{ key: 'abdomen_1', label: 'Abdomen', icon: 'fas fa-user', item: null },
			{ key: 'hips_1', label: 'Hips', icon: 'fas fa-user-friends', item: null },
			{ key: 'legs_1', label: 'Legs', icon: 'fas fa-socks', item: null },
			{ key: 'feet_1', label: 'Feet', icon: 'fas fa-shoe-prints', item: null }
		];
	}

	/**
	 * Flatten sections into 8 main slots (one per body part)
	 * Takes the first slot from each section
	 */
	_flattenSectionsToSlots(sections) {
		const slotMap = {
			head: 'head_1',
			necklace: 'necklace', // Special slot
			chest: 'chest', // Special slot
			arms: 'arms', // Special slot
			abdomen: 'abdomen_1',
			hips: 'hips_1',
			legs: 'legs_1',
			feet: 'feet_1'
		};

		const slots = [];
		
		// Head
		if (sections.head?.slots?.[0]) {
			slots.push(sections.head.slots[0]);
		} else {
			slots.push({ key: 'head_1', label: 'Head', icon: 'fas fa-head-side', item: null });
		}

		// Necklace (special - check if exists in clothing data)
		const clothingData = this._token?.document?.getFlag(CONSTANTS.MODULE_NAME, 'clothing') || {};
		if (clothingData.necklace) {
			slots.push({ key: 'necklace', label: 'Necklace', icon: 'fas fa-gem', item: clothingData.necklace });
		} else {
			slots.push({ key: 'necklace', label: 'Necklace', icon: 'fas fa-gem', item: null });
		}

		// Chest (special)
		if (clothingData.chest) {
			slots.push({ key: 'chest', label: 'Chest', icon: 'fas fa-vest', item: clothingData.chest });
		} else {
			slots.push({ key: 'chest', label: 'Chest', icon: 'fas fa-vest', item: null });
		}

		// Arms (special)
		if (clothingData.arms) {
			slots.push({ key: 'arms', label: 'Arms', icon: 'fas fa-hand-paper', item: clothingData.arms });
		} else {
			slots.push({ key: 'arms', label: 'Arms', icon: 'fas fa-hand-paper', item: null });
		}

		// Abdomen
		if (sections.abdomen?.slots?.[0]) {
			slots.push(sections.abdomen.slots[0]);
		} else {
			slots.push({ key: 'abdomen_1', label: 'Abdomen', icon: 'fas fa-user', item: null });
		}

		// Hips
		if (sections.hips?.slots?.[0]) {
			slots.push(sections.hips.slots[0]);
		} else {
			slots.push({ key: 'hips_1', label: 'Hips', icon: 'fas fa-user-friends', item: null });
		}

		// Legs
		if (sections.legs?.slots?.[0]) {
			slots.push(sections.legs.slots[0]);
		} else {
			slots.push({ key: 'legs_1', label: 'Legs', icon: 'fas fa-socks', item: null });
		}

		// Feet
		if (sections.feet?.slots?.[0]) {
			slots.push(sections.feet.slots[0]);
		} else {
			slots.push({ key: 'feet_1', label: 'Feet', icon: 'fas fa-shoe-prints', item: null });
		}

		return slots;
	}

	/**
	 * ============================================
	 * BIND TO TOKEN - Called when token is selected/deselected
	 * ============================================
	 * When token is selected: Show panel with data
	 * When token is deselected: Hide panel completely
	 */
	bind(token) {
		// Check if this is the same token (no change needed)
		if (token === this._token) {
			// Same token, just update the display
			if (token && token.actor?.isOwner) {
				this.render();
			}
			return;
		}

		const wasBound = this._token !== null;
		const willBeBound = token !== null && token?.actor?.isOwner;

		// If we had a token and now we don't, hide the panel
		if (wasBound && !willBeBound) {
			this._token = null;
			this._actor = null;
			this.close();
			return;
		}

		// Update internal state
		if (willBeBound) {
			this._token = token;
			this._actor = token.actor;
			// Show or update the panel
			if (!wasBound) {
				// First time showing - render
				this.render(true);
			} else {
				// Switching tokens - update
				this.render();
			}
		} else {
			// No valid token
			this._token = null;
			this._actor = null;
		}
	}

	async _onDrop(event) {
		if (!this._token || !this._actor) return;
		if (!this._actor.isOwner) return;

		const data = TextEditor.getDragEventData(event);
		const slotElement = event.target.closest('.clothing-slot');
		if (!slotElement) return;

		slotElement.classList.remove('drag-over');

		const slotKey = slotElement.dataset.slot;

		await ClothingManager.handleDrop(this._token.document, this._actor, slotKey, data);
		this.render();
	}

	_getHeaderButtons() {
		// No header buttons for this simple panel
		return [];
	}

	activateListeners(html) {
		super.activateListeners(html);

		// Remove Item
		html.find('.remove-item').click(async (ev) => {
			ev.stopPropagation();
			ev.preventDefault();
			if (!this._actor?.isOwner || !this._token) return;

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
	}

	/**
	 * Override render to position on left side near chat input
	 */
	async _render(force, options) {
		await super._render(force, options);

		// Use requestAnimationFrame and setTimeout to ensure DOM is fully ready
		requestAnimationFrame(() => {
			setTimeout(() => {
				if (!this.element || !this.element.length) {
					console.error('ClothingPanel: element not found after render');
					return;
				}

				// Hide Foundry's window frame
				const $windowApp = this.element.closest('.window-app');
				if (!$windowApp || !$windowApp.length) {
					console.error('ClothingPanel: window-app not found');
					return;
				}

				const windowApp = $windowApp[0];
				windowApp.classList.add('clothing-panel-window');
				windowApp.setAttribute('data-app-id', 'clothing-panel');

				// Remove header
				const windowHeader = windowApp.querySelector('.window-header');
				if (windowHeader) {
					windowHeader.remove();
				}

				// Style window-app
				windowApp.style.cssText = 'background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important;';

				// Style window-content
				const windowContent = windowApp.querySelector('.window-content');
				if (windowContent) {
					windowContent.style.cssText = 'padding: 0 !important; margin: 0 !important; border: none !important; background: transparent !important; overflow: visible !important;';
				}

				// Position to the LEFT of the chat sidebar (right side of screen)
				// Find the chat sidebar - Foundry uses #sidebar for the right sidebar
				const chatSidebar = document.querySelector('#sidebar');
				
				if (chatSidebar) {
					const sidebarRect = chatSidebar.getBoundingClientRect();
					const panelWidth = 76;
					const gap = 10;
					const panelLeft = sidebarRect.left - panelWidth - gap;
					
					// Apply positioning DIRECTLY to windowApp element
					windowApp.style.position = 'fixed';
					windowApp.style.left = `${panelLeft}px`;
					windowApp.style.top = `${sidebarRect.top + 20}px`;
					windowApp.style.right = 'auto';
					windowApp.style.bottom = 'auto';
					windowApp.style.zIndex = '100';
					windowApp.style.display = 'block';
					windowApp.style.visibility = 'visible';
					windowApp.style.opacity = '1';
					
					console.log('ClothingPanel: Positioned at left:', panelLeft, 'px');
				} else {
					// Fallback: position on right side, left of typical chat location
					const screenWidth = window.innerWidth;
					const chatWidth = 300;
					const panelWidth = 76;
					const gap = 10;
					const panelLeft = screenWidth - chatWidth - panelWidth - gap;
					
					windowApp.style.position = 'fixed';
					windowApp.style.left = `${panelLeft}px`;
					windowApp.style.top = '50%';
					windowApp.style.right = 'auto';
					windowApp.style.bottom = 'auto';
					windowApp.style.transform = 'translateY(-50%)';
					windowApp.style.zIndex = '100';
					windowApp.style.display = 'block';
					windowApp.style.visibility = 'visible';
					windowApp.style.opacity = '1';
					
					console.log('ClothingPanel: Using fallback positioning, left:', panelLeft);
				}
			}, 200);
		});
	}
}

