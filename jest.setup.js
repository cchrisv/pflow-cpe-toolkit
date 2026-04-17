jest.mock(
    'lightning/flowSupport',
    () => ({
        FlowAttributeChangeEvent: class FlowAttributeChangeEvent {
            constructor(attributeName, attributeValue) {
                this.attributeName = attributeName;
                this.attributeValue = attributeValue;
            }
        }
    }),
    { virtual: true }
);
