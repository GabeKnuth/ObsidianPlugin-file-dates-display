const obsidian = require('obsidian');

class FileDatesPlugin extends obsidian.Plugin {
    settings = {
        fontSize: '12px',
        italic: true,
        showCreated: true,
        showModified: true,
        dateFormat: 'MM-DD-YYYY' // Default format
    };

    async onload() {
        console.log('Loading File Dates Plugin');
        
        // Load settings
        await this.loadSettings();
        
        // Register event to update dates when file is modified
        this.registerEvent(
            this.app.workspace.on('file-open', () => {
                this.updateActiveDates();
            })
        );
        
        // Update when layout changes (for active file)
        this.registerEvent(
            this.app.workspace.on('layout-change', () => {
                setTimeout(() => {
                    this.updateActiveDates();
                }, 100); // Small delay to ensure UI is ready
            })
        );
        
        // Update when file is saved
        this.registerEvent(
            this.app.vault.on('modify', (file) => {
                const activeFile = this.app.workspace.getActiveFile();
                if (activeFile && file && activeFile.path === file.path) {
                    this.updateActiveDates();
                }
            })
        );

        // Add settings tab
        this.addSettingTab(new FileDatesSettingTab(this.app, this));
        
        // Initial update
        setTimeout(() => {
            this.updateActiveDates();
        }, 500);
    }
    
    updateActiveDates() {
        // Get active leaf
        const activeLeaf = this.app.workspace.activeLeaf;
        if (!activeLeaf) return;

        // Get the view
        const view = activeLeaf.view;
        if (!view) return;

        // Get file from view
        const file = this.app.workspace.getActiveFile();
        if (!file) return;
        
        // Remove all existing date containers first to prevent duplicates
        const existingContainers = view.containerEl.querySelectorAll('.file-dates-container');
        existingContainers.forEach(container => container.remove());
        
        // First look for the content-container which contains the inline title
        const contentContainer = view.containerEl.querySelector('.inline-title')?.closest('.markdown-source-view, .markdown-preview-view');
        if (!contentContainer) return;

        // Find inline title element - this is the actual title that users see
        const inlineTitleEl = contentContainer.querySelector('.inline-title');
        if (!inlineTitleEl) return;
        
        // Create a new date container
        const dateContainer = document.createElement('div');
        dateContainer.classList.add('file-dates-container');
        
        // Insert before the title
        inlineTitleEl.parentElement.insertBefore(dateContainer, inlineTitleEl);
        
        // Update the dates text
        let dateText = '';
        
        if (this.settings.showCreated) {
            const createdDate = this.formatDate(file.stat.ctime);
            dateText += `Created: ${createdDate}`;
        }
        
        if (this.settings.showCreated && this.settings.showModified) {
            dateText += ' • ';
        }
        
        if (this.settings.showModified) {
            const modifiedDate = this.formatDate(file.stat.mtime);
            dateText += `Modified: ${modifiedDate}`;
        }
        
        dateContainer.textContent = dateText;
        
        // Apply styling from settings
        dateContainer.style.fontSize = this.settings.fontSize;
        if (this.settings.italic) {
            dateContainer.style.fontStyle = 'italic';
        }
    }
    
    formatDate(timestamp) {
        // Use Obsidian's moment.js for formatting
        const moment = window.moment;
        return moment(timestamp).format(this.settings.dateFormat);
    }
    
    async loadSettings() {
        this.settings = Object.assign({}, this.settings, await this.loadData());
    }
    
    async saveSettings() {
        await this.saveData(this.settings);
    }
    
    onunload() {
        console.log('Unloading File Dates Plugin');
    }
}

class FileDatesSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    
    display() {
        const {containerEl} = this;
        containerEl.empty();
        
        containerEl.createEl('h2', {text: 'File Dates Plugin Settings'});
        
        new obsidian.Setting(containerEl)
            .setName('Font Size')
            .setDesc('Set the font size for the date display')
            .addText(text => text
                .setValue(this.plugin.settings.fontSize)
                .onChange(async (value) => {
                    this.plugin.settings.fontSize = value;
                    await this.plugin.saveSettings();
                    this.plugin.updateActiveDates();
                }));
                
        new obsidian.Setting(containerEl)
            .setName('Italic')
            .setDesc('Display dates in italic')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.italic)
                .onChange(async (value) => {
                    this.plugin.settings.italic = value;
                    await this.plugin.saveSettings();
                    this.plugin.updateActiveDates();
                }));
                
        new obsidian.Setting(containerEl)
            .setName('Show Created Date')
            .setDesc('Display the file creation date')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showCreated)
                .onChange(async (value) => {
                    this.plugin.settings.showCreated = value;
                    await this.plugin.saveSettings();
                    this.plugin.updateActiveDates();
                }));
                
        new obsidian.Setting(containerEl)
            .setName('Show Modified Date')
            .setDesc('Display the file modification date')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showModified)
                .onChange(async (value) => {
                    this.plugin.settings.showModified = value;
                    await this.plugin.saveSettings();
                    this.plugin.updateActiveDates();
                }));
                
        new obsidian.Setting(containerEl)
            .setName('Date Format')
            .setDesc('Format for displaying dates (uses Moment.js formatting)')
            .addText(text => text
                .setValue(this.plugin.settings.dateFormat)
                .onChange(async (value) => {
                    this.plugin.settings.dateFormat = value;
                    await this.plugin.saveSettings();
                    this.plugin.updateActiveDates();
                }));
    }
}

module.exports = FileDatesPlugin;