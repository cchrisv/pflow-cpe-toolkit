import { LightningElement, api, track } from 'lwc';
import searchLookupDatasetFieldsForObject from '@salesforce/apex/PFlowCpeChoiceEngineController.searchLookupDatasetFieldsForObject';

// ── Operator sets by field type ──────────────────────────────

const OPS_TEXT = [
    { label: '=', value: '=' },
    { label: '!=', value: '!=' },
    { label: 'LIKE', value: 'LIKE' },
    { label: 'NOT LIKE', value: 'NOT LIKE' },
    { label: 'IN', value: 'IN' },
    { label: 'NOT IN', value: 'NOT IN' }
];

const OPS_NUMBER = [
    { label: '=', value: '=' },
    { label: '!=', value: '!=' },
    { label: '<', value: '<' },
    { label: '>', value: '>' },
    { label: '<=', value: '<=' },
    { label: '>=', value: '>=' }
];

const OPS_BOOLEAN = [
    { label: '=', value: '=' },
    { label: '!=', value: '!=' }
];

const OPS_DATE = [
    { label: '=', value: '=' },
    { label: '!=', value: '!=' },
    { label: '<', value: '<' },
    { label: '>', value: '>' },
    { label: '<=', value: '<=' },
    { label: '>=', value: '>=' }
];

const OPS_PICKLIST = [
    { label: '=', value: '=' },
    { label: '!=', value: '!=' },
    { label: 'IN', value: 'IN' },
    { label: 'NOT IN', value: 'NOT IN' }
];

const OPS_MULTIPICKLIST = [
    { label: 'INCLUDES', value: 'INCLUDES' },
    { label: 'EXCLUDES', value: 'EXCLUDES' }
];

const OPS_REFERENCE = [
    { label: '=', value: '=' },
    { label: '!=', value: '!=' },
    { label: 'IN', value: 'IN' },
    { label: 'NOT IN', value: 'NOT IN' }
];

export function operatorsForType(fieldType) {
    const t = (fieldType || '').toUpperCase();
    switch (t) {
        case 'STRING':
        case 'TEXTAREA':
        case 'URL':
        case 'EMAIL':
        case 'PHONE':
        case 'ENCRYPTEDSTRING':
            return OPS_TEXT;
        case 'INTEGER':
        case 'LONG':
        case 'DOUBLE':
        case 'CURRENCY':
        case 'PERCENT':
            return OPS_NUMBER;
        case 'BOOLEAN':
            return OPS_BOOLEAN;
        case 'DATE':
        case 'DATETIME':
        case 'TIME':
            return OPS_DATE;
        case 'PICKLIST':
        case 'COMBOBOX':
            return OPS_PICKLIST;
        case 'MULTIPICKLIST':
            return OPS_MULTIPICKLIST;
        case 'REFERENCE':
        case 'ID':
            return OPS_REFERENCE;
        default:
            return OPS_TEXT;
    }
}

const LOGIC_OPTIONS = [
    { label: 'AND', value: 'AND' },
    { label: 'OR', value: 'OR' }
];

const BOOLEAN_OPTIONS = [
    { label: 'TRUE', value: 'TRUE' },
    { label: 'FALSE', value: 'FALSE' }
];

let _condSeq = 0;

// ── Serialization ────────────────────────────────────────────

function escapeString(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export function serializeValue(raw, fieldType, operator) {
    const t = (fieldType || '').toUpperCase();
    const op = (operator || '').toUpperCase();

    if (op === 'IN' || op === 'NOT IN') {
        const rawStr = String(raw);
        // Merge field as entire IN value: Field IN {!CollectionVar}
        if (rawStr.startsWith('{!') || rawStr.startsWith('{$')) {
            return rawStr;
        }
        const items = rawStr.split(',').map((v) => v.trim()).filter(Boolean);
        if (t === 'INTEGER' || t === 'LONG' || t === 'DOUBLE' || t === 'CURRENCY' || t === 'PERCENT') {
            return '(' + items.join(', ') + ')';
        }
        return '(' + items.map((v) => "'" + escapeString(v) + "'").join(', ') + ')';
    }
    if (t === 'BOOLEAN') {
        return String(raw).toUpperCase() === 'TRUE' ? 'TRUE' : 'FALSE';
    }
    if (t === 'INTEGER' || t === 'LONG' || t === 'DOUBLE' || t === 'CURRENCY' || t === 'PERCENT') {
        return String(raw);
    }
    if (t === 'DATE' || t === 'DATETIME') {
        return String(raw);
    }
    // Merge fields pass through unquoted
    const str = String(raw);
    if (str.startsWith('{!') || str.startsWith('{$')) {
        return str;
    }
    if (op === 'LIKE' || op === 'NOT LIKE') {
        if (!str.includes('%') && !str.includes('_')) {
            return "'%" + escapeString(str) + "%'";
        }
        return "'" + escapeString(str) + "'";
    }
    return "'" + escapeString(raw) + "'";
}

export function serializeConditions(conditions, logic) {
    const parts = [];
    for (const c of conditions) {
        if (!c.field || !c.operator || (c.value === '' && c.value !== 0)) {
            continue;
        }
        const fieldType = c._fieldType || '';
        const val = serializeValue(c.value, fieldType, c.operator);
        parts.push(`${c.field} ${c.operator} ${val}`);
    }
    return parts.join(` ${logic} `);
}

// ── Parsing (best-effort) ────────────────────────────────────

export function parseWhereClause(str) {
    if (!str || !str.trim()) {
        return { conditions: [], logic: 'AND' };
    }
    const s = str.trim();
    let logic = 'AND';
    let segments;
    if (/ AND /i.test(s) && !/ OR /i.test(s)) {
        logic = 'AND';
        segments = s.split(/ AND /i);
    } else if (/ OR /i.test(s) && !/ AND /i.test(s)) {
        logic = 'OR';
        segments = s.split(/ OR /i);
    } else if (!/ AND /i.test(s) && !/ OR /i.test(s)) {
        segments = [s];
    } else {
        return null; // Mixed AND/OR — too complex
    }

    const conditions = [];
    const opPattern =
        /^(\w+(?:\.\w+)?)\s+(=|!=|<>|<=|>=|<|>|LIKE|NOT\s+LIKE|NOT\s+IN|IN|INCLUDES|EXCLUDES)\s+(.+)$/i;
    for (const seg of segments) {
        const trimmed = seg.trim();
        if (!trimmed) continue;
        const m = trimmed.match(opPattern);
        if (!m) {
            return null; // Unparseable segment
        }
        const field = m[1];
        const operator = m[2].toUpperCase().replace(/\s+/g, ' ');
        let value = m[3].trim();
        // Strip surrounding quotes for simple string values
        if (value.startsWith("'") && value.endsWith("'") && !value.includes('(')) {
            value = value.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, '\\');
            // Strip wrapping % from LIKE values
            if ((operator === 'LIKE' || operator === 'NOT LIKE') && value.startsWith('%') && value.endsWith('%')) {
                value = value.slice(1, -1);
            }
        }
        // Strip parens from IN values
        if (value.startsWith('(') && value.endsWith(')')) {
            value = value
                .slice(1, -1)
                .split(',')
                .map((v) => {
                    const t = v.trim();
                    return t.startsWith("'") && t.endsWith("'") ? t.slice(1, -1) : t;
                })
                .join(', ');
        }
        conditions.push({
            id: `c${++_condSeq}`,
            field,
            operator,
            value,
            _fieldType: ''
        });
    }
    return { conditions, logic };
}

// ── Component ────────────────────────────────────────────────

export default class PflowOrganismWhereBuilder extends LightningElement {
    @track conditions = [];
    @track logicOperator = 'AND';
    @track _fieldOptions = [];

    _loadedObject = '';
    _rawFieldMap = {};
    _initialized = false;
    _connected = false;

    @api disabled = false;
    @api builderContext;
    @api automaticOutputVariables;
    @api maxWidth = 280;

    _objectApiName = '';
    _value = '';

    @api
    get objectApiName() {
        return this._objectApiName;
    }
    set objectApiName(v) {
        const next = v == null ? '' : String(v).trim();
        if (next === this._objectApiName) return;
        this._objectApiName = next;
        if (this._connected) this._loadFieldOptions();
    }

    @api
    get value() {
        return this._value;
    }
    set value(v) {
        const next = v == null ? '' : String(v);
        if (next === this._value) return;
        this._value = next;
        if (!this._initialized) {
            this._initFromValue();
        }
    }

    get logicOptions() {
        return LOGIC_OPTIONS;
    }

    get showLogic() {
        return this.conditions.length > 1;
    }

    get conditionRows() {
        return this.conditions.map((c, i) => {
            const fieldType = this._resolveFieldType(c.field);
            const fieldSelection = c.field
                ? { id: c.field, title: this._fieldLabel(c.field), subtitle: '', icon: 'utility:text' }
                : null;
            return {
                ...c,
                index: i,
                removable: this.conditions.length > 1,
                operatorOptions: operatorsForType(fieldType),
                isBooleanValue: fieldType.toUpperCase() === 'BOOLEAN',
                isDateValue:
                    fieldType.toUpperCase() === 'DATE' || fieldType.toUpperCase() === 'DATETIME',
                isListOperator:
                    c.operator === 'IN' ||
                    c.operator === 'NOT IN' ||
                    c.operator === 'INCLUDES' ||
                    c.operator === 'EXCLUDES',
                booleanOptions: BOOLEAN_OPTIONS,
                fieldSelection,
                valueName: `where_val_${i}`
            };
        });
    }

    _fieldLabel(apiName) {
        if (!apiName) return '';
        const f = this._rawFieldMap[apiName.toLowerCase()];
        return f ? f.label || apiName : apiName;
    }

    /** Unparseable flag: when the existing value can't be parsed, the parent should show raw mode. */
    @api
    get isParseable() {
        if (!this._value) return true;
        return parseWhereClause(this._value) !== null;
    }

    connectedCallback() {
        this._connected = true;
        if (this._objectApiName && !this._loadedObject) {
            this._loadFieldOptions();
        }
        if (!this._initialized) {
            this._initFromValue();
        }
    }

    disconnectedCallback() {
        this._connected = false;
    }

    _initFromValue() {
        this._initialized = true;
        if (!this._value) {
            this.conditions = [{ id: `c${++_condSeq}`, field: '', operator: '=', value: '', _fieldType: '' }];
            return;
        }
        const parsed = parseWhereClause(this._value);
        if (!parsed || !parsed.conditions.length) {
            this.conditions = [{ id: `c${++_condSeq}`, field: '', operator: '=', value: '', _fieldType: '' }];
            return;
        }
        this.logicOperator = parsed.logic;
        this.conditions = parsed.conditions.map((c) => ({
            ...c,
            _fieldType: this._resolveFieldType(c.field)
        }));
    }

    _loadFieldOptions() {
        const obj = this._objectApiName;
        if (!obj) {
            this._fieldOptions = [];
            this._rawFieldMap = {};
            this._loadedObject = '';
            return;
        }
        if (obj === this._loadedObject) return;
        searchLookupDatasetFieldsForObject({ objectApiName: obj, searchKey: '' })
            .then((rows) => {
                if (!this._connected || this._objectApiName !== obj) return;
                this._rawFieldMap = {};
                (rows || []).forEach((r) => {
                    // Subtitle format: "ApiName — TYPE"
                    const sub = String(r.subtitle || '');
                    const sep = sub.lastIndexOf('—');
                    const fieldType = sep >= 0 ? sub.substring(sep + 1).trim() : '';
                    const apiName = String(r.value || r.id || '');
                    if (apiName) {
                        this._rawFieldMap[apiName.toLowerCase()] = { name: apiName, label: r.label || apiName, type: fieldType };
                    }
                });
                this._fieldOptions = (rows || []).map((r) => ({
                    label: `${r.label || r.value} (${r.value})`,
                    value: r.value || r.id || ''
                }));
                this._loadedObject = obj;
                this.conditions = this.conditions.map((c) => ({
                    ...c,
                    _fieldType: this._resolveFieldType(c.field)
                }));
            })
            .catch(() => {
                this._fieldOptions = [];
            });
    }

    _resolveFieldType(fieldApiName) {
        if (!fieldApiName) return '';
        const f = this._rawFieldMap[fieldApiName.toLowerCase()];
        return f ? f.type || '' : '';
    }

    handleLogicChange(event) {
        this.logicOperator = event.detail.value;
        this._emitChange();
    }

    handleFieldSearch(event) {
        const lu = event.currentTarget;
        const obj = this._objectApiName;
        if (!obj) { lu.setSearchResults([]); return; }
        const term = event.detail.rawSearchTerm != null ? String(event.detail.rawSearchTerm) : '';
        searchLookupDatasetFieldsForObject({ objectApiName: obj, searchKey: term })
            .then((rows) => lu.setSearchResults(rows || []))
            .catch(() => lu.setSearchResults([]));
    }

    handleFieldSelectionChange(event) {
        const lu = event.currentTarget;
        const idx = Number(lu.dataset.index);
        const sel = lu.getSelection?.();
        const row = Array.isArray(sel) ? sel[0] : sel;
        const fieldName = row?.id ? String(row.id) : '';
        const fieldType = this._resolveFieldType(fieldName);
        const ops = operatorsForType(fieldType);
        const c = this.conditions[idx];
        const currentOpValid = c && ops.some((o) => o.value === c.operator);
        this.conditions = this.conditions.map((item, i) =>
            i === idx
                ? { ...item, field: fieldName, _fieldType: fieldType, operator: currentOpValid ? item.operator : ops[0].value, value: '' }
                : item
        );
        this._emitChange();
    }

    handleOperatorChange(event) {
        const idx = Number(event.currentTarget.dataset.index);
        this.conditions = this.conditions.map((item, i) =>
            i === idx ? { ...item, operator: event.detail.value } : item
        );
        this._emitChange();
    }

    handleValueChange(event) {
        const idx = Number(event.currentTarget.dataset.index);
        const val = event.detail?.value ?? event.target?.value ?? '';
        this.conditions = this.conditions.map((item, i) =>
            i === idx ? { ...item, value: val } : item
        );
        this._emitChange();
    }

    handleResourceValueChange(event) {
        event.stopPropagation();
        const id = event.detail?.id || event.detail?.name || '';
        // Extract index from name: "where_val_0" → 0
        const match = id.match(/where_val_(\d+)/);
        if (!match) return;
        const idx = Number(match[1]);
        const val = event.detail?.newValue ?? '';
        this.conditions = this.conditions.map((item, i) =>
            i === idx ? { ...item, value: val } : item
        );
        this._emitChange();
    }

    handleAddCondition() {
        this.conditions = [
            ...this.conditions,
            { id: `c${++_condSeq}`, field: '', operator: '=', value: '', _fieldType: '' }
        ];
    }

    handleRemoveCondition(event) {
        const idx = Number(event.currentTarget.dataset.index);
        this.conditions = this.conditions.filter((_, i) => i !== idx);
        if (!this.conditions.length) {
            this.conditions = [{ id: `c${++_condSeq}`, field: '', operator: '=', value: '', _fieldType: '' }];
        }
        this._emitChange();
    }

    _emitChange() {
        // Attach field types for serialization
        const withTypes = this.conditions.map((c) => ({
            ...c,
            _fieldType: this._resolveFieldType(c.field) || c._fieldType
        }));
        const soql = serializeConditions(withTypes, this.logicOperator);
        this._value = soql;
        this.dispatchEvent(new CustomEvent('change', { detail: { value: soql || null } }));
    }
}
