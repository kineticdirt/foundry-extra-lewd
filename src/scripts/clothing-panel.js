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
			draggable: true, // Enable dragging
			classes: ['clothing-panel-app'],
			dragDrop: [{ dragSelector: ".clothing-slot", dropSelector: ".clothing-slot" }]
		});
	}

	async getData() {
		const isMinimized = game.settings.get(CONSTANTS.MODULE_NAME, 'panelMinimized') || false;
		
		// If no token, return empty slots grouped by body part
		if (!this._token || !this._actor) {
			return {
				bodyPartGroups: this._groupSlotsByBodyPart(this._getEmptySlots()),
				minimized: isMinimized
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

		// Group slots by body part for layout
		return { 
			bodyPartGroups: this._groupSlotsByBodyPart(slots),
			minimized: isMinimized
		};
	}

	/**
	 * Group slots by body part for vertical layout
	 * Returns array of groups (one per body part category)
	 */
	_groupSlotsByBodyPart(slots) {
		const groups = {
			head: { label: 'Head', slots: [] },
			neck: { label: 'Necklace', slots: [] },
			chest: { label: 'Chest', slots: [] },
			arms: { label: 'Arms', slots: [] },
			abdomen: { label: 'Abdomen', slots: [] },
			hips: { label: 'Hips', slots: [] },
			legs: { label: 'Legs', slots: [] },
			feet: { label: 'Feet', slots: [] },
			misc: { label: 'Misc', slots: [] }
		};

		slots.forEach(slot => {
			if (groups[slot.bodyPart]) {
				groups[slot.bodyPart].slots.push(slot);
			}
		});

		// Return as array in order
		return [
			groups.head,
			groups.neck,
			groups.chest,
			groups.arms,
			groups.abdomen,
			groups.hips,
			groups.legs,
			groups.feet,
			...(groups.misc.slots.length > 0 ? [groups.misc] : [])
		].filter(group => group.slots.length > 0);
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

		// V13 compatibility: html is a raw DOM element
		const root = (html instanceof HTMLElement) ? html : (html[0] || html);
		console.log('ClothingPanel: activateListeners called, root:', root);
		if (!root) {
			console.error('ClothingPanel: No root element found!');
			return;
		}

		// Minimize/Maximize Toggle - Use multiple methods to ensure it works
		const minimizeBtn = root.querySelector('.panel-minimize-btn');
		console.log('ClothingPanel: Found minimize button:', minimizeBtn);
		
		if (minimizeBtn) {
			// Method 1: Direct onclick
			minimizeBtn.onclick = (ev) => {
				ev.stopPropagation();
				ev.preventDefault();
				console.log('ClothingPanel: Minimize button clicked (onclick)');
				this.toggleMinimize();
			};
			
			// Method 2: addEventListener
			minimizeBtn.addEventListener('click', (ev) => {
				ev.stopPropagation();
				ev.preventDefault();
				console.log('ClothingPanel: Minimize button clicked (addEventListener)');
				this.toggleMinimize();
			});
			
			// Method 3: Listen on icon
			const icon = minimizeBtn.querySelector('i');
			if (icon) {
				icon.onclick = (ev) => {
					ev.stopPropagation();
					ev.preventDefault();
					console.log('ClothingPanel: Minimize icon clicked');
					this.toggleMinimize();
				};
			}
			
			// Test: Add visual feedback on mousedown
			minimizeBtn.addEventListener('mousedown', () => {
				console.log('ClothingPanel: Button mousedown detected');
				minimizeBtn.style.backgroundColor = 'red';
				setTimeout(() => {
					minimizeBtn.style.backgroundColor = '';
				}, 200);
			});
		} else {
			console.error('ClothingPanel: Minimize button NOT found in root!');
			console.log('ClothingPanel: Root HTML:', root.innerHTML);
		}

		// Remove Item
		const removeBtns = root.querySelectorAll('.remove-item');
		removeBtns.forEach(btn => {
			btn.onclick = async (ev) => {
				ev.stopPropagation();
				ev.preventDefault();
				if (!this._actor?.isOwner || !this._token) return;

				const slotElement = ev.currentTarget.closest('.clothing-slot');
				if (slotElement) {
					const slotKey = slotElement.dataset.slot;
					await ClothingManager.removeItem(this._token.document, slotKey);
					this.render();
				}
			};
		});

		// Drag and Drop handlers for visual feedback
		const slots = root.querySelectorAll('.clothing-slot');
		slots.forEach(slot => {
			slot.ondragover = (ev) => {
				ev.preventDefault();
				slot.classList.add('drag-over');
			};
			slot.ondragleave = (ev) => {
				slot.classList.remove('drag-over');
			};
			slot.ondrop = (ev) => {
				slot.classList.remove('drag-over');
			};
		});
	}

	/**
	 * Toggle minimize/maximize state - Collapse from bottom to top
	 */
	toggleMinimize() {
		const isMinimized = game.settings.get(CONSTANTS.MODULE_NAME, 'panelMinimized') || false;
		const newState = !isMinimized;
		
		const windowApp = document.querySelector('.window-app[data-app-id="clothing-panel"]');
		const panelElement = windowApp?.querySelector('.clothing-panel');
		
		if (panelElement && windowApp) {
			const panelContent = panelElement.querySelector('.panel-content');
			const slotsContainer = panelElement.querySelector('.slots-container');
			const silhouetteIcon = panelElement.querySelector('.silhouette-icon');
			const minimizeBtn = panelElement.querySelector('.panel-minimize-btn');
			const minimizeIcon = minimizeBtn?.querySelector('i');
			
			if (newState) {
				// MINIMIZE: Collapse from bottom to top
				panelElement.classList.add('minimized');
				windowApp.classList.add('panel-minimized');
				
				// Use max-height transition for smooth collapse
				if (panelContent) {
					panelContent.style.maxHeight = '0';
					panelContent.style.opacity = '0';
					panelContent.style.overflow = 'hidden';
				}
				if (slotsContainer) {
					slotsContainer.style.display = 'none';
				}
				if (silhouetteIcon) {
					silhouetteIcon.style.display = 'none';
				}
				
				panelElement.style.maxHeight = '70px'; // Header + button
				windowApp.style.maxHeight = '80px';
				
				// Button stays visible, just change icon
				if (minimizeIcon) minimizeIcon.className = 'fas fa-chevron-down';
			} else {
				// MAXIMIZE: Expand from top to bottom
				panelElement.classList.remove('minimized');
				windowApp.classList.remove('panel-minimized');
				
				// Restore height with transition
				if (panelContent) {
					panelContent.style.maxHeight = '';
					panelContent.style.opacity = '1';
					panelContent.style.overflow = '';
				}
				if (slotsContainer) {
					slotsContainer.style.display = '';
				}
				if (silhouetteIcon) {
					silhouetteIcon.style.display = '';
				}
				
				panelElement.style.maxHeight = '';
				windowApp.style.maxHeight = '';
				
				// Change icon back
				if (minimizeIcon) minimizeIcon.className = 'fas fa-chevron-up';
			}
			
			// Re-apply positioning (same position, just different height)
			this._applyPositioning(windowApp);
		} else {
			console.warn('ClothingPanel: toggleMinimize - panelElement or windowApp not found');
		}
		
		game.settings.set(CONSTANTS.MODULE_NAME, 'panelMinimized', newState);
	}

	/**
	 * Override render to position on left side near chat input
	 */
	async _render(force, options) {
		await super._render(force, options);

		// Use requestAnimationFrame and setTimeout to ensure DOM is fully ready
		requestAnimationFrame(() => {
			setTimeout(() => {
				// V13 compatibility: this.element is a raw DOM element
				const element = (this.element instanceof HTMLElement) ? this.element : (this.element?.[0] || this.element);
				if (!element) {
					console.warn('ClothingPanel: element not found after render, will retry');
					setTimeout(() => this._render(true), 100);
					return;
				}

				// Try to find window-app - check multiple possible locations
				let windowApp = null;
				
				// Method 1: Check if element itself is window-app
				if (element.classList && element.classList.contains('window-app')) {
					windowApp = element;
				}
				
				// Method 2: Use closest if available
				if (!windowApp && element.closest) {
					windowApp = element.closest('.window-app');
				}
				
				// Method 3: Check parent elements
				if (!windowApp && element.parentElement) {
					let parent = element.parentElement;
					while (parent && parent !== document.body) {
						if (parent.classList && parent.classList.contains('window-app')) {
							windowApp = parent;
							break;
						}
						parent = parent.parentElement;
					}
				}
				
				// Method 4: Fallback - find by ID or data attribute
				if (!windowApp) {
					windowApp = document.querySelector(`#${this.id}.window-app`) || 
							   document.querySelector('.window-app[data-app-id="clothing-panel"]') ||
							   document.querySelector(`.window-app:has(#${this.id})`);
				}

				if (!windowApp) {
					console.warn('ClothingPanel: Could not find window-app, element:', element);
					// Try to position the element directly as fallback
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

				// Apply minimized state on initial render
				const isMinimized = game.settings.get(CONSTANTS.MODULE_NAME, 'panelMinimized') || false;
				const panelElement = windowApp.querySelector('.clothing-panel');
				if (panelElement) {
					const panelContent = panelElement.querySelector('.panel-content');
					const slotsContainer = panelElement.querySelector('.slots-container');
					const silhouetteIcon = panelElement.querySelector('.silhouette-icon');
					const minimizeBtn = panelElement.querySelector('.panel-minimize-btn');
					const minimizeIcon = minimizeBtn?.querySelector('i');
					
					if (isMinimized) {
						panelElement.classList.add('minimized');
						windowApp.classList.add('panel-minimized');
						if (panelContent) {
							panelContent.style.maxHeight = '0';
							panelContent.style.opacity = '0';
							panelContent.style.overflow = 'hidden';
						}
						if (slotsContainer) slotsContainer.style.display = 'none';
						if (silhouetteIcon) silhouetteIcon.style.display = 'none';
						if (minimizeIcon) minimizeIcon.className = 'fas fa-chevron-down';
						panelElement.style.maxHeight = '70px';
						windowApp.style.maxHeight = '80px';
					} else {
						panelElement.classList.remove('minimized');
						windowApp.classList.remove('panel-minimized');
						if (panelContent) {
							panelContent.style.maxHeight = '';
							panelContent.style.opacity = '1';
							panelContent.style.overflow = '';
						}
						if (slotsContainer) slotsContainer.style.display = '';
						if (silhouetteIcon) silhouetteIcon.style.display = '';
						if (minimizeIcon) minimizeIcon.className = 'fas fa-chevron-up';
						panelElement.style.maxHeight = '';
						windowApp.style.maxHeight = '';
					}
				}

				// Apply positioning
				this._applyPositioning(windowApp);
			}, 200);
		});
	}

	/**
	 * Apply positioning to an element - Position between macros and chat input, above macro bar
	 */
	_applyPositioning(element) {
		// Find macros bar (hotbar) - rightmost point
		const hotbar = document.querySelector('#action-bar');
		const hotbarLock = document.querySelector('.ui-control[data-action="lock"]');
		const hotbarRect = hotbar?.getBoundingClientRect();
		const lockRect = hotbarLock?.getBoundingClientRect();
		const macrosRight = hotbarRect?.right ?? lockRect?.right ?? null;
		const macrosTop = hotbarRect?.top ?? lockRect?.top ?? null;
		
		// Find chat input - leftmost point
		const chatInput = document.querySelector('#chat-message') || 
						  document.querySelector('.chat-message') ||
						  document.querySelector('#chat-form textarea');
		const chatInputRect = chatInput?.getBoundingClientRect();
		const chatLeft = chatInputRect?.left ?? null;
		
		// Calculate panel width and position
		const marginX = 12;
		const panelWidth = 380; // Default width
		
		let panelLeft = 10; // Default fallback
		
		if (macrosRight !== null && chatLeft !== null) {
			// Position between macros and chat input
			const availableBetween = chatLeft - macrosRight - (marginX * 2);
			if (availableBetween > 200) {
				// Enough space - position right after macros
				panelLeft = macrosRight + marginX;
			} else {
				// Not enough space - position right after macros anyway
				panelLeft = macrosRight + marginX;
			}
		} else if (macrosRight !== null) {
			// Only macros found
			panelLeft = macrosRight + marginX;
		} else if (chatLeft !== null) {
			// Only chat found - position to left of chat
			panelLeft = chatLeft - panelWidth - marginX;
		}
		
		// Get bottom position - above macro bar
		let panelBottom = 8;
		if (macrosTop !== null) {
			// Position above macro bar with gap
			panelBottom = window.innerHeight - macrosTop + 12;
		} else if (chatInputRect) {
			// Fallback: above chat input
			panelBottom = window.innerHeight - chatInputRect.top + 8;
		}
		
		// Apply positioning
		element.style.position = 'fixed';
		element.style.left = `${Math.max(10, panelLeft)}px`;
		element.style.bottom = `${panelBottom}px`;
		element.style.top = 'auto';
		element.style.right = 'auto';
		element.style.transform = 'none';
		element.style.zIndex = '100';
		element.style.width = `${panelWidth}px`;
		element.style.display = 'block';
		element.style.visibility = 'visible';
		element.style.opacity = '1';
		
		console.log('ClothingPanel: Positioned at left:', panelLeft, 'px, width:', panelWidth, 'px, bottom:', panelBottom, 'px');
	}
}

