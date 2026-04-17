import { LightningElement, api } from 'lwc';

const LAYOUT_FULL_WIDTH = 12;
const LAYOUT_HALF_WIDTH = 6;

export default class PflowCpeQuestionField extends LightningElement {
    /** @type {string} */
    @api questionNumber = '1';
    /** @type {string|undefined} */
    @api fieldLabel;
    /** @type {number} */
    @api size = LAYOUT_FULL_WIDTH;
    /** @type {number} */
    @api mediumDeviceSize = LAYOUT_HALF_WIDTH;
    /** @type {number|undefined} */
    @api largeDeviceSize;
    /** @type {string} */
    @api errorMessage = '';
    /** @type {boolean} */
    @api grouped = false;
    /** @type {boolean} */
    @api required = false;
    /** @type {string} */
    @api padding = 'around-x-small';
    /** @type {string|undefined} */
    @api fieldLevelHelp;
    /** @type {boolean} */
    @api answered = false;

    legendId;

    static legendUidSeq = 0;

    connectedCallback() {
        this.legendId = `mqf-legend-${PflowCpeQuestionField.legendUidSeq}`;
        PflowCpeQuestionField.legendUidSeq += 1;
    }

    /** @returns {boolean} */
    get isOptional() {
        return !this.required;
    }

    /** @returns {boolean} */
    get hasError() {
        return !!this.errorMessage;
    }

    /** @returns {boolean} */
    get showCheckmark() {
        return this.answered && !this.hasError;
    }

    /** @returns {string} */
    get fieldClasses() {
        let cls = 'mqf-field';
        if (this.hasError) {
            cls += ' mqf-field_error';
        } else if (this.answered) {
            cls += ' mqf-field_valid';
        }
        return cls;
    }

    /** @returns {string} */
    get badgeClasses() {
        let cls = 'mqf-badge';
        if (this.hasError) {
            cls += ' mqf-badge_error';
        } else if (this.answered) {
            cls += ' mqf-badge_valid';
        }
        return cls;
    }

    get computedMediumDeviceSize() {
        return this.mediumDeviceSize;
    }

    get computedLargeDeviceSize() {
        if (this.largeDeviceSize === null || this.largeDeviceSize === undefined) {
            return this.mediumDeviceSize;
        }
        return this.largeDeviceSize;
    }
}
