/** Utilities for merge-field / Flow resource values (adapted from fsc_flowComboboxUtils). */
const flowComboboxDefaults = {
    stringDataType: 'String',
    referenceDataType: 'reference',
    defaultKeyPrefix: 'flowCombobox-',
    defaultGlobalVariableKeyPrefix: 'flowCombobox-globalVariable-',
    recordLookupsType: 'recordLookups',
    recordCreatesType: 'recordCreates',
    recordUpdatesType: 'recordUpdates',
    dataTypeSObject: 'SObject',
    isCollectionField: 'isCollection',
    actionType: 'actionCalls',
    screenComponentType: 'screenComponent',
    screenActionType: 'screenAction',
    regionContainerName: 'Screen_Section'
};

const isReference = (value) => {
    if (!value) {
        return false;
    }
    const isRef = value.indexOf('{!') === 0 && value.lastIndexOf('}') === value.length - 1;
    return isRef;
};

const getDataType = (currentText) => {
    if (isReference(currentText)) {
        return flowComboboxDefaults.referenceDataType;
    }
    return flowComboboxDefaults.stringDataType;
};

const formattedValue = (value, dataType) => {
    if (isReference(value)) {
        return value;
    }
    return dataType === flowComboboxDefaults.referenceDataType ? `{!${value}}` : value;
};

const removeFormatting = (value) => {
    if (!value) {
        return value;
    }
    const isRef = isReference(value);
    const clearValue = isRef ? value.substring(0, value.lastIndexOf('}')).replace('{!', '') : value;
    return clearValue;
};

export { flowComboboxDefaults, isReference, formattedValue, getDataType, removeFormatting };
