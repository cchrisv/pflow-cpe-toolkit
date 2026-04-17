import { LightningElement, api, track } from 'lwc';
import getObjectFields from '@salesforce/apex/PFlowCpeChoiceEngineController.getObjectFields';

const TYPE_ICON_MAP = {
    STRING: 'utility:text', TEXTAREA: 'utility:textarea',
    INTEGER: 'utility:number_input', LONG: 'utility:number_input', DOUBLE: 'utility:number_input',
    CURRENCY: 'utility:currency', PERCENT: 'utility:percent',
    BOOLEAN: 'utility:check',
    DATE: 'utility:date_input', DATETIME: 'utility:date_time', TIME: 'utility:clock',
    PICKLIST: 'utility:picklist_type', COMBOBOX: 'utility:picklist_type',
    MULTIPICKLIST: 'utility:multi_select_picklist',
    REFERENCE: 'utility:record_lookup', EMAIL: 'utility:email',
    PHONE: 'utility:phone_portrait', URL: 'utility:link',
    ID: 'utility:key', ADDRESS: 'utility:location', LOCATION: 'utility:location',
    ENCRYPTEDSTRING: 'utility:lock', BASE64: 'utility:image'
};

function iconFor(type) {
    return TYPE_ICON_MAP[(type || '').toUpperCase()] || 'utility:text';
}

function formatType(t) {
    const map = {
        MULTIPICKLIST: 'Multi-Picklist', ENCRYPTEDSTRING: 'Encrypted Text',
        TEXTAREA: 'Text Area', DATETIME: 'Date/Time', BOOLEAN: 'Checkbox',
        REFERENCE: 'Lookup', INTEGER: 'Number', DOUBLE: 'Number', LONG: 'Number'
    };
    const u = (t || '').toUpperCase();
    return map[u] || (u.charAt(0) + u.slice(1).toLowerCase());
}

function fieldToOption(f) {
    return {
        id: f.name || '', title: f.label || f.name || '',
        subtitle: `${f.name} — ${formatType(f.type)}`,
        icon: iconFor(f.type), type: f.type || ''
    };
}

// Module-level cache shared across all pickers on the page
const _cache = new Map();

function getCachedFields(objectApiName) {
    return _cache.get(objectApiName.toLowerCase()) || null;
}

function setCachedFields(objectApiName, options) {
    _cache.set(objectApiName.toLowerCase(), options);
}

export default class PflowCpeFieldPicker extends LightningElement {
    @track _allOptions = [];
    @track _selectedFields = [];
    _loadingFields = false;

    @api label = '';
    @api required = false;
    @api disabled = false;
    @api fieldLevelHelp;
    @api placeholder = 'Search fields...';
    @api isMultiEntry = false;
    /** Comma-separated field types to include (e.g. "PICKLIST,MULTIPICKLIST"). Empty = all types. */
    @api fieldTypeFilter = '';

    _value = '';
    _objectApiName = '';

    @api
    get value() { return this._value; }
    set value(v) {
        const next = v == null ? '' : String(v);
        if (next === this._value) return;
        this._value = next;
        if (this.isMultiEntry) this._syncSelectedFromValue();
    }

    @api
    get objectApiName() { return this._objectApiName; }
    set objectApiName(v) {
        const next = v == null ? '' : String(v).trim();
        if (next === this._objectApiName) return;
        this._objectApiName = next;
        this._allOptions = [];
        // Check cache immediately
        if (next) {
            const cached = getCachedFields(next);
            if (cached) {
                this._allOptions = this._applyTypeFilter(cached);
                if (this.isMultiEntry) this._syncSelectedFromValue();
            }
        }
    }

    // ── Single-select getters ─────────────────────────────────

    get selection() {
        if (this.isMultiEntry || !this._value) return null;
        const found = this._allOptions.find((o) => o.id === this._value);
        return found || { id: this._value, title: this._value, subtitle: '', icon: 'utility:text' };
    }

    // ── Multi-select getters ──────────────────────────────────

    get hasSelected() {
        return this.isMultiEntry && this._selectedFields.length > 0;
    }

    get availableOptions() {
        if (!this.isMultiEntry) return this._allOptions;
        const ids = new Set(this._selectedFields.map((f) => f.id));
        return this._allOptions.filter((o) => !ids.has(o.id));
    }

    get lookupVariant() {
        return this.isMultiEntry ? 'label-hidden' : 'label-stacked';
    }

    // ── Field loading ─────────────────────────────────────────

    /**
     * Load fields from Apex (or cache) and deliver results to the lookup.
     * Called on every search event so the lookup always gets results.
     */
    _ensureFields(lookup) {
        const obj = this._objectApiName;
        if (!obj) return;

        // Already loaded for this object
        if (this._allOptions.length) {
            return;
        }

        // Check module cache
        const cached = getCachedFields(obj);
        if (cached) {
            this._allOptions = this._applyTypeFilter(cached);
            if (this.isMultiEntry) this._syncSelectedFromValue();
            return;
        }

        // Need to fetch from Apex
        if (this._loadingFields) return;
        this._loadingFields = true;

        getObjectFields({ objectName: obj })
            .then((fields) => {
                if (this._objectApiName !== obj) return;
                const allOpts = (fields || []).map(fieldToOption);
                setCachedFields(obj, allOpts);
                this._allOptions = this._applyTypeFilter(allOpts);
                if (this.isMultiEntry) this._syncSelectedFromValue();
                // Deliver results to the lookup now that we have them
                if (lookup?.setSearchResults) {
                    const pool = this.isMultiEntry ? this.availableOptions : this._allOptions;
                    lookup.setSearchResults(pool);
                }
            })
            .catch(() => {
                this._allOptions = [];
            })
            .finally(() => {
                this._loadingFields = false;
            });
    }

    _applyTypeFilter(opts) {
        if (!this.fieldTypeFilter) return opts;
        const allowed = new Set(
            this.fieldTypeFilter.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean)
        );
        if (!allowed.size) return opts;
        return opts.filter((o) => allowed.has((o.type || '').toUpperCase()));
    }

    _syncSelectedFromValue() {
        if (!this._value) { this._selectedFields = []; return; }
        const names = this._value.split(',').map((s) => s.trim()).filter(Boolean);
        this._selectedFields = names.map((name) => {
            const found = this._allOptions.find((o) => o.id === name);
            return found || { id: name, title: name, subtitle: '', icon: 'utility:text', type: '' };
        });
    }

    // ── Event handlers ────────────────────────────────────────

    handleSearch(event) {
        const lu = event.currentTarget;

        // Ensure fields are loaded; if not yet loaded, the callback will deliver results
        this._ensureFields(lu);

        const term = (event.detail.rawSearchTerm || '').trim().toLowerCase();
        const pool = this.isMultiEntry ? this.availableOptions : this._allOptions;
        const filtered = term
            ? pool.filter((o) =>
                  (o.title || '').toLowerCase().includes(term) ||
                  (o.id || '').toLowerCase().includes(term) ||
                  (o.subtitle || '').toLowerCase().includes(term))
            : pool;
        if (lu?.setSearchResults) lu.setSearchResults(filtered);
    }

    handleSelectionChange(event) {
        const lu = event.currentTarget;
        const sel = lu?.getSelection?.();
        const row = Array.isArray(sel) ? sel[0] : sel;

        if (this.isMultiEntry) {
            if (!row?.id) return;
            if (this._selectedFields.some((f) => f.id === row.id)) return;
            this._selectedFields = [...this._selectedFields, row];
            this._emitMultiChange();
            // eslint-disable-next-line @lwc/lwc/no-async-operation
            Promise.resolve().then(() => {
                if (lu) {
                    lu.selection = null;
                    lu.setDefaultResults(this.availableOptions);
                }
            });
        } else {
            const fieldApiName = row?.id ? String(row.id) : '';
            const fieldLabel = row?.title ? String(row.title) : '';
            const fieldType = row?.type ? String(row.type) : '';
            this._value = fieldApiName;
            this.dispatchEvent(new CustomEvent('fieldchange', {
                detail: { fieldApiName, fieldLabel, fieldType }
            }));
        }
    }

    handleRemovePill(event) {
        const name = event.currentTarget?.name || event.detail?.name;
        this._selectedFields = this._selectedFields.filter((f) => f.id !== name);
        this._emitMultiChange();
    }

    _emitMultiChange() {
        const csv = this._selectedFields.map((f) => f.id).join(',');
        this._value = csv;
        this.dispatchEvent(new CustomEvent('change', { detail: { value: csv || null } }));
    }
}
