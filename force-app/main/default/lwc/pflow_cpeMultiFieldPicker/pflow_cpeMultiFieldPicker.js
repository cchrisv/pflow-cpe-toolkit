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
    return TYPE_ICON_MAP[(type || '').toUpperCase()] || 'utility:recipe';
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

const _cache = new Map();
const _inflight = new Map();

function loadFieldsCached(objectApiName) {
    const key = objectApiName.toLowerCase();
    if (_cache.has(key)) return Promise.resolve(_cache.get(key));
    if (_inflight.has(key)) return _inflight.get(key);
    const p = getObjectFields({ objectName: objectApiName })
        .then((fields) => {
            const opts = (fields || []).map(fieldToOption);
            _cache.set(key, opts);
            _inflight.delete(key);
            return opts;
        })
        .catch(() => { _inflight.delete(key); return []; });
    _inflight.set(key, p);
    return p;
}

export default class PflowCpeMultiFieldPicker extends LightningElement {
    @track _selectedFields = [];
    @track _allOptions = [];
    _loadedObject = '';
    _connected = false;

    @api label = 'Additional Fields';
    @api disabled = false;
    @api fieldLevelHelp;
    @api placeholder = 'Search fields...';

    _value = '';
    _objectApiName = '';

    @api
    get value() { return this._value; }
    set value(v) {
        const next = v == null ? '' : String(v);
        if (next === this._value) return;
        this._value = next;
        this._syncSelectedFromValue();
    }

    @api
    get objectApiName() { return this._objectApiName; }
    set objectApiName(v) {
        const next = v == null ? '' : String(v).trim();
        if (next === this._objectApiName) return;
        this._objectApiName = next;
        this._allOptions = [];
        this._loadedObject = '';
        if (this._connected) this._loadFields();
    }

    get hasSelected() { return this._selectedFields.length > 0; }

    get availableOptions() {
        const ids = new Set(this._selectedFields.map((f) => f.id));
        return this._allOptions.filter((o) => !ids.has(o.id));
    }

    connectedCallback() {
        this._connected = true;
        if (this._objectApiName && !this._loadedObject) this._loadFields();
    }

    disconnectedCallback() { this._connected = false; }

    _loadFields() {
        const obj = this._objectApiName;
        if (!obj) { this._allOptions = []; this._loadedObject = ''; return; }
        loadFieldsCached(obj).then((opts) => {
            if (!this._connected || this._objectApiName !== obj) return;
            this._allOptions = opts;
            this._loadedObject = obj;
            this._syncSelectedFromValue();
            const lu = this.template.querySelector('c-pflow-cpe-custom-lookup');
            if (lu?.setDefaultResults) lu.setDefaultResults(this.availableOptions);
        });
    }

    _syncSelectedFromValue() {
        if (!this._value) { this._selectedFields = []; return; }
        const names = this._value.split(',').map((s) => s.trim()).filter(Boolean);
        this._selectedFields = names.map((name) => {
            const found = this._allOptions.find((o) => o.id === name);
            return found || { id: name, title: name, subtitle: '', icon: 'utility:recipe', type: '' };
        });
    }

    handleSearch(event) {
        const term = (event.detail.rawSearchTerm || '').trim().toLowerCase();
        const available = this.availableOptions;
        const filtered = term
            ? available.filter((o) =>
                  (o.title || '').toLowerCase().includes(term) ||
                  (o.id || '').toLowerCase().includes(term))
            : available;
        const lu = event.currentTarget;
        if (lu?.setSearchResults) lu.setSearchResults(filtered);
    }

    handleSelectionChange(event) {
        const lu = event.currentTarget;
        const sel = lu?.getSelection?.();
        const row = Array.isArray(sel) ? sel[0] : sel;
        if (!row?.id) return;
        if (this._selectedFields.some((f) => f.id === row.id)) return;
        this._selectedFields = [...this._selectedFields, row];
        this._emitChange();
        // Clear the lookup selection so user can pick another
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        Promise.resolve().then(() => {
            if (lu) {
                lu.selection = null;
                lu.setDefaultResults(this.availableOptions);
            }
        });
    }

    handleRemovePill(event) {
        const name = event.currentTarget?.name || event.detail?.name;
        this._selectedFields = this._selectedFields.filter((f) => f.id !== name);
        this._emitChange();
    }

    _emitChange() {
        const csv = this._selectedFields.map((f) => f.id).join(',');
        this._value = csv;
        this.dispatchEvent(new CustomEvent('change', { detail: { value: csv || null } }));
    }
}
