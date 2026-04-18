import { api, LightningElement } from 'lwc';

/**
 * Runtime demo for the "widget-direct" CPE — renders a summary of the
 * inputs that demoWidgetsDirectCpe collected via direct widget use
 * (FieldPicker, MultiFieldPicker mode, WhereBuilder, OrderLimit).
 * This path bypasses the Property Editor — it's the "hand-rolled CPE
 * with our widgets as Lego" use case.
 */
export default class DemoWidgetsDirect extends LightningElement {
    @api displayLabel = 'Widgets Direct';
    @api sobjectApiName;
    @api sortField;
    @api additionalFields;
    @api whereClause;
    @api orderByField;
    @api orderByDirection;
    @api queryLimit;

    get orderSummary() {
        if (!this.orderByField) return '(not set)';
        return `${this.orderByField} ${this.orderByDirection || 'DESC'}`;
    }
}
