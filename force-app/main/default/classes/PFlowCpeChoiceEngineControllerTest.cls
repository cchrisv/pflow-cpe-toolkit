/**
 * @description Tests for PFlowCpeChoiceEngineController (adapted from coreFlow test coverage).
 */
@IsTest
private class PFlowCpeChoiceEngineControllerTest {
    @IsTest
    static void testValidateLookupConfiguration_leadObject() {
        if (!Schema.getGlobalDescribe().containsKey('Lead')) {
            return;
        }
        PFlowCpeChoiceEngineController.SearchRequest req = new PFlowCpeChoiceEngineController.SearchRequest();
        req.sObjectName = 'Lead';
        req.displayedFieldName = 'LastName';
        req.valueFieldName = 'Id';
        PFlowCpeChoiceEngineController.LookupValidationResult r = PFlowCpeChoiceEngineController.validateLookupConfiguration(req);
        String cfgMsg = r.configurationMessage == null ? '' : r.configurationMessage;
        System.assertEquals(true, r.isConfigurationValid, cfgMsg);
        System.assertEquals(true, r.displayFieldSupportsSearch);
    }

    @IsTest
    static void testValidateLookupConfiguration_invalidObject() {
        PFlowCpeChoiceEngineController.SearchRequest req = new PFlowCpeChoiceEngineController.SearchRequest();
        req.sObjectName = 'ZZZNomatchObject999__c';
        req.displayedFieldName = 'Name';
        req.valueFieldName = 'Id';
        PFlowCpeChoiceEngineController.LookupValidationResult r = PFlowCpeChoiceEngineController.validateLookupConfiguration(req);
        System.assertEquals(false, r.isConfigurationValid);
    }

    @IsTest
    static void testValidateLookupConfiguration_badDisplayField() {
        PFlowCpeChoiceEngineController.SearchRequest req = new PFlowCpeChoiceEngineController.SearchRequest();
        req.sObjectName = 'Account';
        req.displayedFieldName = 'NotARealField9999';
        req.valueFieldName = 'Id';
        PFlowCpeChoiceEngineController.LookupValidationResult r = PFlowCpeChoiceEngineController.validateLookupConfiguration(req);
        System.assertEquals(false, r.isConfigurationValid);
    }

    @IsTest
    static void testValidateLookupConfiguration_accountWithImpossibleWhere() {
        PFlowCpeChoiceEngineController.SearchRequest req = new PFlowCpeChoiceEngineController.SearchRequest();
        req.sObjectName = 'Account';
        req.displayedFieldName = 'Name';
        req.valueFieldName = 'Id';
        req.whereClause = 'Name = \'__nomatch_coreflow_test__\'';
        PFlowCpeChoiceEngineController.LookupValidationResult r = PFlowCpeChoiceEngineController.validateLookupConfiguration(req);
        System.assertEquals(true, r.isConfigurationValid);
        System.assertEquals(false, r.hasMatchingRows);
    }

    @IsTest
    static void testGetLookupSearchResults_emptyWhenInvalidObject() {
        PFlowCpeChoiceEngineController.SearchRequest req = new PFlowCpeChoiceEngineController.SearchRequest();
        req.sObjectName = 'BadObjectZZZ__c';
        req.displayedFieldName = 'Name';
        req.valueFieldName = 'Id';
        List<PFlowCpeChoiceEngineController.ChoiceOption> rows = PFlowCpeChoiceEngineController.getLookupSearchResults(req);
        System.assertEquals(0, rows.size());
    }

    @IsTest
    static void testGetLookupSearchResults_withSearchTerm() {
        Account a = new Account(Name = 'PflowCpeLkupSrch 991');
        insert a;
        PFlowCpeChoiceEngineController.SearchRequest req = new PFlowCpeChoiceEngineController.SearchRequest();
        req.sObjectName = 'Account';
        req.displayedFieldName = 'Name';
        req.valueFieldName = 'Id';
        req.subtitleFieldName = 'Industry';
        req.otherFields = 'Phone';
        req.searchTerm = 'PflowCpe';
        List<PFlowCpeChoiceEngineController.ChoiceOption> rows = PFlowCpeChoiceEngineController.getLookupSearchResults(req);
        System.assert(!rows.isEmpty());
    }

    @IsTest
    static void testGetLookupSearchResultsDetailed_accountSearch() {
        Account a = new Account(Name = 'PflowCpeDetailSrch 992');
        insert a;
        List<PFlowCpeChoiceEngineController.ChoiceOption> rows = PFlowCpeChoiceEngineController.getLookupSearchResultsDetailed(
            'Account',
            'Name',
            null,
            'Id',
            null,
            null,
            null,
            null,
            'coreflow'
        );
        System.assert(!rows.isEmpty());
    }

    @IsTest
    static void testGetRecords_accounts() {
        Account a = new Account(Name = 'PflowCpeRec 992');
        insert a;
        PFlowCpeChoiceEngineController.GetRecordsRequest gr = new PFlowCpeChoiceEngineController.GetRecordsRequest();
        gr.sObjectName = 'Account';
        gr.displayedFieldName = 'Name';
        gr.valueFieldName = 'Id';
        List<PFlowCpeChoiceEngineController.ChoiceOption> rs = PFlowCpeChoiceEngineController.getRecords(gr);
        System.assert(!rs.isEmpty());
    }

    @IsTest
    static void testGetFieldValue_accountName() {
        Account a = new Account(Name = 'PflowCpeFV 993');
        insert a;
        PFlowCpeChoiceEngineController.GetFieldValueRequest fv = new PFlowCpeChoiceEngineController.GetFieldValueRequest();
        fv.obj = 'Account';
        fv.objId = a.Id;
        fv.label = 'Name';
        PFlowCpeChoiceEngineController.ChoiceOption one = PFlowCpeChoiceEngineController.getFieldValue(fv);
        System.assertNotEquals(null, one);
        System.assertEquals(a.Id, one.value);
    }

    @IsTest
    static void testGetFieldValue_invalidParams() {
        PFlowCpeChoiceEngineController.GetFieldValueRequest fv = new PFlowCpeChoiceEngineController.GetFieldValueRequest();
        fv.obj = 'Account';
        fv.objId = null;
        fv.label = 'Name';
        PFlowCpeChoiceEngineController.ChoiceOption one = PFlowCpeChoiceEngineController.getFieldValue(fv);
        System.assertEquals(null, one);
    }

    @IsTest
    static void testGetReferenceAndHelpText() {
        PFlowCpeChoiceEngineController.getReference('Contact.AccountId');
        PFlowCpeChoiceEngineController.getHelpText('Account.Name');
        PFlowCpeChoiceEngineController.getReference('NotDotted');
        PFlowCpeChoiceEngineController.getReference('');
    }

    @IsTest
    static void testValidateLookup_badAdditionalField() {
        PFlowCpeChoiceEngineController.SearchRequest req = new PFlowCpeChoiceEngineController.SearchRequest();
        req.sObjectName = 'Account';
        req.displayedFieldName = 'Name';
        req.valueFieldName = 'Id';
        req.otherFields = 'NotARealField9999';
        PFlowCpeChoiceEngineController.LookupValidationResult r = PFlowCpeChoiceEngineController.validateLookupConfiguration(req);
        System.assertEquals(false, r.isConfigurationValid);
    }

    @IsTest
    static void testValidateLookup_nullRequest() {
        PFlowCpeChoiceEngineController.LookupValidationResult r = PFlowCpeChoiceEngineController.validateLookupConfiguration(null);
        System.assertEquals(false, r.isConfigurationValid);
    }

    @IsTest
    static void testValidateLookupConfigurationDetailed_lead() {
        if (!Schema.getGlobalDescribe().containsKey('Lead')) {
            return;
        }
        PFlowCpeChoiceEngineController.LookupValidationResult r = PFlowCpeChoiceEngineController.validateLookupConfigurationDetailed(
            'Lead',
            'LastName',
            null,
            'Id',
            null,
            null,
            null,
            null
        );
        String m = r.configurationMessage == null ? '' : r.configurationMessage;
        System.assertEquals(true, r.isConfigurationValid, m);
    }

    @IsTest
    static void testGetLookupSearchResults_nullRequest() {
        List<PFlowCpeChoiceEngineController.ChoiceOption> rows = PFlowCpeChoiceEngineController.getLookupSearchResults(null);
        System.assertEquals(0, rows.size());
    }

    @IsTest
    static void testGetRecords_nullRequest() {
        List<PFlowCpeChoiceEngineController.ChoiceOption> rs = PFlowCpeChoiceEngineController.getRecords(null);
        System.assertEquals(0, rs.size());
    }

    @IsTest
    static void testGetSoslSearchResults_account() {
        Account a = new Account(Name = 'PflowCpeSoslUnique 884422');
        insert a;
        PFlowCpeChoiceEngineController.SearchRequest req = new PFlowCpeChoiceEngineController.SearchRequest();
        req.sObjectName = 'Account';
        req.displayedFieldName = 'Name';
        req.valueFieldName = 'Id';
        req.searchTerm = '884422';
        List<PFlowCpeChoiceEngineController.ChoiceOption> rows = PFlowCpeChoiceEngineController.getSoslSearchResults(req);
        System.assert(!rows.isEmpty(), 'SOSL should find inserted Account by name token');
    }

    @IsTest
    static void testGetSoslSearchResults_shortTermReturnsEmpty() {
        PFlowCpeChoiceEngineController.SearchRequest req = new PFlowCpeChoiceEngineController.SearchRequest();
        req.sObjectName = 'Account';
        req.displayedFieldName = 'Name';
        req.valueFieldName = 'Id';
        req.searchTerm = 'x';
        List<PFlowCpeChoiceEngineController.ChoiceOption> rows = PFlowCpeChoiceEngineController.getSoslSearchResults(req);
        System.assertEquals(0, rows.size());
    }

    // --- Field selector tests ---

    @IsTest
    static void testGetObjectFieldsReturnsAccountFields() {
        Test.startTest();
        List<PFlowCpeChoiceEngineController.Field> fields = PFlowCpeChoiceEngineController.getObjectFields('Account');
        Test.stopTest();

        Boolean accountOk =
            Schema.getGlobalDescribe().containsKey('Account') &&
            Schema.getGlobalDescribe().get('Account').getDescribe().isAccessible();
        System.assert(accountOk, 'Account should be accessible in describe for this org');

        if (fields.isEmpty()) {
            return;
        }
        Boolean hasName = false;
        for (PFlowCpeChoiceEngineController.Field f : fields) {
            if (f.name == 'Name') {
                hasName = true;
                break;
            }
        }
        System.assert(hasName, 'Account.Name should be present when any Account fields are readable');
    }

    @IsTest
    static void testGetObjectFieldsBlankNameReturnsEmpty() {
        System.assertEquals(0, PFlowCpeChoiceEngineController.getObjectFields(null).size());
        System.assertEquals(0, PFlowCpeChoiceEngineController.getObjectFields('').size());
        System.assertEquals(0, PFlowCpeChoiceEngineController.getObjectFields('   ').size());
    }

    @IsTest
    static void testGetObjectFieldsInvalidTypeReturnsEmpty() {
        System.assertEquals(0, PFlowCpeChoiceEngineController.getObjectFields('NotARealObjectZZZ999').size());
    }

    @IsTest
    static void testSearchSObjectTypesReturnsAccount() {
        List<PFlowCpeChoiceEngineController.ChoiceOption> rows = PFlowCpeChoiceEngineController.searchSObjectTypes('accoun');
        System.assert(!rows.isEmpty());
        Boolean found = false;
        for (PFlowCpeChoiceEngineController.ChoiceOption r : rows) {
            if (r.value == 'Account') {
                found = true;
                break;
            }
        }
        System.assert(found);
    }

    @IsTest
    static void testSearchPicklistFieldsForAccountReturnsRowsWhenVisible() {
        List<PFlowCpeChoiceEngineController.ChoiceOption> rows = PFlowCpeChoiceEngineController.searchPicklistFieldsForObject('Account', '');
        if (rows.isEmpty()) {
            return;
        }
        Boolean anyPicklist = false;
        for (PFlowCpeChoiceEngineController.ChoiceOption r : rows) {
            if (r.subtitle != null && r.subtitle.contains('PICKLIST')) {
                anyPicklist = true;
                break;
            }
        }
        System.assert(anyPicklist);
    }

    @IsTest
    static void testGetControllerFieldApiNameNameFieldReturnsBlank() {
        System.assertEquals('', PFlowCpeChoiceEngineController.getControllerFieldApiName('Account', 'Name'));
    }

    @IsTest
    static void testSearchPicklistValuesForAccountIndustry() {
        List<PFlowCpeChoiceEngineController.ChoiceOption> vals = PFlowCpeChoiceEngineController.searchControllerPicklistValues(
            'Account',
            'Industry',
            ''
        );
        System.assertEquals(0, vals.size());
    }

    @IsTest
    static void testSearchSObjectTypesBlankReturnsRows() {
        List<PFlowCpeChoiceEngineController.ChoiceOption> rows = PFlowCpeChoiceEngineController.searchSObjectTypes('');
        System.assert(!rows.isEmpty());
    }

    @IsTest
    static void testSearchPicklistFieldsBlankObjectReturnsEmpty() {
        System.assertEquals(0, PFlowCpeChoiceEngineController.searchPicklistFieldsForObject('', 'x').size());
        System.assertEquals(0, PFlowCpeChoiceEngineController.searchPicklistFieldsForObject(null, 'x').size());
    }

    @IsTest
    static void testGetControllerFieldBlankArgs() {
        System.assertEquals('', PFlowCpeChoiceEngineController.getControllerFieldApiName('', 'Name'));
        System.assertEquals('', PFlowCpeChoiceEngineController.getControllerFieldApiName('Account', ''));
    }

    @IsTest
    static void testSearchPicklistValuesForFieldIndustryWhenReadable() {
        Schema.DescribeFieldResult ind = Account.Industry.getDescribe();
        if (!ind.isAccessible()) {
            return;
        }
        List<PFlowCpeChoiceEngineController.ChoiceOption> vals = PFlowCpeChoiceEngineController.searchPicklistValuesForFieldForTest(
            'Account',
            'Industry',
            ''
        );
        System.assert(!vals.isEmpty());
    }

    @IsTest
    static void testSearchPicklistValuesForNonPicklistFieldReturnsEmpty() {
        System.assertEquals(
            0,
            PFlowCpeChoiceEngineController.searchPicklistValuesForFieldForTest('Account', 'Name', '').size()
        );
    }

    @IsTest
    static void testSearchPicklistFieldsBogusObjectReturnsEmpty() {
        System.assertEquals(0, PFlowCpeChoiceEngineController.searchPicklistFieldsForObject('NotAnObjectZZZ__c', '').size());
    }

    @IsTest
    static void testSearchControllerPicklistBogusObjectReturnsEmpty() {
        System.assertEquals(
            0,
            PFlowCpeChoiceEngineController.searchControllerPicklistValues('NotAnObjectZZZ__c', 'Field__c', '').size()
        );
    }

    @IsTest
    static void testSearchPicklistValuesBogusObjectReturnsEmpty() {
        System.assertEquals(
            0,
            PFlowCpeChoiceEngineController.searchPicklistValuesForFieldForTest('NotAnObjectZZZ__c', 'Industry', '').size()
        );
    }

    @IsTest
    static void testSearchPicklistValuesWithSearchKeyFilter() {
        if (!Account.Industry.getDescribe().isAccessible()) {
            return;
        }
        List<PFlowCpeChoiceEngineController.ChoiceOption> vals = PFlowCpeChoiceEngineController.searchPicklistValuesForFieldForTest(
            'Account',
            'Industry',
            'zzzznomatch999'
        );
        System.assertEquals(0, vals.size());
    }

    @IsTest
    static void testSearchSObjectTypesNoMatchReturnsEmpty() {
        List<PFlowCpeChoiceEngineController.ChoiceOption> rows = PFlowCpeChoiceEngineController.searchSObjectTypes('zzzzzznomatchobject99999');
        System.assertEquals(0, rows.size());
    }

    @IsTest
    static void testGetRecordTypeOptionsLead() {
        if (!Schema.getGlobalDescribe().containsKey('Lead')) {
            return;
        }
        List<PFlowCpeChoiceEngineController.ChoiceOption> rts = PFlowCpeChoiceEngineController.getRecordTypeOptions('Lead');
        System.assert(!rts.isEmpty());
    }

    @IsTest
    static void testSearchLookupDatasetFieldsForLead() {
        if (!Schema.getGlobalDescribe().containsKey('Lead')) {
            return;
        }
        List<PFlowCpeChoiceEngineController.ChoiceOption> rows = PFlowCpeChoiceEngineController.searchLookupDatasetFieldsForObject('Lead', '');
        System.assert(!rows.isEmpty());
        Boolean sawName = false;
        for (PFlowCpeChoiceEngineController.ChoiceOption r : rows) {
            if (r != null && r.value == 'Name') {
                sawName = true;
                break;
            }
        }
        System.assert(sawName);
    }
}
