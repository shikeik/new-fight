import LunaDataGrid from 'luna-data-grid';
import { deleteDB, openDB } from 'idb';
import type { DevTools } from 'eruda';

export interface IndexedDBItem {
    database: string;
    store: string;
    objects: string;
}

export default class ErudaIndexedDB {
    private dataGrid: LunaDataGrid | null = null;
    private items: IndexedDBItem[] = [];
    private devTools: DevTools | null = null;
    private selectedItem: IndexedDBItem | null = null;
    private supported = true;
    private container: HTMLElement | null = null;
    private dataGridEl: HTMLElement | null = null;
    private filterText = '';

    public init($container: HTMLElement, devTools: DevTools): void {
        this.devTools = devTools;
        this.container = $container;
        this.initTemplate(this.container);
        this.dataGridEl = this.container.querySelector('.eruda-data-grid') as HTMLElement;
        this.dataGrid = new LunaDataGrid(this.dataGridEl, {
            columns: [
                { id: 'database', title: 'Database', weight: 30 },
                { id: 'store', title: 'Store', weight: 60 },
                { id: 'objects', title: 'Objects', weight: 20 },
            ],
            maxHeight: 223,
        });

        this.bindEvents();
        this.refresh();
    }

    public destroy(): void {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.dataGrid?.destroy();
    }

    public show(): void {
        this.refresh();
    }

    private async refresh(): Promise<void> {
        if (!this.supported) {
            if (this.container) this.container.style.display = 'none';
            return;
        }

        await this.refreshData();

        this.dataGrid?.clear();

        const filter = this.filterText.toLowerCase();
        for (const { database, store, objects } of this.items) {
            if (filter && !`${database} ${store} ${objects}`.toLowerCase().includes(filter)) {
                continue;
            }
            this.dataGrid?.append({ database, store, objects }, { selectable: true });
        }
    }

    private updateFilterText() {
        const el = this.container?.querySelector('.eruda-filter-text') as HTMLElement | null;
        if (!el) return;
        if (this.filterText) {
            el.textContent = this.filterText;
            el.style.display = '';
        } else {
            el.textContent = '';
            el.style.display = 'none';
        }
    }

    private initTemplate(el: HTMLElement): void {
        el.innerHTML = `
            <h2 class="eruda-title" style="border-top:1px solid #ccc;border-right:1px solid #ccc;border-left:1px solid #ccc;border-bottom:none;">
                IndexedDB
                <div class="eruda-btn eruda-refresh-databases">
                    <span class="eruda-icon eruda-icon-refresh"></span>
                </div>
                <div class="eruda-btn eruda-show-detail eruda-btn-disabled">
                    <span class="eruda-icon eruda-icon-eye"></span>
                </div>
                <div class="eruda-btn eruda-clear-database">
                    <span class="eruda-icon eruda-icon-clear"></span>
                </div>
                <div class="eruda-btn eruda-filter">
                    <span class="eruda-icon eruda-icon-filter"></span>
                </div>
                <div class="eruda-btn eruda-filter-text" style="display:none"></div>
            </h2>
            <div class="eruda-data-grid"></div>
        `;
    }

    private bindEvents() {
        if (!this.container) return;

        this.container.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.eruda-refresh-databases')) {
                this.devTools?.notify('Refreshed', { icon: 'success' });
                this.refresh();
            } else if (target.closest('.eruda-clear-database')) {
                if (!this.selectedItem || !confirm(`Are you sure that you want to delete the '${this.selectedItem.database}' database?`)) {
                    return;
                }
                deleteDB(this.selectedItem.database).then(() => this.refresh());
            } else if (target.closest('.eruda-filter')) {
                this.devTools?.notify('Filter', {
                    input: true,
                    onConfirm: (val: string) => {
                        this.filterText = val || '';
                        this.updateFilterText();
                        this.refresh();
                    },
                });
            } else if (target.closest('.eruda-show-detail')) {
                if (!this.selectedItem) return;
                const { database, store } = this.selectedItem;
                this.getValue(database, store).then((val) => {
                    try {
                        this.showSources('object', JSON.parse(JSON.stringify(val)));
                    } catch {
                        this.showSources('raw', val);
                    }
                });
            }
        });

        this.dataGrid
            ?.on('select', (node: any) => {
                this.selectedItem = {
                    database: node.data.database,
                    store: node.data.store,
                    objects: node.data.objects,
                };
                this.updateButtons();
            })
            .on('deselect', () => {
                this.selectedItem = null;
                this.updateButtons();
            });
    }

    private showSources(type: string, data: unknown) {
        const sources = this.devTools?.get('sources') as unknown as { set: (type: string, data: unknown) => void };
        if (!sources) return;
        sources.set(type, data);
        this.devTools?.showTool('sources');
        return true;
    }

    private async getValue(database: string, store: string) {
        const db = await openDB(database);
        const objects = await db.getAll(store);
        db.close();
        return objects;
    }

    private updateButtons() {
        const btn = this.container?.querySelector('.eruda-show-detail') as HTMLElement | null;
        if (!btn) return;
        if (this.selectedItem) {
            btn.classList.remove('eruda-btn-disabled');
        } else {
            btn.classList.add('eruda-btn-disabled');
        }
    }

    private async refreshData() {
        try {
            const databases = await indexedDB.databases();
            const values = await Promise.all(
                databases.map(async (database) => {
                    if (!database.name) return;
                    const db = await openDB(database.name);
                    const databaseValues = await Promise.all(
                        Array.from(db.objectStoreNames).map(async (store) => ({
                            database: database.name,
                            store,
                            objects: String(await db.count(store)),
                        })),
                    );
                    db.close();
                    return databaseValues;
                }),
            );
            this.items = values.flat().filter(Boolean) as IndexedDBItem[];
        } catch {
            this.supported = false;
            if (this.container) this.container.style.display = 'none';
        }
    }
}
