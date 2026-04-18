import { createElement } from 'lwc';
import PflowAtomCheckbox from 'c/pflowAtomCheckbox';

function mount(props = {}) {
    const el = createElement('c-pflow-atom-checkbox', { is: PflowAtomCheckbox });
    Object.assign(el, props);
    document.body.appendChild(el);
    return el;
}

describe('c-pflow-atom-checkbox', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('renders a lightning-input toggle with the provided label', () => {
        const el = mount({ label: 'Show Border', name: 'showBorder' });
        const input = el.shadowRoot.querySelector('lightning-input');
        expect(input).not.toBeNull();
        expect(input.type).toBe('toggle');
        expect(input.label).toBe('Show Border');
    });

    describe('isChecked value coercion', () => {
        it('treats boolean true as checked', () => {
            const el = mount({ checked: true });
            expect(el.isChecked).toBe(true);
        });

        it("treats string 'true' as checked", () => {
            const el = mount({ checked: 'true' });
            expect(el.isChecked).toBe(true);
        });

        it('treats the CB_TRUE sentinel as checked', () => {
            const el = mount({ checked: 'CB_TRUE' });
            expect(el.isChecked).toBe(true);
        });

        it('treats false / undefined / empty as unchecked', () => {
            expect(mount({ checked: false }).isChecked).toBe(false);
            expect(mount({}).isChecked).toBe(false);
            expect(mount({ checked: '' }).isChecked).toBe(false);
            expect(mount({ checked: 'CB_FALSE' }).isChecked).toBe(false);
        });
    });

    it('fires checkboxchanged with CB_TRUE when the underlying toggle emits checked=true', () => {
        const el = mount({ name: 'enableThing' });
        const handler = jest.fn();
        el.addEventListener('checkboxchanged', handler);

        const input = el.shadowRoot.querySelector('lightning-input');
        // Simulate the lightning-input change event with a target carrying the Flow-CPE shape.
        Object.defineProperty(input, 'checked', { value: true, configurable: true });
        Object.defineProperty(input, 'name', { value: 'enableThing', configurable: true });
        input.dispatchEvent(new CustomEvent('change'));

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0].detail).toEqual({
            id: 'enableThing',
            newValue: true,
            newValueDataType: 'Boolean',
            newStringValue: 'CB_TRUE'
        });
    });

    it('fires with CB_FALSE when the underlying toggle emits checked=false', () => {
        const el = mount({ name: 'enableThing', checked: true });
        const handler = jest.fn();
        el.addEventListener('checkboxchanged', handler);

        const input = el.shadowRoot.querySelector('lightning-input');
        Object.defineProperty(input, 'checked', { value: false, configurable: true });
        Object.defineProperty(input, 'name', { value: 'enableThing', configurable: true });
        input.dispatchEvent(new CustomEvent('change'));

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0].detail.newStringValue).toBe('CB_FALSE');
    });

    it('passes fieldLevelHelp through to lightning-input as native field-level-help (tooltip)', () => {
        const help = 'Toggle to enable the border';
        const el = mount({ fieldLevelHelp: help });
        return Promise.resolve().then(() => {
            const input = el.shadowRoot.querySelector('lightning-input');
            expect(input.fieldLevelHelp).toBe(help);
            // Also verify we no longer render a legacy static help div.
            expect(el.shadowRoot.querySelector('.slds-form-element__help')).toBeNull();
        });
    });

    it('respects the disabled prop', () => {
        const el = mount({ disabled: true });
        return Promise.resolve().then(() => {
            const input = el.shadowRoot.querySelector('lightning-input');
            expect(input.disabled).toBe(true);
        });
    });
});
