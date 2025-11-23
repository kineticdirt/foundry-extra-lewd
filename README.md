# Foundry Extras

A comprehensive Foundry VTT module that adds several powerful tools to enhance your game: Playlist Importing, Ambient Sound Linking, Custom Compendium Building, Character Clothing System, and PDF Sheet Sync.

![Latest Release Download Count](https://img.shields.io/github/downloads/kineticdirt/foundry-extra-lewd/latest/module.zip?color=2b82fc&label=DOWNLOADS&style=for-the-badge)

## Features

### 1. Playlist Importer
Bulk import your local music library into Foundry VTT playlists.
- **Bulk Import**: Select a directory and import all audio files as playlists.
- **Duplicate Check**: Prevents adding the same song twice.
- **Folder Hierarchy**: Maintains your folder structure as playlist names.

### 2. Sound Linker
Create dynamic ambient sounds that cycle through a playlist.
- **Drag & Drop**: Drag a Playlist from the sidebar directly onto the Canvas.
- **Auto-Cycling**: The created Ambient Sound will play through the playlist tracks sequentially.
- **Visual Feedback**: Standard Ambient Sound controls with added playlist linking.

### 3. Compendium Builder
A dedicated UI for creating custom D&D 5e content.
- **Easy Creation**: Simple forms to create Classes, Backgrounds, and Proficiencies (Feats).
- **Access**: Click the "Builder" button in the Compendium Directory footer.
- **System Compatible**: Creates items compatible with the dnd5e system data structure.

### 4. Clothing System
Manage character clothing slots with a visual interface.
- **Slots**: Headwear, Necklace, Chest, Arms, Abdomen, Hips, Legwear, Misc.
- **Drag & Drop**: Equip any item (from Compendiums or Items directory) into slots.
- **Token Specific**: Open via Token HUD to manage outfits specific to that token instance.
- **Access**:
    - **Actor Sheet**: Click the "Clothing" button in the window header.
    - **Token HUD**: Right-click a token and select the T-Shirt icon.

### 5. PDF to Sheet Sync
Sync form data from a linked PDF character sheet to the standard 5e sheet.
- **Sync**: Click the "Sync PDF" button in the Actor Sheet header.
- **Smart Detection**: Automatically finds the actor-specific PDF created by the `pdf-sheets` module.
- **Debug Mode**: View all available PDF fields to help with mapping issues.

## Installation

1.  Copy the Manifest URL: `https://raw.githubusercontent.com/kineticdirt/foundry-extra-lewd/master/src/module.json`
2.  In Foundry VTT, go to **Add-on Modules** -> **Install Module**.
3.  Paste the URL and click **Install**.
4.  Enable the module in your World's **Manage Modules** settings.

## Usage Guide

### Playlist Importer
1.  Create a folder in your `FoundryVTT/Data/` directory (e.g., `music`).
2.  Organize your audio files into subfolders (e.g., `music/Battle`, `music/Tavern`).
3.  Go to **Module Settings** -> **Foundry Extras**.
4.  Set the **Base music directory** to your folder (e.g., `music`).
5.  Go to the **Playlists** sidebar tab.
6.  Click **Import Playlist** and follow the prompts.

### Sound Linker
1.  Open the **Playlists** sidebar.
2.  Drag a Playlist name onto the game canvas.
3.  An Ambient Sound is created at that location.
4.  The sound will play the first track and automatically proceed to the next when finished.

### Compendium Builder
1.  Open the **Compendium Packs** sidebar.
2.  Click the **Builder** button at the bottom.
3.  Select the type of content (Class, Background, Proficiency).
4.  Fill in the details and click **Create**.
5.  Find your new item in the **Items** directory.

### Clothing System
1.  Open a Character Sheet or right-click a Token.
2.  Click the **Clothing** button (Header or HUD T-Shirt icon).
3.  Drag items from the **Items** sidebar or **Compendiums** into the desired slots.
4.  Click the trash icon to remove an item.

### PDF Sync
1.  Ensure the actor has a PDF sheet assigned via the `pdf-sheets` module.
2.  Open the Actor Sheet.
3.  Click the **Sync PDF** button in the header.
4.  Click **Sync Data** to populate the sheet, or **Debug Mappings** to inspect the PDF fields.

## Build Instructions

If you want to build the module from source:

```bash
npm install
npm run build
```

## Credits

Original Playlist Importer code by JacobMcAuley.
Enhanced and expanded by KineticDirt.


