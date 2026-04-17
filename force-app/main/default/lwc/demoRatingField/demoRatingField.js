import { api, LightningElement } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';
import { FlowValidationMixin } from 'c/pflowUtilityValidationMixin';

/**
 * Demo runtime screen component used to smoke-test the CPE Toolkit.
 *
 * Renders a 1–N star rating. CPE configuration (label, maxStars, required) is
 * provided by `demoRatingFieldCpe`, which delegates to
 * `c-pflow-organism-property-editor` with a schema. This proves the pluggable
 * CPE pattern end-to-end in Flow Builder.
 */
export default class DemoRatingField extends FlowValidationMixin(LightningElement) {
    /** @type {string} */
    @api label = 'Rating';
    /** @type {number} */
    @api maxStars = 5;
    /** @type {boolean} */
    @api required = false;

    _value = 0;

    @api
    get value() {
        return this._value;
    }
    set value(v) {
        const n = typeof v === 'number' ? v : parseInt(v, 10);
        this._value = Number.isFinite(n) && n >= 0 ? n : 0;
    }

    get stars() {
        const max = Number.isInteger(this.maxStars) && this.maxStars > 0 ? this.maxStars : 5;
        const out = [];
        for (let i = 1; i <= max; i += 1) {
            const filled = i <= this._value;
            out.push({
                index: i,
                iconName: filled ? 'utility:favorite' : 'utility:favorite_alt',
                variant: filled ? 'warning' : 'default',
                buttonClass:
                    'slds-button slds-button_icon ' +
                    (filled ? 'slds-button_icon-brand' : 'slds-button_icon-border-filled'),
                ariaLabel: `Rate ${i} out of ${max}`
            });
        }
        return out;
    }

    get errorMessage() {
        return this.getValidationError();
    }

    handleStarClick(event) {
        const idx = parseInt(event.currentTarget.dataset.index, 10);
        this._value = Number.isFinite(idx) ? idx : 0;
        this.markInteracted();
        this.dispatchEvent(new FlowAttributeChangeEvent('value', this._value));
    }

    /** Required by FlowValidationMixin. */
    getInternalError() {
        if (this.required && (!this._value || this._value <= 0)) {
            return `${this.label || 'Rating'} is required`;
        }
        return null;
    }
}
