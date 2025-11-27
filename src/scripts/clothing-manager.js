import CONSTANTS from '../module/constants.js';

export class ClothingManager {
	/**
	 * Define body sections with multiple slots each
	 * Each section can have 3-5 slots for layering
	 */
	static get SECTIONS() {
		return {
			head: {
				label: 'Head',
				icon: 'fas fa-head-side',
				slots: [
					{ key: 'head_1', label: 'Headwear 1', layer: 1 },
					{ key: 'head_2', label: 'Headwear 2', layer: 2 },
					{ key: 'head_3', label: 'Headwear 3', layer: 3 }
				]
			},
			shoulders: {
				label: 'Shoulders',
				icon: 'fas fa-vest',
				slots: [
					{ key: 'shoulders_1', label: 'Shoulders 1', layer: 1 },
					{ key: 'shoulders_2', label: 'Shoulders 2', layer: 2 },
					{ key: 'shoulders_3', label: 'Shoulders 3', layer: 3 }
				]
			},
			abdomen: {
				label: 'Abdomen',
				icon: 'fas fa-user',
				slots: [
					{ key: 'abdomen_1', label: 'Underwear', layer: 1 },
					{ key: 'abdomen_2', label: 'Shirt', layer: 2 },
					{ key: 'abdomen_3', label: 'Vest/Jacket', layer: 3 },
					{ key: 'abdomen_4', label: 'Coat', layer: 4 }
				]
			},
			hips: {
				label: 'Hips',
				icon: 'fas fa-user-friends',
				slots: [
					{ key: 'hips_1', label: 'Underwear', layer: 1 },
					{ key: 'hips_2', label: 'Pants', layer: 2 },
					{ key: 'hips_3', label: 'Belt/Skirt', layer: 3 }
				]
			},
			legs: {
				label: 'Legs',
				icon: 'fas fa-socks',
				slots: [
					{ key: 'legs_1', label: 'Socks/Stockings', layer: 1 },
					{ key: 'legs_2', label: 'Pants/Leggings', layer: 2 },
					{ key: 'legs_3', label: 'Leg Armor', layer: 3 }
				]
			},
			feet: {
				label: 'Feet',
				icon: 'fas fa-shoe-prints',
				slots: [
					{ key: 'feet_1', label: 'Shoes', layer: 1 },
					{ key: 'feet_2', label: 'Boots', layer: 2 },
					{ key: 'feet_3', label: 'Foot Armor', layer: 3 }
				]
			}
		};
	}

	/**
	 * Get all slot keys flattened from sections
	 */
	static getAllSlotKeys() {
		const keys = [];
		for (const section of Object.values(ClothingManager.SECTIONS)) {
			for (const slot of section.slots) {
				keys.push(slot.key);
			}
		}
		return keys;
	}

	/**
	 * Get clothing data organized by sections with items
	 * @param {Document} document 
	 * @returns {Object}
	 */
	static getClothingData(document) {
		const clothingData = document.getFlag(CONSTANTS.MODULE_NAME, 'clothing') || {};
		const sections = JSON.parse(JSON.stringify(ClothingManager.SECTIONS));

		// Populate items into slots
		for (const section of Object.values(sections)) {
			for (const slot of section.slots) {
				slot.item = clothingData[slot.key] || null;
			}
		}

		return sections;
	}

	/**
	 * Handle dropping an item onto a slot
	 * @param {Document} document - The document to store the flag on (Token or Actor)
	 * @param {Actor} actor - The actor that owns/will own the item
	 * @param {String} slotKey - The key of the slot
	 * @param {Object} data - The drag data
	 */
	static async handleDrop(document, actor, slotKey, data) {
		if (!slotKey || data.type !== "Item") return;

		let item = await Item.fromDropData(data);
		if (!item) return;

		// Validate item type (optional - can be customized)
		const validTypes = ['equipment', 'loot', 'consumable', 'weapon', 'armor'];
		if (!validTypes.includes(item.type)) {
			ui.notifications.warn(`${item.name} cannot be equipped as clothing`);
			return;
		}

		// Inventory Integration: Check if item is owned by this actor
		let ownedItem = item;
		if (item.parent !== actor) {
			// Create a copy in this actor's inventory
			const createdItems = await actor.createEmbeddedDocuments("Item", [item.toObject()]);
			ownedItem = createdItems[0];
			ui.notifications.info(`Added ${ownedItem.name} to inventory.`);
		}

		// Store item data in the slot
		const itemData = {
			id: ownedItem.id,
			name: ownedItem.name,
			img: ownedItem.img,
			uuid: ownedItem.uuid
		};

		// Save flag to the specific document
		await document.setFlag(CONSTANTS.MODULE_NAME, `clothing.${slotKey}`, itemData);
		return itemData;
	}

	/**
	 * Remove an item from a slot
	 * @param {Document} document 
	 * @param {String} slotKey 
	 */
	static async removeItem(document, slotKey) {
		await document.unsetFlag(CONSTANTS.MODULE_NAME, `clothing.${slotKey}`);
	}
}
