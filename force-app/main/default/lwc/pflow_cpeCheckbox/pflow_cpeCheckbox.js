import { LightningElement, api } from 'lwc';

const CB_TRUE = 'CB_TRUE';
const CB_FALSE = 'CB_FALSE';

/**
 * Boolean toggle for Flow Custom Property Editors (CB_TRUE/CB_FALSE string wire format).
 * Adapted from UnofficialSF fsc_flowCheckbox.
 */
export default class PflowCpeCheckbox extends LightningElement {
    @api label;
    @api name;
    @api checked;
    @api fieldLevelHelp;
    @api disabled;

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
        this.dispatchEvent(
            new CustomEvent('checkboxchanged', {
                detail: {
                    id: event.target.name,
                    newValue: event.target.checked,
                    newValueDataType: 'Boolean',
                    newStringValue: event.target.checked ? CB_TRUE : CB_FALSE
                }
            })
        );
    }
}
