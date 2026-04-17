import { createElement } from 'lwc';
import PflowCpeCustomLookup from 'c/pflow_cpeCustomLookup';

describe('c-pflow-cpe-custom-lookup', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('renders search input', () => {
        const el = createElement('c-pflow-cpe-custom-lookup', { is: PflowCpeCustomLookup });
        el.label = 'Search';
        document.body.appendChild(el);
        expect(el.shadowRoot.querySelector('input[type="text"]')).not.toBeNull();
    });

    it('setSearchResults runs without error', () => {
        const el = createElement('c-pflow-cpe-custom-lookup', { is: PflowCpeCustomLookup });
        document.body.appendChild(el);
        expect(() =>
            el.setSearchResults([
                { id: '001', sObjectType: 'Account', icon: 'standard:account', title: 'Acme', subtitle: '' }
            ])
        ).not.toThrow();
    });
});
