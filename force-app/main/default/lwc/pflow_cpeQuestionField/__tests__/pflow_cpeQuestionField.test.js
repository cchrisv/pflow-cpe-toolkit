import { createElement } from 'lwc';
import PflowCpeQuestionField from 'c/pflow_cpeQuestionField';

function create(props = {}) {
    const el = createElement('c-pflow-cpe-question-field', { is: PflowCpeQuestionField });
    Object.assign(el, { fieldLabel: 'Q1', ...props });
    document.body.appendChild(el);
    return el;
}

describe('c-pflow-cpe-question-field', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    // ── Visibility ──

    it('always renders layout', () => {
        const el = create();
        expect(el.shadowRoot.querySelector('lightning-layout')).not.toBeNull();
    });

    // ── Defaults ��─

    it('defaults padding to around-x-small', () => {
        const el = create();
        const item = el.shadowRoot.querySelector('lightning-layout-item');
        expect(item.padding).toBe('around-x-small');
    });

    it('defaults answered to false', () => {
        const el = create();
        expect(el.answered).toBe(false);
    });

    // ── Field classes ──

    it('applies mqf-field with no state classes by default', () => {
        const el = create();
        const field = el.shadowRoot.querySelector('.mqf-field');
        expect(field).not.toBeNull();
        expect(field.classList.contains('mqf-field_error')).toBe(false);
        expect(field.classList.contains('mqf-field_valid')).toBe(false);
    });

    it('applies mqf-field_error when errorMessage is set', () => {
        const el = create({ errorMessage: 'Required' });
        const field = el.shadowRoot.querySelector('.mqf-field');
        expect(field.classList.contains('mqf-field_error')).toBe(true);
        expect(field.classList.contains('mqf-field_valid')).toBe(false);
    });

    it('applies mqf-field_valid when answered is true and no error', () => {
        const el = create({ answered: true });
        const field = el.shadowRoot.querySelector('.mqf-field');
        expect(field.classList.contains('mqf-field_valid')).toBe(true);
        expect(field.classList.contains('mqf-field_error')).toBe(false);
    });

    it('error state takes priority over answered state', () => {
        const el = create({ answered: true, errorMessage: 'Bad input' });
        const field = el.shadowRoot.querySelector('.mqf-field');
        expect(field.classList.contains('mqf-field_error')).toBe(true);
        expect(field.classList.contains('mqf-field_valid')).toBe(false);
    });

    // ── Badge classes ──

    it('renders default badge class with no state', () => {
        const el = create();
        const badge = el.shadowRoot.querySelector('.mqf-badge');
        expect(badge).not.toBeNull();
        expect(badge.classList.contains('mqf-badge_valid')).toBe(false);
        expect(badge.classList.contains('mqf-badge_error')).toBe(false);
    });

    it('applies mqf-badge_valid when answered', () => {
        const el = create({ answered: true });
        const badge = el.shadowRoot.querySelector('.mqf-badge');
        expect(badge.classList.contains('mqf-badge_valid')).toBe(true);
    });

    it('applies mqf-badge_error when error present', () => {
        const el = create({ errorMessage: 'Oops' });
        const badge = el.shadowRoot.querySelector('.mqf-badge');
        expect(badge.classList.contains('mqf-badge_error')).toBe(true);
    });

    it('badge error overrides answered', () => {
        const el = create({ answered: true, errorMessage: 'Oops' });
        const badge = el.shadowRoot.querySelector('.mqf-badge');
        expect(badge.classList.contains('mqf-badge_error')).toBe(true);
        expect(badge.classList.contains('mqf-badge_valid')).toBe(false);
    });

    // ── Badge content (checkmark vs number) ──

    it('shows question number by default', () => {
        const el = create({ questionNumber: '3' });
        const badge = el.shadowRoot.querySelector('.mqf-badge');
        expect(badge.textContent).toContain('3');
        expect(badge.querySelector('lightning-icon')).toBeNull();
    });

    it('shows checkmark icon when answered and no error', () => {
        const el = create({ answered: true });
        const badge = el.shadowRoot.querySelector('.mqf-badge');
        const icon = badge.querySelector('lightning-icon');
        expect(icon).not.toBeNull();
        expect(icon.iconName).toBe('utility:check');
        expect(icon.size).toBe('xx-small');
        expect(icon.variant).toBe('inverse');
    });

    it('shows question number when answered but has error', () => {
        const el = create({ answered: true, errorMessage: 'Err' });
        const badge = el.shadowRoot.querySelector('.mqf-badge');
        expect(badge.querySelector('lightning-icon')).toBeNull();
        expect(badge.textContent).toContain('1');
    });

    // ── Error message ──

    it('renders error message when set', () => {
        const el = create({ errorMessage: 'Field required' });
        const err = el.shadowRoot.querySelector('.mqf-error');
        expect(err).not.toBeNull();
        expect(err.textContent).toBe('Field required');
    });

    it('does not render error element when no error', () => {
        const el = create();
        expect(el.shadowRoot.querySelector('.mqf-error')).toBeNull();
    });

    // ── Grouped (fieldset) ──

    it('renders fieldset when grouped is true', () => {
        const el = create({ grouped: true });
        expect(el.shadowRoot.querySelector('fieldset.mqf-field')).not.toBeNull();
    });

    it('renders div when grouped is false', () => {
        const el = create({ grouped: false });
        expect(el.shadowRoot.querySelector('div.mqf-field')).not.toBeNull();
        expect(el.shadowRoot.querySelector('fieldset')).toBeNull();
    });
});
