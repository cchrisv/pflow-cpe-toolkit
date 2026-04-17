import { api, LightningElement } from 'lwc';

/**
 * Hand-rolled wrapper CPE that uses the Toolkit's individual widgets directly
 * instead of delegating to Property Editor. Proves the "bring your own CPE"
 * path — drop widgets into your own HTML, wire events, dispatch
 * `configuration_editor_input_value_changed` for Flow Builder.
 */
const VALUE_CHANGED_EVENT = 'configuration_editor_input_value_changed';

export default class DemoWidgetsDirectCpe extends LightningElement {
    @api builderContext;
    @api automaticOutputVariables;
    @api elementInfo;
    @api genericTypeMappings;

    _sobjectApiName = 'Account';
    _sortField = '';
    _additionalFields = '';
    _whereClause = '';
    _orderByField = '';
    _orderByDirection = 'DESC';
    _queryLimit = '';

    @api
    get inputVariables() {
        return this._inputVariables;
    }
    set inputVariables(variables) {
        this._inputVariables = variables;
        if (Array.isArray(variables)) {
            variables.forEach((v) => {
                if (!v || !v.name) return;
                const raw = v.value == null ? '' : String(v.value);
                switch (v.name) {
                    case 'sobjectApiName':
                        this._sobjectApiName = raw || 'Account';
                        break;
                    case 'sortField':
                        this._sortField = raw;
                        break;
                    case 'additionalFields':
                        this._additionalFields = raw;
                        break;
                    case 'whereClause':
                        this._whereClause = raw;
                        break;
                    case 'orderByField':
                        this._orderByField = raw;
                        break;
                    case 'orderByDirection':
                        this._orderByDirection = raw || 'DESC';
                        break;
                    case 'queryLimit':
                        this._queryLimit = raw;
                        break;
                    default:
                }
            });
        }
    }

    _fire(name, newValue, newValueDataType) {
        this.dispatchEvent(
            new CustomEvent(VALUE_CHANGED_EVENT, {
                bubbles: true,
                composed: true,
                cancelable: false,
                detail: { name, newValue: newValue ?? null, newValueDataType }
            })
        );
    }

    handleSobjectChange(event) {
        this._sobjectApiName = event.target.value || '';
        // clear downstream selections when object changes
        this._sortField = '';
        this._additionalFields = '';
        this._whereClause = '';
        this._orderByField = '';
        this._queryLimit = '';
        this._fire('sobjectApiName', this._sobjectApiName, 'String');
        this._fire('sortField', null, 'String');
        this._fire('additionalFields', null, 'String');
        this._fire('whereClause', null, 'String');
        this._fire('orderByField', null, 'String');
        this._fire('queryLimit', null, 'Integer');
    }

    handleSortFieldChange(event) {
        const api = event.detail?.fieldApiName || '';
        this._sortField = api;
        this._fire('sortField', api || null, 'String');
    }

    handleAdditionalFieldsChange(event) {
        const csv = event.detail?.value ?? '';
        this._additionalFields = csv || '';
        this._fire('additionalFields', csv || null, 'String');
    }

    handleWhereChange(event) {
        const clause = event.detail?.whereClause ?? event.detail?.value ?? '';
        this._whereClause = clause || '';
        this._fire('whereClause', clause || null, 'String');
    }

    handleOrderChange(event) {
        const { orderByField, orderByDirection } = event.detail || {};
        this._orderByField = orderByField || '';
        this._orderByDirection = orderByDirection || 'DESC';
        this._fire('orderByField', this._orderByField || null, 'String');
        this._fire('orderByDirection', this._orderByDirection, 'String');
    }

    handleLimitChange(event) {
        const n = event.detail?.queryLimit;
        this._queryLimit = n == null ? '' : String(n);
        this._fire('queryLimit', n == null ? null : n, 'Integer');
    }
}
