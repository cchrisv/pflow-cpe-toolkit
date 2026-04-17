import { LightningElement, api } from 'lwc';

/*
 * Adapted from UnofficialSF FlowScreenComponentsBasePack fsc_flowCheckbox
 * (https://github.com/UnofficialSF/LightningFlowComponents), licensed under
 * the Apache License 2.0. See repo LICENSE and NOTICE for attribution.
 */

const CB_TRUE = 'CB_TRUE';
const CB_FALSE = 'CB_FALSE';

/**
 * Boolean toggle for Flow Custom Property Editors.
 *
 * Emits the legacy CB_TRUE / CB_FALSE string wire format that Flow Builder's
 * property-editor protocol expects when a CPE stores a boolean value.
 *
 * @slot none — this component renders only a lightning-input toggle and optional help text.
 * @fires checkboxchanged — `{ detail: { id, newValue, newValueDataType, newStringValue } }`
 */
export default class PflowAtomCheckbox extends LightningElement {
    /** @type {string} Display label for the toggle. */
    @api label;
    /** @type {string} Name sent back in the event detail.id. */
    @api name;
    /** @type {boolean|string} Current value — accepts true / 'true' / 'CB_TRUE' as truthy. */
    @api checked;
    /** @type {string} Help text rendered below the toggle. */
    @api fieldLevelHelp;
    /** @type {boolean} Disables the toggle. */
    @api disabled;

    /**
     * Computed truthy state — supports boolean, string 'true', and legacy CB_TRUE sentinel.
     * @returns {boolean}
     */
    @api
    get isChecked() {
        return (
            this.checked === true ||
            this.checked === 'true' ||
            this.checked === CB_TRUE
        );
    }

    cbClass = 'slds-p-top_xxx-small';

    handleCheckboxChange(event) {
        const isOn = event.target.checked;
        this.dispatchEvent(
            new CustomEvent('checkboxchanged', {
                detail: {
                    id: event.target.name,
                    newValue: isOn,
                    newValueDataType: 'Boolean',
                    newStringValue: isOn ? CB_TRUE : CB_FALSE
                }
            })
        );
    }
}
