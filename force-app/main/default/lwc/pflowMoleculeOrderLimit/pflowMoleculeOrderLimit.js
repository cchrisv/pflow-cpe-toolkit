import { LightningElement, api } from 'lwc';
import searchLookupDatasetFieldsForObject from '@salesforce/apex/PFlowCpeChoiceEngineController.searchLookupDatasetFieldsForObject';

const DIRECTION_OPTIONS = [
    { label: 'Descending', value: 'DESC' },
    { label: 'Ascending', value: 'ASC' }
];

export default class PflowMoleculeOrderLimit extends LightningElement {
    @api disabled = false;

    _objectApiName = '';
    _orderByField = '';
    _orderByDirection = 'DESC';
    _queryLimit = '';

    @api
    get objectApiName() { return this._objectApiName; }
    set objectApiName(v) {
        this._objectApiName = v == null ? '' : String(v).trim();
    }

    @api
    get orderByField() { return this._orderByField; }
    set orderByField(v) { this._orderByField = v == null ? '' : String(v); }

    @api
    get orderByDirection() { return this._orderByDirection; }
    set orderByDirection(v) { this._orderByDirection = v === 'ASC' ? 'ASC' : 'DESC'; }

    @api
    get queryLimit() { return this._queryLimit; }
    set queryLimit(v) { this._queryLimit = v == null || v === '' ? '' : String(v); }

    get directionOptions() { return DIRECTION_OPTIONS; }

    get orderByFieldSelection() {
        if (!this._orderByField) return null;
        return { id: this._orderByField, title: this._orderByField, subtitle: '', icon: 'utility:text' };
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
        const sel = lu.getSelection?.();
        const row = Array.isArray(sel) ? sel[0] : sel;
        this._orderByField = row?.id ? String(row.id) : '';
        this.dispatchEvent(new CustomEvent('orderchange', {
            detail: { orderByField: this._orderByField || null, orderByDirection: this._orderByDirection }
        }));
    }

    handleDirectionChange(event) {
        this._orderByDirection = event.detail.value;
        this.dispatchEvent(new CustomEvent('orderchange', {
            detail: { orderByField: this._orderByField || null, orderByDirection: this._orderByDirection }
        }));
    }

    handleLimitChange(event) {
        let raw = event.detail.value;
        if (raw === '' || raw == null) {
            this._queryLimit = '';
        } else {
            const n = Math.min(Math.max(parseInt(raw, 10) || 0, 0), 2000);
            this._queryLimit = n > 0 ? String(n) : '';
        }
        this.dispatchEvent(new CustomEvent('limitchange', {
            detail: { queryLimit: this._queryLimit ? Number(this._queryLimit) : null }
        }));
    }
}
