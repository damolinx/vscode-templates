import * as assert from 'assert';
import { basename } from 'path';
import { Template } from '../../schemas';
import { getRegisteredTemplates, registerTemplate, unregisterTemplate } from '../../templates';

suite(`Suite: ${basename(__filename)}: replaceFileTemplateLevelVariablesAsync`, () => {
  let restorables: { restore: () => void }[];

  setup(() => {
    restorables = [];
  });

  teardown(() => {
    restorables.forEach((r) => r.restore());
  });

  test('getRegisteredTemplates / registerTemplate / unregisterTemplate', () => {
    const template: Template = {
      location: 'test location',
      name: 'test name',
      files: [],
    };
    const templateAsJSON = JSON.stringify(template);
    const templateId = 'test:templateId';

    assert.strictEqual(getRegisteredTemplates().size, 0);
    registerTemplate(templateId, templateAsJSON);

    const registeredTemplates = getRegisteredTemplates();
    assert.strictEqual(registeredTemplates.size, 1);
    assert.deepStrictEqual(registeredTemplates.get(templateId), template);

    unregisterTemplate(templateId);
    assert.strictEqual(getRegisteredTemplates().size, 0);
  });
});