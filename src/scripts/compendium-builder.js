import CONSTANTS from '../module/constants.js';

export class CompendiumBuilder extends FormApplication {
	constructor(object, options) {
		super(object, options);
	}

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: 'compendium-builder',
			title: 'Compendium Builder',
			template: `modules/${CONSTANTS.MODULE_NAME}/templates/compendium-builder.hbs`,
			width: 400,
			height: 'auto',
			resizable: true,
		});
	}

	getData() {
		return {
			// Add data for the template
		};
	}

	async _updateObject(event, formData) {
		const type = formData.type;
		const name = formData.name;
		const description = formData.description;

		if (!name) {
			ui.notifications.warn("Please provide a name.");
			return;
		}

		if (type === 'class') {
			await this._createClass(name, description);
		} else if (type === 'background') {
			await this._createBackground(name, description);
		} else if (type === 'proficiency') {
			await this._createProficiency(name, description);
		}
	}

	async _createClass(name, description) {
		const itemData = {
			name: name,
			type: 'class',
			system: {
				description: { value: description },
				// Add default class data here
			}
		};
		await Item.create(itemData);
		ui.notifications.info(`Created Class: ${name}`);
	}

	async _createBackground(name, description) {
		const itemData = {
			name: name,
			type: 'background',
			system: {
				description: { value: description },
				// Add default background data here
			}
		};
		await Item.create(itemData);
		ui.notifications.info(`Created Background: ${name}`);
	}

	async _createProficiency(name, description) {
		// Proficiencies might be Items (Feats) or just flags?
		// Assuming Feat for now as that's standard for 5e
		const itemData = {
			name: name,
			type: 'feat',
			system: {
				description: { value: description },
				type: {
					value: 'tool', // Or appropriate type
					subtype: ''
				}
			}
		};
		await Item.create(itemData);
		ui.notifications.info(`Created Proficiency: ${name}`);
	}

	static initialize() {
		// Add a button to the Compendium sidebar or Settings
		Hooks.on('renderCompendiumDirectory', (app, html, data) => {
			const button = $(`<button><i class="fas fa-hammer"></i> Builder</button>`);
			button.click(() => {
				new CompendiumBuilder().render(true);
			});
			html.find('.directory-footer').append(button);
		});
	}
}
