 
import { api } from 'lwc';

/**
 * Reusable Flow screen validation (Three-method contract).
 * @param {typeof LightningElement} Base
 * @returns {typeof LightningElement}
 */
export const FlowValidationMixin = (Base) =>
    class extends Base {
        _hasInteracted = false;
        /** Shown after reportValidity or when user already saw an external error */
        _externalError = '';
        /** Latest message from Flow setCustomValidity */
        _cachedExternalError = '';

        /**
         * Flow runtime validation hook.
         * @returns {{ errorMessage: string|null, isValid: boolean }}
         */
        @api
        validate() {
            const msg = this.getValidationError();
            const isValid = !msg;
            const errorMessage = msg || null;
            return { errorMessage, isValid };
        }

        /**
         * Flow-provided cross-field or async validation message.
         * @param {string} externalErrorMessage
         */
        @api
        setCustomValidity(externalErrorMessage) {
            let msg = '';
            if (externalErrorMessage !== null && externalErrorMessage !== undefined) {
                msg = String(externalErrorMessage);
            }
            this._cachedExternalError = msg;
            if (this._hasInteracted || this._externalError) {
                this._externalError = msg;
            }
        }

        /**
         * Surfaces cached external errors and re-reads internal constraint violations.
         */
        @api
        reportValidity() {
            this._externalError = this._cachedExternalError || '';
            if (typeof this.applyInnerReportValidity === 'function') {
                this.applyInnerReportValidity();
            }
        }

        /**
         * Combined external (Flow) + internal (base components) error for display/validate.
         * @returns {string|null}
         */
        getValidationError() {
            const ext = (this._externalError && String(this._externalError).trim()) || '';
            if (ext) {
                return ext;
            }
            const internal = this.getInternalError();
            if (internal && String(internal).trim()) {
                return String(internal).trim();
            }
            return null;
        }

        /**
         * Override in subclass — return a non-empty string when invalid.
         * @returns {string|null}
         */
        getInternalError() {
            return null;
        }

        markInteracted() {
            this._hasInteracted = true;
        }
    };
