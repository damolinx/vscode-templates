import * as vscode from 'vscode';
import { Utils as UriUtils } from 'vscode-uri';
import { Template } from './schemas';
import { createTemplateEditAsync } from './templateEdit';
import { getManifestPath, getRegisteredTemplates, loadManifestAsync, registerTemplate, unregisterTemplate } from './templates';
import { showTemplateWizardAsync } from './templatesUI';

/**
 * Extension startup. 
 * @param context Context.
 */
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'templates.newItem',
      (folder?: vscode.Uri | string): Promise<void> => createNewItemsAsync(folder)
    ),
    vscode.commands.registerCommand(
      'templates.registerTemplate',
      (id: string, templateAsJSON: string): void => registerTemplate(id, templateAsJSON)
    ),
    vscode.commands.registerCommand(
      'templates.unregisterTemplate',
      (id: string): boolean => unregisterTemplate(id)
    )
  );
}

/**
 * Add a new item using a template.
 * 
 * @param folder Folder to add new item to. Must be an absolute URI or path to
 * a folder that belongs to an open workspace. If missing, root of currently
 * opened workspace will be used.
 */
async function createNewItemsAsync(folder?: vscode.Uri | string): Promise<void> {
  // Workspace folder might not be available in all contexts.
  // See: https://github.com/Microsoft/vscode/issues/3553
  const folderUri = folder 
    ? folder instanceof vscode.Uri ? folder : vscode.Uri.parse(folder, true)
    : vscode.workspace.workspaceFolders?.at(0)?.uri;

  if (!folderUri) {
    throw new Error("BUG: Missing required target folder.");
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(folderUri);
  if (!workspaceFolder) {
    vscode.window.showErrorMessage(`Target folder does not belong to a currently open workspace. Folder:${folderUri}`);
    return;
  }

  const templates = new Map<string, Template>(getRegisteredTemplates());

  // Load templates from workspace every time and do not register them to avoid
  // the complexities of monitoring changes on workspace settings or the FS.
  const manifestUri = getManifestPath(workspaceFolder);
  const manifestExists = await vscode.workspace.fs.stat(manifestUri).then(undefined, () => undefined);
  if (manifestExists) {
    const manifest = await loadManifestAsync(manifestUri);
    manifest.templates.forEach((value: Template, index: number) => {
      templates.set(`${value.name}@${manifestUri}[${index}]`, value);
    });
  }

  if (templates.size === 0) {
    const friendlyLocation = vscode.workspace.asRelativePath(manifestUri, true)
    const msg = `There are no templates available in workspace '${workspaceFolder.name}'. They can be defined in ${friendlyLocation}`;
    
    // TODO: Offer to create a template file.
    vscode.window.showWarningMessage(msg);
    return;
  }

  const selection = await showTemplateWizardAsync(Array.from(templates.values()));
  if (!selection) {
    return; // cancelled by user
  }

  const templateRootUri = vscode.Uri.joinPath(UriUtils.dirname(manifestUri), selection.template.location);
  const edit = await createTemplateEditAsync({
    ...selection.values,
    targetFolder: folderUri,
    template: selection.template,
    templateRoot: templateRootUri,
    workspace: workspaceFolder
  });

  const applied = await vscode.workspace.applyEdit(edit);
  if (!applied) {
    throw new Error("Failed to apply template changes."); // TODO: how to get further details here?
  }
}
