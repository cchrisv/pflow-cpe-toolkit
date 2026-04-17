import { api, LightningElement } from 'lwc';

/**
 * Kitchen-sink runtime demo. Renders a summary of every configured property
 * so we can visually verify the PropertyEditor wired each type correctly
 * (text / pattern / integer / boolean / boolean-compact / date / datetime /
 *  picklist / supportsResource).
 */
export default class DemoKitchenSink extends LightningElement {
    @api label = 'Kitchen Sink';
    @api textValue;
    @api pattern;
    @api count;
    @api active;
    @api showHeader;
    @api goLive;
    @api deadline;
    @api priority;
    @api defaultOwner;

    get activeDisplay() {
        if (this.active === true || this.active === 'true' || this.active === 'CB_TRUE') return 'Yes';
        return 'No';
    }

    get showHeaderDisplay() {
        if (this.showHeader === true || this.showHeader === 'true' || this.showHeader === 'CB_TRUE') return 'Yes';
        return 'No';
    }
}
