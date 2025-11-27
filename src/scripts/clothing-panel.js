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

		// Get clothing data and merge with panel slots structure
		const clothingData = this._token.document.getFlag(CONSTANTS.MODULE_NAME, 'clothing') || {};
		const slots = this._getEmptySlots();
		
		// Populate slots with actual item data from clothing flags
		slots.forEach(slot => {
			if (clothingData[slot.key]) {
				slot.item = clothingData[slot.key];
			}
		});

		return { slots };
	}

	/**
	 * Get empty slots structure (20 slots total)
	 * Each slot has a bodyPart property for CSS positioning
	 */
	_getEmptySlots() {
		return [
			// Head - 2 slots
			{ key: 'head_1', label: 'Head 1', icon: 'fas fa-head-side', item: null, bodyPart: 'head', layer: 1 },
			{ key: 'head_2', label: 'Head 2', icon: 'fas fa-head-side', item: null, bodyPart: 'head', layer: 2 },
			// Necklace - 2 slots
			{ key: 'necklace_1', label: 'Necklace 1', icon: 'fas fa-gem', item: null, bodyPart: 'neck', layer: 1 },
			{ key: 'necklace_2', label: 'Necklace 2', icon: 'fas fa-gem', item: null, bodyPart: 'neck', layer: 2 },
			// Chest - 4 slots
			{ key: 'chest_1', label: 'Chest 1', icon: 'fas fa-vest', item: null, bodyPart: 'chest', layer: 1 },
			{ key: 'chest_2', label: 'Chest 2', icon: 'fas fa-vest', item: null, bodyPart: 'chest', layer: 2 },
			{ key: 'chest_3', label: 'Chest 3', icon: 'fas fa-vest', item: null, bodyPart: 'chest', layer: 3 },
			{ key: 'chest_4', label: 'Chest 4', icon: 'fas fa-vest', item: null, bodyPart: 'chest', layer: 4 },
			// Arms - 2 slots
			{ key: 'arms_1', label: 'Arms 1', icon: 'fas fa-hand-paper', item: null, bodyPart: 'arms', layer: 1 },
			{ key: 'arms_2', label: 'Arms 2', icon: 'fas fa-hand-paper', item: null, bodyPart: 'arms', layer: 2 },
			// Abdomen - 2 slots
			{ key: 'abdomen_1', label: 'Abdomen 1', icon: 'fas fa-user', item: null, bodyPart: 'abdomen', layer: 1 },
			{ key: 'abdomen_2', label: 'Abdomen 2', icon: 'fas fa-user', item: null, bodyPart: 'abdomen', layer: 2 },
			// Hips - 3 slots
			{ key: 'hips_1', label: 'Hips 1', icon: 'fas fa-user-friends', item: null, bodyPart: 'hips', layer: 1 },
			{ key: 'hips_2', label: 'Hips 2', icon: 'fas fa-user-friends', item: null, bodyPart: 'hips', layer: 2 },
			{ key: 'hips_3', label: 'Hips 3', icon: 'fas fa-user-friends', item: null, bodyPart: 'hips', layer: 3 },
			// Legs - 2 slots
			{ key: 'legs_1', label: 'Legs 1', icon: 'fas fa-socks', item: null, bodyPart: 'legs', layer: 1 },
			{ key: 'legs_2', label: 'Legs 2', icon: 'fas fa-socks', item: null, bodyPart: 'legs', layer: 2 },
			// Feet - 2 slots
			{ key: 'feet_1', label: 'Feet 1', icon: 'fas fa-shoe-prints', item: null, bodyPart: 'feet', layer: 1 },
			{ key: 'feet_2', label: 'Feet 2', icon: 'fas fa-shoe-prints', item: null, bodyPart: 'feet', layer: 2 },
			// Misc - 1 slot
			{ key: 'misc', label: 'Misc', icon: 'fas fa-star', item: null, bodyPart: 'misc', layer: 1 }
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
			slots.push({ ...sections.head.slots[0], bodyPart: 'head' });
		} else {
			slots.push({ key: 'head_1', label: 'Head', icon: 'fas fa-head-side', item: null, bodyPart: 'head' });
		}

		// Necklace (special - check if exists in clothing data)
		const clothingData = this._token?.document?.getFlag(CONSTANTS.MODULE_NAME, 'clothing') || {};
		if (clothingData.necklace) {
			slots.push({ key: 'necklace', label: 'Necklace', icon: 'fas fa-gem', item: clothingData.necklace, bodyPart: 'neck' });
		} else {
			slots.push({ key: 'necklace', label: 'Necklace', icon: 'fas fa-gem', item: null, bodyPart: 'neck' });
		}

		// Chest (special)
		if (clothingData.chest) {
			slots.push({ key: 'chest', label: 'Chest', icon: 'fas fa-vest', item: clothingData.chest, bodyPart: 'chest' });
		} else {
			slots.push({ key: 'chest', label: 'Chest', icon: 'fas fa-vest', item: null, bodyPart: 'chest' });
		}

		// Arms (special)
		if (clothingData.arms) {
			slots.push({ key: 'arms', label: 'Arms', icon: 'fas fa-hand-paper', item: clothingData.arms, bodyPart: 'arms' });
		} else {
			slots.push({ key: 'arms', label: 'Arms', icon: 'fas fa-hand-paper', item: null, bodyPart: 'arms' });
		}

		// Abdomen
		if (sections.abdomen?.slots?.[0]) {
			slots.push({ ...sections.abdomen.slots[0], bodyPart: 'abdomen' });
		} else {
			slots.push({ key: 'abdomen_1', label: 'Abdomen', icon: 'fas fa-user', item: null, bodyPart: 'abdomen' });
		}

		// Hips
		if (sections.hips?.slots?.[0]) {
			slots.push({ ...sections.hips.slots[0], bodyPart: 'hips' });
		} else {
			slots.push({ key: 'hips_1', label: 'Hips', icon: 'fas fa-user-friends', item: null, bodyPart: 'hips' });
		}

		// Legs
		if (sections.legs?.slots?.[0]) {
			slots.push({ ...sections.legs.slots[0], bodyPart: 'legs' });
		} else {
			slots.push({ key: 'legs_1', label: 'Legs', icon: 'fas fa-socks', item: null, bodyPart: 'legs' });
		}

		// Feet
		if (sections.feet?.slots?.[0]) {
			slots.push({ ...sections.feet.slots[0], bodyPart: 'feet' });
		} else {
			slots.push({ key: 'feet_1', label: 'Feet', icon: 'fas fa-shoe-prints', item: null, bodyPart: 'feet' });
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
			// Hide the panel
			if (this.rendered) {
				this.close();
			}
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
			// No valid token - ensure panel is hidden
			this._token = null;
			this._actor = null;
			if (this.rendered) {
				this.close();
			}
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

				// Try to find window-app, but if not found, use the element itself or its parent
				let windowApp = null;
				const $windowApp = this.element.closest('.window-app');
				
				if ($windowApp && $windowApp.length) {
					windowApp = $windowApp[0];
				} else {
					// Fallback: try to find it in the DOM by ID
					windowApp = document.querySelector(`#${this.id}.window-app`);
					if (!windowApp) {
						// Last resort: use the element's parent or the element itself
						const element = this.element[0] || this.element;
						windowApp = element.closest ? element.closest('.window-app') : element.parentElement;
						if (!windowApp || !windowApp.classList) {
							// Use the element itself if it's a DOM element
							windowApp = element.nodeType === 1 ? element : null;
						}
					}
				}

				if (!windowApp) {
					console.error('ClothingPanel: Could not find window-app or suitable parent element');
					// Try to position the element directly
					const element = this.element[0] || this.element;
					if (element && element.style) {
						this._applyPositioning(element);
					}
					return;
				}

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

				// Apply positioning
				this._applyPositioning(windowApp);
			}, 200);
		});
	}

	/**
	 * Apply positioning to an element - Pin to bottom chat input box
	 */
	_applyPositioning(element) {
		// Find the chat input box at the bottom
		const chatInput = document.querySelector('#chat-message') || 
						  document.querySelector('.chat-message') ||
						  document.querySelector('#chat-form input[type="text"]') ||
						  document.querySelector('#chat-form textarea') ||
						  document.querySelector('input[placeholder*="message" i]') ||
						  document.querySelector('textarea[placeholder*="message" i]');
		
		if (chatInput) {
			const inputRect = chatInput.getBoundingClientRect();
			const panelWidth = 76;
			const gap = 10;
			
			// Position to the LEFT of the chat input, pinned to bottom
			// Calculate left position: input's left edge - panel width - gap
			const panelLeft = inputRect.left - panelWidth - gap;
			
			// Calculate bottom position: distance from bottom of screen to top of input
			const panelBottom = window.innerHeight - inputRect.top + gap;
			
			// Apply positioning DIRECTLY to element
			element.style.position = 'fixed';
			element.style.left = `${Math.max(10, panelLeft)}px`; // Ensure it doesn't go off-screen
			element.style.bottom = `${panelBottom}px`;
			element.style.top = 'auto';
			element.style.right = 'auto';
			element.style.transform = 'none';
			element.style.zIndex = '100';
			element.style.display = 'block';
			element.style.visibility = 'visible';
			element.style.opacity = '1';
			
			console.log('ClothingPanel: Positioned at left:', panelLeft, 'px, bottom:', panelBottom, 'px');
		} else {
			// Fallback: position at bottom-left if chat input not found
			const panelWidth = 76;
			const gap = 10;
			
			element.style.position = 'fixed';
			element.style.left = `${gap}px`;
			element.style.bottom = `${100 + gap}px`; // Above typical chat input location
			element.style.top = 'auto';
			element.style.right = 'auto';
			element.style.transform = 'none';
			element.style.zIndex = '100';
			element.style.display = 'block';
			element.style.visibility = 'visible';
			element.style.opacity = '1';
			
			console.log('ClothingPanel: Using fallback positioning (chat input not found)');
		}
	}
}

