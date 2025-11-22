import CONSTANTS from '../module/constants.js';

export class ClothingSystem extends FormApplication {
	constructor(actor, options) {
		super(actor, options);
		this.actor = actor;
	}

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: 'clothing-sheet',
			title: 'Clothing System',
			template: `modules/${CONSTANTS.MODULE_NAME}/templates/clothing-sheet.hbs`,
			width: 400,
			height: 'auto',
			resizable: true,
			dragDrop: [{ dragSelector: ".item", dropSelector: ".drop-zone" }]
		});
	}

	getData() {
		const clothingData = this.actor.getFlag(CONSTANTS.MODULE_NAME, 'clothing') || {};
		const slots = {
			head: { label: 'Headwear', item: null },
			necklace: { label: 'Necklace', item: null },
			chest: { label: 'Chest (Bra/Shirt)', item: null },
			arms: { label: 'Arms', item: null },
			abdomen: { label: 'Abdomen', item: null },
			hips: { label: 'Hips (Panties)', item: null },
			legs: { label: 'Legwear', item: null },
			misc: { label: 'Misc', item: null }
		};

		for (const [key, slot] of Object.entries(slots)) {
			if (clothingData[key]) {
				slot.item = clothingData[key];
			}
		}

		return {
			slots: slots
		};
	}

	async _onDrop(event) {
		const data = TextEditor.getDragEventData(event);
		const slotKey = event.target.closest('.clothing-slot')?.dataset.slot;

		if (!slotKey || data.type !== "Item") return;

		const item = await Item.implementation.fromDropData(data);
		if (!item) return;

		// Store item data in the slot
		const itemData = {
			id: item.id,
			name: item.name,
			img: item.img,
			uuid: item.uuid
		};

		await this.actor.setFlag(CONSTANTS.MODULE_NAME, `clothing.${slotKey}`, itemData);
		this.render(true);
	}

	activateListeners(html) {
		super.activateListeners(html);
		html.find('.item-delete').click(this._onRemoveItem.bind(this));
	}

import CONSTANTS from '../module/constants.js';

export class ClothingSystem extends FormApplication {
	constructor(actor, options) {
		super(actor, options);
		this.actor = actor;
	}

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: 'clothing-sheet',
			title: 'Clothing System',
			template: `modules/${CONSTANTS.MODULE_NAME}/templates/clothing-sheet.hbs`,
			width: 400,
			height: 'auto',
			resizable: true,
			dragDrop: [{ dragSelector: ".item", dropSelector: ".drop-zone" }]
		});
	}

	getData() {
		const clothingData = this.actor.getFlag(CONSTANTS.MODULE_NAME, 'clothing') || {};
		const slots = {
			head: { label: 'Headwear', item: null },
			necklace: { label: 'Necklace', item: null },
			chest: { label: 'Chest (Bra/Shirt)', item: null },
			arms: { label: 'Arms', item: null },
			abdomen: { label: 'Abdomen', item: null },
			hips: { label: 'Hips (Panties)', item: null },
			legs: { label: 'Legwear', item: null },
			misc: { label: 'Misc', item: null }
		};

		for (const [key, slot] of Object.entries(slots)) {
			if (clothingData[key]) {
				slot.item = clothingData[key];
			}
		}

		return {
			slots: slots
		};
	}

	async _onDrop(event) {
		const data = TextEditor.getDragEventData(event);
		const slotKey = event.target.closest('.clothing-slot')?.dataset.slot;

		if (!slotKey || data.type !== "Item") return;

		const item = await Item.implementation.fromDropData(data);
		if (!item) return;

		// Store item data in the slot
		const itemData = {
			id: item.id,
			name: item.name,
			img: item.img,
			uuid: item.uuid
		};

		await this.actor.setFlag(CONSTANTS.MODULE_NAME, `clothing.${slotKey}`, itemData);
		this.render(true);
	}

	activateListeners(html) {
		super.activateListeners(html);
		html.find('.item-delete').click(this._onRemoveItem.bind(this));
	}

	async _onRemoveItem(event) {
		const slotKey = event.currentTarget.closest('.clothing-slot').dataset.slot;
		await this.actor.unsetFlag(CONSTANTS.MODULE_NAME, `clothing.${slotKey}`);
		this.render(true);
	}

	static initialize() {
		// Add button to Actor Sheet header
		Hooks.on('getActorSheetHeaderButtons', (sheet, buttons) => {
			if (!game.user.isGM && !sheet.actor.isOwner) return;

			buttons.unshift({
				label: "Clothing",
				class: "clothing-system",
				icon: "fas fa-tshirt",
				onclick: () => {
					new ClothingSystem(sheet.actor).render(true);
				}
			});
		});

		// Add button to Token HUD
		Hooks.on('renderTokenHUD', (app, html, data) => {
			const actor = app.object.actor;
			if (!actor || (!game.user.isGM && !actor.isOwner)) return;

			const button = $(`
				<div class="control-icon clothing-system" title="Clothing">
					<i class="fas fa-tshirt"></i>
				</div>
			`);

			button.click(() => {
				new ClothingSystem(actor).render(true);
			});

			html.find('.col.right').append(button);
		});
	}
}
