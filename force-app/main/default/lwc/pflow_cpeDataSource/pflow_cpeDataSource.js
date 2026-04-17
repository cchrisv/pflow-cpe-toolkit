import { LightningElement, api, track } from 'lwc';
import searchSObjectTypes from '@salesforce/apex/PFlowCpeChoiceEngineController.searchSObjectTypes';
import searchPicklistFieldsForObject from '@salesforce/apex/PFlowCpeChoiceEngineController.searchPicklistFieldsForObject';
import searchLookupDatasetFieldsForObject from '@salesforce/apex/PFlowCpeChoiceEngineController.searchLookupDatasetFieldsForObject';
import searchControllerPicklistValues from '@salesforce/apex/PFlowCpeChoiceEngineController.searchControllerPicklistValues';
import getControllerFieldApiName from '@salesforce/apex/PFlowCpeChoiceEngineController.getControllerFieldApiName';
import getRecordTypeOptions from '@salesforce/apex/PFlowCpeChoiceEngineController.getRecordTypeOptions';
import validateLookupConfigurationDetailed from '@salesforce/apex/PFlowCpeChoiceEngineController.validateLookupConfigurationDetailed';

const ALL_INPUT_MODES = [
    'Single String Collection',
    'Dual String Collections',
    'Picklist Field',
    'Visual Text Box',
    'SOQL Lookup',
    'SOSL Search'
];

const DISPLAY_MODE_OPTIONS = [
    { label: 'Picklist', value: 'Picklist' },
    { label: 'Radio', value: 'Radio' },
    { label: 'Visual', value: 'Visual' }
];

const ICON_SIZE_OPTIONS = [
    { label: 'x-small', value: 'x-small' },
    { label: 'small', value: 'small' },
    { label: 'medium', value: 'medium' },
    { label: 'large', value: 'large' }
];

const COLUMN_OPTIONS = [
    { label: '1', value: '1' },
    { label: '2', value: '2' }
];


export default class PflowCpeDataSource extends LightningElement {
    _controllerResolveSig = '';

    _lookupPrimeKey = '';

    _datasetLookupPrimeKey = '';

    _lastDependentToggle = false;

    /** @type {string} Resolved controlling field API name for the selected dependent field (Picklist Field mode). */
    @track _controllerFieldName = '';

    /** @type {object[]} Rows from {@link getRecordTypeOptions} for the record type combobox. */
    @track _recordTypeRows = [];

    /** Last object API name we requested record types for (trimmed). */
    _recordTypesFetchedFor = '';

    /** @type {object|null} */
    @track _datasetValidationResult = null;

    @track _datasetValidationBusy = false;

    _datasetValidationClearedForKey = '';

    @api builderContext;
    @api automaticOutputVariables;
    /** @type {Record<string, unknown>} */
    @api inputValues = {};
    @api inputVariables;

    /** @type {string[]} */
    @api allowedInputModes = ALL_INPUT_MODES;
    @api showDisplayMode = false;
    @api showVisualCardOptions = false;

    @api pickerMaxWidth = 280;

    get inputModeOptions() {
        const allow = Array.isArray(this.allowedInputModes) && this.allowedInputModes.length
            ? this.allowedInputModes
            : ALL_INPUT_MODES;
        return allow.map((value) => ({ label: value, value }));
    }

    get displayModeOptions() {
        return DISPLAY_MODE_OPTIONS;
    }

    get iconSizeOptions() {
        return ICON_SIZE_OPTIONS;
    }

    get columnOptions() {
        return COLUMN_OPTIONS;
    }

    get showInputModePicker() {
        return this.inputModeOptions.length > 1;
    }

    get inputMode() {
        const raw = this.val('inputMode');
        const s = raw == null ? '' : String(raw);
        const opts = this.inputModeOptions.map((o) => o.value);
        if (s && opts.includes(s)) {
            return s;
        }
        return opts[0] || 'Single String Collection';
    }

    get displayMode() {
        const raw = this.val('displayMode');
        const s = raw == null ? '' : String(raw);
        if (s === 'Card') return 'Visual';
        return s || 'Picklist';
    }

    get isSingleCollection() {
        return this.inputMode === 'Single String Collection';
    }

    get isDualCollection() {
        return this.inputMode === 'Dual String Collections';
    }

    get isPicklistField() {
        return this.inputMode === 'Picklist Field';
    }

    get isVisualTextBox() {
        return this.inputMode === 'Visual Text Box';
    }

    get isDatasetSoqlOrSosl() {
        return this.inputMode === 'SOQL Lookup' || this.inputMode === 'SOSL Search';
    }

    get isDatasetSoql() {
        return this.inputMode === 'SOQL Lookup';
    }

    // ── WHERE clause toggle ──────────────────────────────────────

    @track _whereBuilderMode = 'visual';

    get isWhereVisualMode() {
        return this._whereBuilderMode === 'visual';
    }

    get isWhereRawMode() {
        return this._whereBuilderMode === 'raw';
    }

    get whereVisualVariant() {
        return this._whereBuilderMode === 'visual' ? 'brand' : 'neutral';
    }

    get whereRawVariant() {
        return this._whereBuilderMode === 'raw' ? 'brand' : 'neutral';
    }

    get showVisualFields() {
        return this.isVisualTextBox && this.showVisualCardOptions;
    }

    val(name) {
        if (!this.inputValues || typeof this.inputValues !== 'object') {
            return undefined;
        }
        return this.inputValues[name];
    }

    str(name, fallback = '') {
        const v = this.val(name);
        if (v == null) return fallback;
        return String(v);
    }

    bool(name) {
        const v = this.val(name);
        return v === true || v === 'true' || v === 'CB_TRUE';
    }

    /** Trimmed Object API name for Picklist Field mode (Flow may store stray spaces; describe is exact). */
    objectNameTrimmed() {
        return this.str('objectName').trim();
    }

    get objectNameTrimmedVal() {
        return this.objectNameTrimmed();
    }

    get dispChoiceValues() {
        return this.str('choiceValues');
    }

    get dispChoiceLabels() {
        return this.str('choiceLabels');
    }

    get dispObjectName() {
        return this.str('objectName');
    }

    get dispFieldName() {
        return this.str('fieldName');
    }

    get dispRecordTypeId() {
        return this.str('recordTypeId');
    }

    get dispControllingValuePicklist() {
        return this.str('controllingValuePicklist');
    }

    get dispControllingValueCheckbox() {
        return this.str('controllingValueCheckbox');
    }

    get dispIconSize() {
        return this.str('iconSize', 'medium');
    }

    get dispNumberOfColumns() {
        return this.str('numberOfColumns', '1');
    }

    get dispChoiceIcons() {
        return this.str('choiceIcons');
    }

    get toggledDependent() {
        return this.bool('isDependentPicklist');
    }

    get toggledAllowNone() {
        return this.bool('allowNone');
    }

    get toggledSortList() {
        return this.bool('sortList');
    }

    get toggledIncludeIcons() {
        return this.bool('includeIcons');
    }

    get toggledMakeResponsive() {
        return this.bool('makeResponsive');
    }

    get toggledUseRichText() {
        return this.bool('useRichText');
    }

    get fieldLookupDisabled() {
        return !this.objectNameTrimmed();
    }

    get controllingPicklistLookupDisabled() {
        if (!this.toggledDependent) {
            return true;
        }
        if (!this.objectNameTrimmed() || !this.str('fieldName').trim()) {
            return true;
        }
        return !this._controllerFieldName;
    }

    get recordTypeComboboxDisabled() {
        return !this.objectNameTrimmed();
    }

    get recordTypeComboboxOptions() {
        const opts = [{ label: '— None (runtime default) —', value: '' }];
        const rows = this._recordTypeRows;
        if (!Array.isArray(rows) || rows.length === 0) {
            return opts;
        }
        for (let i = 0; i < rows.length; i += 1) {
            const r = rows[i];
            const id = r.value != null ? String(r.value) : r.id != null ? String(r.id) : '';
            if (!id) {
                continue;
            }
            const title =
                r.label != null && String(r.label) !== ''
                    ? String(r.label)
                    : r.title != null && String(r.title) !== ''
                      ? String(r.title)
                      : id;
            opts.push({ label: title, value: id });
        }
        return opts;
    }

    get recordTypeComboboxValue() {
        const v = this.str('recordTypeId').trim();
        if (!v) {
            return '';
        }
        const rows = this._recordTypeRows;
        if (!Array.isArray(rows)) {
            return '';
        }
        for (let i = 0; i < rows.length; i += 1) {
            const r = rows[i];
            const rid = r.value != null ? String(r.value) : r.id != null ? String(r.id) : '';
            if (rid && rid === v) {
                return v;
            }
        }
        return '';
    }

    get controllingPicklistLookupHelp() {
        if (!this.toggledDependent) {
            return '';
        }
        if (!this.objectNameTrimmed() || !this.str('fieldName').trim()) {
            return 'Select an object and dependent picklist field first.';
        }
        if (!this._controllerFieldName) {
            return 'This field has no controlling picklist in metadata (not a dependent picklist). Use the override field for a literal or merge field.';
        }
        return `Search values for controlling field “${this._controllerFieldName}”. Use the override row for {!...} references.`;
    }

    get objectLookupSelection() {
        const v = this.objectNameTrimmed();
        if (!v) {
            return null;
        }
        return {
            id: v,
            title: v,
            subtitle: '',
            icon: 'utility:sobject',
            sObjectType: v
        };
    }

    get fieldLookupSelection() {
        const v = this.str('fieldName').trim();
        if (!v) {
            return null;
        }
        return {
            id: v,
            title: v,
            subtitle: '',
            icon: 'utility:picklist',
            sObjectType: this.objectNameTrimmed()
        };
    }

    get controllingPicklistLookupSelection() {
        const v = this.str('controllingValuePicklist');
        if (!v) {
            return null;
        }
        return {
            id: v,
            title: v,
            subtitle: '',
            icon: 'utility:picklist',
            sObjectType: ''
        };
    }

    renderedCallback() {
        if (this.isPicklistField) {
            const o = this.objectNameTrimmed();
            const f = this.str('fieldName').trim();
            const ctrlSig = `${o}|${f}`;
            if (ctrlSig !== this._controllerResolveSig) {
                this._controllerResolveSig = ctrlSig;
                this._refreshControllerFieldName(o, f);
            }
            if (o !== this._recordTypesFetchedFor) {
                this._recordTypesFetchedFor = o;
                if (!o) {
                    this._recordTypeRows = [];
                } else {
                    getRecordTypeOptions({ objectApiName: o })
                        .then((rows) => {
                            if (this.objectNameTrimmed() !== o) {
                                return;
                            }
                            this._recordTypeRows = Array.isArray(rows) ? rows : [];
                        })
                        .catch(() => {
                            if (this.objectNameTrimmed() === o) {
                                this._recordTypeRows = [];
                            }
                        });
                }
            }
            const primeKey = `${this.inputMode}|${o}`;
            if (primeKey !== this._lookupPrimeKey) {
                this._lookupPrimeKey = primeKey;
                this._primeObjectAndFieldLookups(o);
            }
            const depOn = this.toggledDependent;
            if (depOn !== this._lastDependentToggle) {
                this._lastDependentToggle = depOn;
                if (depOn && o && f && this._controllerFieldName) {
                    this._primeControllingPicklistDefaults(o, f, this._controllerFieldName);
                }
            }
        } else {
            this._controllerResolveSig = '';
            this._controllerFieldName = '';
            this._lastDependentToggle = false;
            this._recordTypeRows = [];
            this._recordTypesFetchedFor = '';
            this._lookupPrimeKey = '';
        }

        if (this.isDatasetSoqlOrSosl) {
            const configKey = [
                this.datasetObjectApiNameTrimmed(),
                this.datasetDisplayFieldResolvedRaw(),
                this.datasetValueFieldResolvedRaw(),
                this.str('subtitleFieldName'),
                this.str('additionalFields'),
                this.str('whereClause'),
                this.str('filterFieldName'),
                this.str('filterFieldValue')
            ].join('\u0001');
            if (configKey !== this._datasetValidationClearedForKey) {
                this._datasetValidationClearedForKey = configKey;
                this._datasetValidationResult = null;
            }
            const doApi = this.datasetObjectApiNameTrimmed();
            if (doApi !== this._datasetLookupPrimeKey) {
                this._datasetLookupPrimeKey = doApi;
                this._primeDatasetLookups(doApi);
            }
        } else {
            this._datasetLookupPrimeKey = '';
        }
    }

    _refreshControllerFieldName(objectApi, fieldApi) {
        if (!objectApi || !fieldApi) {
            this._controllerFieldName = '';
            this._primeControllingPicklistDefaults(objectApi, fieldApi, '');
            return;
        }
        getControllerFieldApiName({
            objectApiName: objectApi,
            dependentFieldApiName: fieldApi
        })
            .then((name) => {
                const ctrl = name || '';
                this._controllerFieldName = ctrl;
                if (this.toggledDependent) {
                    this._primeControllingPicklistDefaults(objectApi, fieldApi, ctrl);
                }
            })
            .catch(() => {
                this._controllerFieldName = '';
                this._primeControllingPicklistDefaults(objectApi, fieldApi, '');
            });
    }

    _primeObjectAndFieldLookups(objectApi) {
        searchSObjectTypes({ searchKey: '' })
            .then((rows) => {
                const lu = this.refs.objectLookup;
                if (lu?.setDefaultResults) {
                    lu.setDefaultResults(rows || []);
                }
            })
            .catch(() => {});
        if (objectApi) {
            searchPicklistFieldsForObject({ objectApiName: objectApi, searchKey: '' })
                .then((rows) => {
                    const lu = this.refs.fieldLookup;
                    if (lu?.setDefaultResults) {
                        lu.setDefaultResults(rows || []);
                    }
                })
                .catch(() => {});
        } else {
            const flu = this.refs.fieldLookup;
            if (flu?.setDefaultResults) {
                flu.setDefaultResults([]);
            }
        }
    }

    _primeControllingPicklistDefaults(objectApi, fieldApi, controllerFieldName) {
        if (!this.toggledDependent || !objectApi || !fieldApi || !controllerFieldName) {
            const c = this.refs.controllingPicklistLookup;
            if (c?.setDefaultResults) {
                c.setDefaultResults([]);
            }
            return;
        }
        searchControllerPicklistValues({
            objectApiName: objectApi,
            dependentFieldApiName: fieldApi,
            searchKey: ''
        })
            .then((rows) => {
                const lu = this.refs.controllingPicklistLookup;
                if (lu?.setDefaultResults) {
                    lu.setDefaultResults(rows || []);
                }
            })
            .catch(() => {});
    }

    handleObjectLookupSearch(event) {
        const lookup = event.currentTarget;
        const term = event.detail.rawSearchTerm != null ? String(event.detail.rawSearchTerm) : '';
        searchSObjectTypes({ searchKey: term })
            .then((rows) => lookup.setSearchResults(rows || []))
            .catch(() => lookup.setSearchResults([]));
    }

    handleFieldLookupSearch(event) {
        const lookup = event.currentTarget;
        const o = this.objectNameTrimmed();
        if (!o) {
            lookup.setSearchResults([]);
            return;
        }
        const term = event.detail.rawSearchTerm != null ? String(event.detail.rawSearchTerm) : '';
        searchPicklistFieldsForObject({ objectApiName: o, searchKey: term })
            .then((rows) => lookup.setSearchResults(rows || []))
            .catch(() => lookup.setSearchResults([]));
    }

    handleControllingPicklistLookupSearch(event) {
        const lookup = event.currentTarget;
        const o = this.objectNameTrimmed();
        const f = this.str('fieldName').trim();
        if (!o || !f || !this._controllerFieldName) {
            lookup.setSearchResults([]);
            return;
        }
        const term = event.detail.rawSearchTerm != null ? String(event.detail.rawSearchTerm) : '';
        searchControllerPicklistValues({
            objectApiName: o,
            dependentFieldApiName: f,
            searchKey: term
        })
            .then((rows) => lookup.setSearchResults(rows || []))
            .catch(() => lookup.setSearchResults([]));
    }

    /** @param {CustomEvent} event */
    handleObjectLookupSelectionChange(event) {
        const lu = event.currentTarget;
        const sel = lu.getSelection?.();
        const row = Array.isArray(sel) ? sel[0] : sel;
        const raw = row && row.id ? String(row.id) : '';
        const api = raw.trim();
        const prev = this.objectNameTrimmed();
        this.dispatchChange('objectName', api || null, 'String');
        if (api !== prev) {
            this.dispatchChange('fieldName', null, 'String');
            this.dispatchChange('controllingValuePicklist', null, 'String');
            this.dispatchChange('recordTypeId', null, 'String');
        }
    }

    /** @param {CustomEvent} event */
    handleFieldLookupSelectionChange(event) {
        const lu = event.currentTarget;
        const sel = lu.getSelection?.();
        const row = Array.isArray(sel) ? sel[0] : sel;
        const name = row && row.id ? String(row.id).trim() : '';
        const prev = this.str('fieldName').trim();
        this.dispatchChange('fieldName', name || null, 'String');
        if (name !== prev) {
            this.dispatchChange('controllingValuePicklist', null, 'String');
        }
    }

    handlePicklistFieldPickerChange(event) {
        const name = event.detail?.fieldApiName || '';
        const prev = this.str('fieldName').trim();
        this.dispatchChange('fieldName', name || null, 'String');
        if (name !== prev) {
            this.dispatchChange('controllingValuePicklist', null, 'String');
        }
    }

    /** @param {CustomEvent} event */
    handleControllingPicklistLookupSelectionChange(event) {
        const lu = event.currentTarget;
        const sel = lu.getSelection?.();
        const row = Array.isArray(sel) ? sel[0] : sel;
        const v = row && row.id != null ? String(row.id) : '';
        this.dispatchChange('controllingValuePicklist', v || null, 'String');
    }

    // --- SOQL / SOSL dataset (objectApiName + field pickers; for SOQL/SOSL lookup dataset configuration) ---

    datasetObjectApiNameTrimmed() {
        const s = this.str('objectApiName').trim();
        if (s) {
            return s;
        }
        return this._lookupId('datasetObjectLookup');
    }

    get dispDatasetAdditionalFields() {
        return this.str('additionalFields');
    }

    get datasetObjectApiNameTrimmedVal() {
        return this.datasetObjectApiNameTrimmed();
    }

    get dispDatasetDisplayFieldName() {
        return this.str('displayFieldName').trim();
    }

    get dispDatasetSubtitleFieldName() {
        return this.str('subtitleFieldName').trim();
    }

    get dispDatasetValueFieldName() {
        return this.str('valueFieldName').trim();
    }

    get dispWhereClause() {
        return this.str('whereClause');
    }

    get dispFilterFieldName() {
        return this.str('filterFieldName').trim();
    }

    get dispFilterFieldValue() {
        return this.str('filterFieldValue');
    }

    get generatedSoqlPreview() {
        const obj = this.datasetObjectApiNameTrimmed() || '___';
        const display = this.str('displayFieldName').trim() || '___';
        const value = this.str('valueFieldName').trim() || 'Id';
        const subtitle = this.str('subtitleFieldName').trim();
        const additional = this.str('additionalFields').trim();
        const where = this.str('whereClause').trim();
        const orderBy = this.str('orderByField').trim();
        const direction = this.str('orderByDirection').trim() || 'DESC';
        const limit = this.val('queryLimit');

        const fields = new Set();
        fields.add(value);
        fields.add(display);
        if (subtitle) fields.add(subtitle);
        if (additional) {
            additional.split(',').map((f) => f.trim()).filter(Boolean).forEach((f) => fields.add(f));
        }

        let soql = `SELECT ${[...fields].join(', ')}\nFROM ${obj}`;
        if (where) {
            soql += `\nWHERE ${where}`;
        }
        if (orderBy) {
            soql += `\nORDER BY ${orderBy} ${direction}`;
        }
        if (limit != null && limit !== '' && Number(limit) > 0) {
            soql += `\nLIMIT ${limit}`;
        }
        return soql;
    }

    get dispOrderByField() {
        return this.str('orderByField');
    }

    get dispOrderByDirection() {
        return this.str('orderByDirection', 'DESC');
    }

    get dispQueryLimit() {
        const v = this.val('queryLimit');
        return v == null || v === '' ? '' : String(v);
    }

    get datasetObjectLookupSelection() {
        const v = this.datasetObjectApiNameTrimmed();
        if (!v) {
            return null;
        }
        return {
            id: v,
            title: v,
            subtitle: '',
            icon: 'utility:sobject',
            sObjectType: v
        };
    }

    get datasetDisplayFieldLookupSelection() {
        const v = this.str('displayFieldName').trim() || this._lookupId('datasetDisplayFieldLookup');
        if (!v) {
            return null;
        }
        return {
            id: v,
            title: v,
            subtitle: '',
            icon: 'utility:text',
            sObjectType: this.datasetObjectApiNameTrimmed()
        };
    }

    get datasetSubtitleFieldLookupSelection() {
        const v = this.str('subtitleFieldName').trim() || this._lookupId('datasetSubtitleFieldLookup');
        if (!v) {
            return null;
        }
        return {
            id: v,
            title: v,
            subtitle: '',
            icon: 'utility:text',
            sObjectType: this.datasetObjectApiNameTrimmed()
        };
    }

    get datasetValueFieldLookupSelection() {
        const v = this.str('valueFieldName').trim() || this._lookupId('datasetValueFieldLookup');
        if (!v) {
            return null;
        }
        return {
            id: v,
            title: v,
            subtitle: '',
            icon: 'utility:text',
            sObjectType: this.datasetObjectApiNameTrimmed()
        };
    }

    get datasetAdditionalFieldsSelection() {
        const csv = this.str('additionalFields').trim();
        if (!csv) {
            return [];
        }
        const obj = this.datasetObjectApiNameTrimmed();
        return csv.split(',').map((f) => f.trim()).filter(Boolean).map((f) => ({
            id: f,
            title: f,
            subtitle: '',
            icon: 'utility:text',
            sObjectType: obj
        }));
    }

    get datasetFieldLookupDisabled() {
        return !this.datasetObjectApiNameTrimmed();
    }

    datasetDisplayFieldResolvedRaw() {
        return this.str('displayFieldName').trim() || this._lookupId('datasetDisplayFieldLookup');
    }

    datasetValueFieldResolvedRaw() {
        return this.str('valueFieldName').trim() || this._lookupId('datasetValueFieldLookup');
    }

    get datasetValidateButtonDisabled() {
        return (
            this._datasetValidationBusy ||
            !this.datasetObjectApiNameTrimmed() ||
            !this.datasetDisplayFieldResolvedRaw() ||
            !this.datasetValueFieldResolvedRaw()
        );
    }

    get datasetValidationSummary() {
        const r = this._datasetValidationResult;
        if (!r) {
            return '';
        }
        if (!r.isConfigurationValid) {
            return r.configurationMessage || 'Configuration is not valid.';
        }
        const parts = ['Configuration is valid.'];
        if (r.hasMatchingRows === false) {
            parts.push(r.dataAvailabilityMessage || 'No rows match the current filters for your user.');
        }
        if (r.displayFieldSupportsSearch === false && r.searchSupportMessage) {
            parts.push(r.searchSupportMessage);
        }
        return parts.join(' ');
    }

    get datasetValidationVariant() {
        const r = this._datasetValidationResult;
        if (!r) {
            return 'default';
        }
        if (!r.isConfigurationValid) {
            return 'error';
        }
        if (r.hasMatchingRows === false) {
            return 'warning';
        }
        if (r.displayFieldSupportsSearch === false) {
            return 'warning';
        }
        return 'success';
    }

    get datasetValidationSummaryClass() {
        switch (this.datasetValidationVariant) {
            case 'error':
                return 'slds-m-top_x-small slds-text-body_small slds-text-color_error';
            case 'warning':
                return 'slds-m-top_x-small slds-text-body_small slds-text-color_default';
            case 'success':
                return 'slds-m-top_x-small slds-text-body_small slds-text-color_success';
            default:
                return 'slds-m-top_x-small slds-text-body_small';
        }
    }

    buildDatasetValidationRequest() {
        const t = (name, refName) => {
            let z = this.str(name).trim();
            if (!z && refName) {
                z = this._lookupId(refName);
            }
            return z === '' ? null : z;
        };
        return {
            sObjectName: t('objectApiName', 'datasetObjectLookup'),
            displayedFieldName: t('displayFieldName', 'datasetDisplayFieldLookup'),
            subtitleFieldName: t('subtitleFieldName', 'datasetSubtitleFieldLookup'),
            valueFieldName: t('valueFieldName', 'datasetValueFieldLookup'),
            otherFields: t('additionalFields'),
            whereClause: t('whereClause'),
            filteredFieldName: t('filterFieldName'),
            filterFieldValue: t('filterFieldValue'),
            searchTerm: null
        };
    }

    handleDatasetValidate() {
        if (this.datasetValidateButtonDisabled) {
            return;
        }
        this._datasetValidationBusy = true;
        const b = this.buildDatasetValidationRequest();
        validateLookupConfigurationDetailed({
            sObjectName: b.sObjectName,
            displayedFieldName: b.displayedFieldName,
            subtitleFieldName: b.subtitleFieldName,
            valueFieldName: b.valueFieldName,
            otherFields: b.otherFields,
            whereClause: b.whereClause,
            filteredFieldName: b.filteredFieldName,
            filterFieldValue: b.filterFieldValue
        })
            .then((r) => {
                this._datasetValidationResult = r;
            })
            .catch(() => {
                this._datasetValidationResult = {
                    isConfigurationValid: false,
                    configurationMessage: 'Validation request failed.',
                    hasMatchingRows: false,
                    dataAvailabilityMessage: null,
                    displayFieldSupportsSearch: true,
                    searchSupportMessage: null
                };
            })
            .finally(() => {
                this._datasetValidationBusy = false;
            });
    }

    handleDatasetObjectLookupSearch(event) {
        const lookup = event.currentTarget;
        const term = event.detail.rawSearchTerm != null ? String(event.detail.rawSearchTerm) : '';
        searchSObjectTypes({ searchKey: term })
            .then((rows) => lookup.setSearchResults(rows || []))
            .catch(() => lookup.setSearchResults([]));
    }

    handleDatasetFieldSearch(event) {
        const lookup = event.currentTarget;
        const o = this.datasetObjectApiNameTrimmed();
        if (!o) {
            lookup.setSearchResults([]);
            return;
        }
        const term = event.detail.rawSearchTerm != null ? String(event.detail.rawSearchTerm) : '';
        searchLookupDatasetFieldsForObject({ objectApiName: o, searchKey: term })
            .then((rows) => lookup.setSearchResults(rows || []))
            .catch(() => lookup.setSearchResults([]));
    }

    handleDatasetObjectLookupSelectionChange(event) {
        const lu = event.currentTarget;
        const sel = lu.getSelection?.();
        const row = Array.isArray(sel) ? sel[0] : sel;
        const raw =
            row && row.id != null && String(row.id)
                ? String(row.id)
                : row && row.value != null
                  ? String(row.value)
                  : '';
        const api = raw.trim();
        const prevSaved = this.str('objectApiName').trim();
        this.dispatchChange('objectApiName', api || null, 'String');
        if (api !== prevSaved) {
            this.dispatchChange('displayFieldName', null, 'String');
            this.dispatchChange('subtitleFieldName', null, 'String');
            this.dispatchChange('valueFieldName', null, 'String');
            this.dispatchChange('additionalFields', null, 'String');
        }
    }

    handleDatasetDisplayFieldSelectionChange(event) {
        this._dispatchDatasetFieldFromLookup(event, 'displayFieldName');
    }

    handleDatasetSubtitleFieldSelectionChange(event) {
        this._dispatchDatasetFieldFromLookup(event, 'subtitleFieldName');
    }

    handleDatasetValueFieldSelectionChange(event) {
        this._dispatchDatasetFieldFromLookup(event, 'valueFieldName');
    }

    /** @param {CustomEvent} event @param {string} propName */
    _dispatchDatasetFieldFromLookup(event, propName) {
        const lu = event.currentTarget;
        const sel = lu.getSelection?.();
        const row = Array.isArray(sel) ? sel[0] : sel;
        const rawId = row && row.id != null && String(row.id).trim() ? String(row.id).trim() : '';
        const rawVal = row && row.value != null && String(row.value).trim() ? String(row.value).trim() : '';
        const name = rawId || rawVal;
        this.dispatchChange(propName, name || null, 'String');
    }

    handleDatasetAdditionalFieldsChange(event) {
        const v = event.detail?.value ?? event.target?.value;
        this.dispatchChange('additionalFields', v === '' || v == null ? null : String(v), 'String');
    }

    handleDatasetAdditionalFieldsSelectionChange(event) {
        const lu = event.currentTarget;
        const sel = lu.getSelection?.();
        const rows = Array.isArray(sel) ? sel : (sel ? [sel] : []);
        const csv = rows.map((r) => r.id || r.value || '').filter(Boolean).join(',');
        this.dispatchChange('additionalFields', csv || null, 'String');
    }

    // ── Enhanced field picker handlers ────────────────────────────

    handleEnhancedDisplayFieldChange(event) {
        const name = event.detail?.fieldApiName || '';
        this.dispatchChange('displayFieldName', name || null, 'String');
    }

    handleEnhancedSubtitleFieldChange(event) {
        const name = event.detail?.fieldApiName || '';
        this.dispatchChange('subtitleFieldName', name || null, 'String');
    }

    handleEnhancedValueFieldChange(event) {
        const name = event.detail?.fieldApiName || '';
        this.dispatchChange('valueFieldName', name || null, 'String');
    }

    // ── WHERE clause handlers ────────────────────────────────────

    handleWhereToggleVisual() {
        this._whereBuilderMode = 'visual';
    }

    handleWhereToggleRaw() {
        this._whereBuilderMode = 'raw';
    }

    handleWhereClauseChange(event) {
        const v = event.detail?.value ?? event.target?.value;
        this.dispatchChange('whereClause', v === '' || v == null ? null : String(v), 'String');
    }

    // ── Runtime filter handlers ────────────────────────────────

    handleFilterFieldChange(event) {
        const name = event.detail?.fieldApiName || '';
        this.dispatchChange('filterFieldName', name || null, 'String');
    }

    handleFilterValueChange(event) {
        const v = event.detail?.value ?? event.target?.value ?? '';
        this.dispatchChange('filterFieldValue', v === '' ? null : String(v), 'String');
    }

    // ── ORDER BY + LIMIT handlers ────────────────────────────────

    handleOrderChange(event) {
        const d = event.detail || {};
        this.dispatchChange('orderByField', d.orderByField || null, 'String');
        this.dispatchChange('orderByDirection', d.orderByDirection || 'DESC', 'String');
    }

    handleLimitChange(event) {
        const d = event.detail || {};
        this.dispatchChange('queryLimit', d.queryLimit != null ? String(d.queryLimit) : null, 'String');
    }

    /** @param {string} objectApi */
    _primeDatasetLookups(objectApi) {
        searchSObjectTypes({ searchKey: '' })
            .then((rows) => {
                const lu = this.refs.datasetObjectLookup;
                if (lu?.setDefaultResults) {
                    lu.setDefaultResults(rows || []);
                }
            })
            .catch(() => {});
        if (!objectApi) {
            ['datasetDisplayFieldLookup', 'datasetSubtitleFieldLookup', 'datasetValueFieldLookup', 'datasetAdditionalFieldsLookup'].forEach((ref) => {
                const lu = this.refs[ref];
                if (lu?.setDefaultResults) {
                    lu.setDefaultResults([]);
                }
            });
            return;
        }
        searchLookupDatasetFieldsForObject({ objectApiName: objectApi, searchKey: '' })
            .then((rows) => {
                if (this.datasetObjectApiNameTrimmed() !== objectApi) {
                    return;
                }
                const list = rows || [];
                ['datasetDisplayFieldLookup', 'datasetSubtitleFieldLookup', 'datasetValueFieldLookup', 'datasetAdditionalFieldsLookup'].forEach((ref) => {
                    const lu = this.refs[ref];
                    if (lu?.setDefaultResults) {
                        lu.setDefaultResults(list);
                    }
                });
            })
            .catch(() => {
                if (this.datasetObjectApiNameTrimmed() === objectApi) {
                    ['datasetDisplayFieldLookup', 'datasetSubtitleFieldLookup', 'datasetValueFieldLookup', 'datasetAdditionalFieldsLookup'].forEach(
                        (ref) => {
                            const lu = this.refs[ref];
                            if (lu?.setDefaultResults) {
                                lu.setDefaultResults([]);
                            }
                        }
                    );
                }
            });
    }

    get pickerTypeChoiceValues() {
        return this.getPickerValueType('choiceValues');
    }

    get pickerTypeChoiceLabels() {
        return this.getPickerValueType('choiceLabels');
    }

    get pickerTypeControllingCheckbox() {
        return this.getPickerValueType('controllingValueCheckbox');
    }

    get pickerTypeChoiceIcons() {
        return this.getPickerValueType('choiceIcons');
    }

    getPickerValueType(propName) {
        const row = (this.inputVariables || []).find((i) => i && i.name === propName);
        return row && row.valueDataType ? row.valueDataType : 'String';
    }

    dispatchChange(propertyName, newValue, newValueDataType) {
        this.dispatchEvent(
            new CustomEvent('datasourcechange', {
                bubbles: true,
                composed: true,
                detail: { propertyName, newValue, newValueDataType }
            })
        );
    }

    handleInputModeChange(event) {
        this.dispatchChange('inputMode', event.detail.value, 'String');
    }

    handleDisplayModeChange(event) {
        this.dispatchChange('displayMode', event.detail.value, 'String');
    }

    handleRecordTypeComboboxChange(event) {
        const v = event.detail.value;
        this.dispatchChange('recordTypeId', v === '' || v == null ? null : String(v), 'String');
    }

    handleResourceChange(event) {
        event.stopPropagation();
        const { id, newValue, newValueDataType } = event.detail;
        if (!id) return;
        this.dispatchChange(id, newValue, newValueDataType || 'String');
    }

    handleTextChange(event) {
        const name = event.target.dataset.name;
        if (!name) return;
        this.dispatchChange(name, event.target.value, 'String');
    }

    handleIntegerChange(event) {
        const name = event.target.dataset.name;
        if (!name) return;
        const raw = event.target.value;
        if (raw === '' || raw == null) {
            this.dispatchChange(name, null, 'Integer');
            return;
        }
        const n = parseInt(raw, 10);
        this.dispatchChange(name, Number.isNaN(n) ? null : n, 'Integer');
    }

    handleBooleanChange(event) {
        const name = event.target.dataset.name;
        if (!name) return;
        this.dispatchChange(name, event.target.checked, 'Boolean');
    }

    handleComboboxChange(event) {
        const name = event.target.dataset.name;
        if (!name) return;
        this.dispatchChange(name, event.detail.value, 'String');
    }

    /** @param {string} refName */
    _lookupId(refName) {
        const lu = this.refs?.[refName];
        if (!lu || typeof lu.getSelection !== 'function') {
            return '';
        }
        const sel = lu.getSelection();
        const row = Array.isArray(sel) ? sel[0] : sel;
        if (!row) {
            return '';
        }
        if (row.id != null && String(row.id).trim()) {
            return String(row.id).trim();
        }
        if (row.value != null && String(row.value).trim()) {
            return String(row.value).trim();
        }
        return '';
    }

    @api
    validate() {
        const errors = [];
        this.template.querySelectorAll('c-pflow-cpe-resource-picker').forEach((picker) => {
            if (typeof picker.reportValidity === 'function' && !picker.reportValidity()) {
                errors.push({
                    key: 'mergeField',
                    errorString: 'Fix invalid merge field references in the data source before saving.'
                });
            }
        });
        const nonEmpty = (propName) => {
            const v = this.val(propName);
            if (v == null) {
                return false;
            }
            return String(v).trim() !== '';
        };
        const mode = this.inputMode;
        if (mode === 'Single String Collection') {
            if (!nonEmpty('choiceValues')) {
                errors.push({
                    key: 'choiceValues',
                    errorString: 'Choice Values collection is required.'
                });
            }
        } else if (mode === 'Dual String Collections') {
            if (!nonEmpty('choiceLabels')) {
                errors.push({
                    key: 'choiceLabels',
                    errorString: 'Choice Labels collection is required.'
                });
            }
            if (!nonEmpty('choiceValues')) {
                errors.push({
                    key: 'choiceValues',
                    errorString: 'Choice Values collection is required.'
                });
            }
        } else if (mode === 'Picklist Field') {
            const o = this.objectNameTrimmed() || this._lookupId('objectLookup');
            if (!o) {
                errors.push({
                    key: 'objectName',
                    errorString: 'Object API Name is required for picklist field mode.'
                });
            }
            const f = this.str('fieldName').trim() || this._lookupId('fieldLookup');
            if (!f) {
                errors.push({
                    key: 'fieldName',
                    errorString: 'Picklist field is required for picklist field mode.'
                });
            }
            if (this.toggledDependent) {
                const cvText = this.str('controllingValuePicklist').trim();
                const cvLookup = this._lookupId('controllingPicklistLookup');
                const cvCb = this.str('controllingValueCheckbox').trim();
                if (!cvText && !cvLookup && !cvCb) {
                    errors.push({
                        key: 'controlling',
                        errorString:
                            'Dependent picklist requires a controlling value (search selection, override text, or checkbox value).'
                    });
                }
            }
        } else if (mode === 'Visual Text Box') {
            if (!nonEmpty('choiceLabels')) {
                errors.push({
                    key: 'choiceLabels',
                    errorString: 'Choice Titles collection is required for visual text box mode.'
                });
            }
            if (!nonEmpty('choiceValues')) {
                errors.push({
                    key: 'choiceValues',
                    errorString: 'Choice Descriptions collection is required for visual text box mode.'
                });
            }
        } else if (mode === 'SOQL Lookup' || mode === 'SOSL Search') {
            const o = this.datasetObjectApiNameTrimmed();
            if (!o) {
                errors.push({
                    key: 'objectApiName',
                    errorString: 'Object API Name is required for SOQL / SOSL data source mode.'
                });
            }
            if (!this.datasetDisplayFieldResolvedRaw()) {
                errors.push({
                    key: 'displayFieldName',
                    errorString: 'Display Field is required for SOQL / SOSL data source mode.'
                });
            }
            if (!this.datasetValueFieldResolvedRaw()) {
                errors.push({
                    key: 'valueFieldName',
                    errorString: 'Value Field is required for SOQL / SOSL data source mode.'
                });
            }
        }
        return errors;
    }
}
