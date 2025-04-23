import * as assert from 'assert';
import { basename, sep as pathSeparator } from 'path';
import { env } from 'process';
import { FileEditContext, TemplateEditContext } from '../../templateEdit';

import { replaceFileTemplateLevelVariablesAsync, replaceTemplateLevelVariablesAsync } from '../../variableReplacer';

suite(`Suite: ${basename(__filename)}: replaceFileTemplateLevelVariablesAsync`, () => {
  let restorables: { restore: () => void }[];

  setup(() => {
    restorables = [];
  });

  teardown(() => {
    restorables.forEach((r) => r.restore());
  });

  test('Empty string', async () => {
    const original = '';
    const expected = '';
    const context = createContext<FileEditContext>();

    assert.strictEqual(
      await replaceFileTemplateLevelVariablesAsync(context, original),
      expected);

  });

  test('Simple variable', async () => {
    const itemName = 'Expected Item Name';
    const original = 'Template Variable: ${itemName}';
    const expected = `Template Variable: ${itemName}`;
    const context = createContext<FileEditContext>({ itemName: itemName });

    assert.strictEqual(
      await replaceFileTemplateLevelVariablesAsync(context, original),
      expected);
  });

  test('Environment variable', async () => {
    const envVariable = 'TEST_ENV_VARIABLE';
    const envVariableValue = 'TEST_ENV_VARIABLE_VALUE';
    assert.strictEqual(env[envVariable], undefined);
    env[envVariable] = envVariableValue;
    restorables.push({ restore: () => { delete env[envVariable]; } });

    const original = `Template Variable: \${env:${envVariable}}`;
    const expected = `Template Variable: ${envVariableValue}`;
    const context = createContext<FileEditContext>();

    assert.strictEqual(
      await replaceFileTemplateLevelVariablesAsync(context, original),
      expected);
  });
});

suite(`Suite: ${basename(__filename)}: replaceTemplateLevelVariablesAsync`, () => {
  let restorables: { restore: () => void }[];

  setup(() => {
    restorables = [];
  });

  teardown(() => {
    restorables.forEach((r) => r.restore());
  });

  test('Empty string', async () => {
    const original = '';
    const expected = '';
    const context = createContext<TemplateEditContext>();

    assert.strictEqual(
      await replaceTemplateLevelVariablesAsync(context, original),
      expected);
  });

  test('Simple variables', async () => {
    const itemName = 'Expected Item Name';
    const original = '<path>${pathSeparator}${itemName}';
    const expected = `<path>${pathSeparator}${itemName}`;
    const context = createContext<TemplateEditContext>({ itemName: itemName });

    assert.strictEqual(
      await replaceTemplateLevelVariablesAsync(context, original),
      expected);
  });

  test('Unsupported variable', async () => {
    const original = '${file}';
    const expected = original;
    const context = createContext<TemplateEditContext>();

    assert.strictEqual(
      await replaceTemplateLevelVariablesAsync(context, original),
      expected);
  });

  test('Environment variable', async () => {
    const envVariable = 'TEST_ENV_VARIABLE';
    const envVariableValue = 'TEST_ENV_VARIABLE_VALUE';
    assert.strictEqual(env[envVariable], undefined);
    env[envVariable] = envVariableValue;
    restorables.push({ restore: () => { delete env[envVariable]; } });

    const original = `<path>\${pathSeparator}\${env:${envVariable}}`;
    const expected = `<path>${pathSeparator}${envVariableValue}`;
    const context = createContext<TemplateEditContext>();

    assert.strictEqual(
      await replaceTemplateLevelVariablesAsync(context, original),
      expected);
  });
});


function createContext<TContext extends TemplateEditContext>(overrides?: { [K in keyof TContext]?: TContext[K] }): TContext {
  return {
    ...overrides,
  } as TContext;
}