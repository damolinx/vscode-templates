import * as vscode from 'vscode';
import { Template } from './schemas';

//
export interface TemplateRootUriTuple {
  rootUri?: vscode.Uri,
  template: Template
};

export interface TemplateMetadataTuple extends TemplateRootUriTuple {
  values: { itemName: string };
}

/**
 * Show a set of UI components to select a template and provide any required values.
 * @param tuples Tuples to select from.
 * @returns Selected template and captured values.
 */
export async function showTemplateWizardAsync(tuples: Array<TemplateRootUriTuple>)
  : Promise<TemplateMetadataTuple | undefined> {
  const items = tuples
    .sort((a, b) => a.template.name.localeCompare(b.template.name))
    .map((templateAndRoot) =>
      <vscode.QuickPickItem & TemplateRootUriTuple>{
        label: templateAndRoot.template.name,
        description: templateAndRoot.template.description,
        ...templateAndRoot,
      });

  let selection: TemplateRootUriTuple | undefined;
  let itemName: string | undefined;

  const wizardSteps = defineWizard();
  for (let i = 0; i < wizardSteps.length;) {
    const result = await wizardSteps[i]();
    if (result.cancel) {
      return; // cancelled by user
    }
    if (result.back) {
      i--;
    } else {
      i++;
    }
  }

  if (!selection) {
    throw new Error("Missing selected template (bug)");
  }
  if (!itemName) {
    throw new Error("Missing target item name (bug)");
  }

  return {
    rootUri: selection.rootUri,
    template: selection.template,
    values: {
      itemName: itemName,
    }
  };

  // TODO: Support inputs/$input
  function defineWizard() {
    return [
      async () => {
        selection = await showTemplateQuickPick(items);
        return { cancel: !selection, back: false };
      },
      async () => {
        const result = await showItemNameInput(selection!.template, validateItemName);
        itemName = result?.value;
        return { cancel: !result, back: !!result?.back };
      }
    ];
  }
}

async function showTemplateQuickPick(items: Array<TemplateRootUriTuple & vscode.QuickPickItem>): Promise<TemplateRootUriTuple | undefined> {
  const options = <vscode.QuickPickOptions>{
    matchOnDetail: true,
    matchOnDescription: true,
    placeHolder: "Select template to create item(s) from",
    title: "New Item",
  };
  return vscode.window.showQuickPick(items, options);
}

function showItemNameInput(template: Template, validateCallback: (input: string) => string | undefined):
  Promise<{ back?: boolean, value?: string } | undefined> {
  return new Promise<{ back?: boolean, value?: string } | undefined>((resolve, _reject) => {
    const input = vscode.window.createInputBox();
    input.buttons = [
      vscode.QuickInputButtons.Back,
    ];
    input.placeholder = "Provide a name for items to be created";
    input.title = `New ${template.name}: Item Name`;
    input.value = template.defaultItemName || ""; // TODO: maybe calculate one with number suffix ?

    const disposables: vscode.Disposable[] = [];
    disposables.push(
      input.onDidAccept(() => {
        const validationMessage = validateCallback(input.value);
        if (validationMessage) {
          input.validationMessage = validationMessage;
        } else {
          resolve({ value: input.value });
          input.dispose();
        }
      }),
      input.onDidChangeValue((value: string) => {
        const validationMessage = validateCallback(value);
        input.validationMessage = validationMessage;
      }),
      input.onDidHide(() => {
        disposables.forEach(d => d.dispose());
        resolve(undefined);
      }),
      input.onDidTriggerButton((button: vscode.QuickInputButton) => {
        if (button === vscode.QuickInputButtons.Back) {
          resolve({ back: true });
          input.dispose();
        }
      }),
    );

    input.show();
  });
}

function validateItemName(input: string): string | undefined {
  // TODO: define rules and improve.
  if (!input) {
    return "Item name cannot be empty";
  }

  if (input.includes('/') || input.includes('\\')) {
    return "Item name cannot include path separators";
  }

  return;
}