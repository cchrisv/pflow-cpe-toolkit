import { createElement } from 'lwc';
import PflowCpeCheckbox from 'c/pflow_cpeCheckbox';

function mount(props = {}) {
    const el = createElement('c-pflow-cpe-checkbox', { is: PflowCpeCheckbox });
    Object.assign(el, props);
    document.body.appendChild(el);
    return el;
}

describe('c-pflow-cpe-checkbox', () => {
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

    it('fires checkboxchanged with the Flow CPE detail shape when toggled on', () => {
        const el = mount({ name: 'enableThing' });
        const handler = jest.fn();
        el.addEventListener('checkboxchanged', handler);

        const input = el.shadowRoot.querySelector('lightning-input');
        input.dispatchEvent(
            new CustomEvent('change', { detail: { checked: true } }),
        );
        // lightning-input stubs: simulate by firing the component's handler directly
        el.shadowRoot
            .querySelector('lightning-input')
            .dispatchEvent(
                new CustomEvent('change', {
                    bubbles: true,
                    composed: true,
                }),
            );

        // Invoke the public handler with a synthetic event shape:
        const syntheticEvt = {
            target: { name: 'enableThing', checked: true }
        };
        el.handleCheckboxChange?.(syntheticEvt);

        expect(handler).toHaveBeenCalled();
        const { detail } = handler.mock.calls[0][0];
        expect(detail).toEqual({
            id: 'enableThing',
            newValue: true,
            newValueDataType: 'Boolean',
            newStringValue: 'CB_TRUE'
        });
    });

    it('fires with CB_FALSE when toggled off', () => {
        const el = mount({ name: 'enableThing', checked: true });
        const handler = jest.fn();
        el.addEventListener('checkboxchanged', handler);

        el.handleCheckboxChange?.({
            target: { name: 'enableThing', checked: false }
        });

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0].detail.newStringValue).toBe('CB_FALSE');
    });

    it('renders fieldLevelHelp text when provided', () => {
        const el = mount({ fieldLevelHelp: 'Toggle to enable the border' });
        return Promise.resolve().then(() => {
            const help = el.shadowRoot.querySelector('.slds-form-element__help');
            expect(help).not.toBeNull();
            expect(help.textContent.trim()).toBe('Toggle to enable the border');
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
