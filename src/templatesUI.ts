import * as vscode from 'vscode';
import { Template } from './schemas';

interface TemplateQuickPickItem extends vscode.QuickPickItem {
  readonly template: Template;
}

export async function showTemplateWizardAsync(templates: Array<Template>)
  : Promise<{ template: Template, values: { itemName: string } } | undefined> {
  const items = templates
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(t =>
      <TemplateQuickPickItem>{
        label: t.name, template: t, description: t.description
      });

  let template: Template | undefined;
  let itemName: string | undefined;

  const wizard = [
    async () => {
      template = await showTemplateQuickPick(items);
      return { cancel: !template, back: false };
    },
    async () => {
      const result = await showItemNameInput(template!, validateItemName);
      if (result) {
        itemName = result.value;
        return { cancel: false, back: !!result.back };
      } else {
        return { cancel: true, back: false };
      }
    }
  ];

  for (let i = 0; i < wizard.length;) {
    const result = await wizard[i]();
    if (result.cancel) {
      return; // cancelled by user
    }
    if (result.back) {
      i--;
    } else {
      i++;
    }
  }

  // TODO: Support inputs/$input

  return {
    template: template!,
    values: {
      itemName: itemName!,
    }
  };
}

async function showTemplateQuickPick(items: TemplateQuickPickItem[]): Promise<Template | undefined> {
  const options = <vscode.QuickPickOptions>{
    matchOnDetail: true,
    matchOnDescription: true,
    placeHolder: "Select template to create item(s) from",
    title: "New Item",
  };

  return vscode.window.showQuickPick(items, options)
    .then((selectedItem?: TemplateQuickPickItem) => {
      return selectedItem?.template;
    });
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