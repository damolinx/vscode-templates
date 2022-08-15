import * as vscode from 'vscode';
import { Utils as UriUtils } from 'vscode-uri';
import * as os from 'os';
import { Template } from './schemas';
import { createTemplateEditAsync } from './templateEdit';
import { getManifestPath as getManifestFileUri, getRegisteredTemplates, getWorkspaceManifestPath as getWorkspaceManifestFileUri, loadManifestAsync, registerTemplate, unregisterTemplate } from './templates';
import { showTemplateWizardAsync, TemplateRootUriTuple } from './templatesUI';

/**
 * Extension startup. 
 * @param context Context.
 */
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'templates.newItem',
      async (folderPathOrUri?: vscode.Uri | string): Promise<void> => {
        // Workspace folder is not be available in all contexts,
        // See: https://github.com/Microsoft/vscode/issues/3553
        const folder = folderPathOrUri ?? vscode.workspace.workspaceFolders?.at(0)?.uri;
        if (!folder) {
          vscode.window.showErrorMessage("No target folder to add items to");
          return;
        }
        await createNewItemsAsync(folder).catch((reason) =>
          // TODO: Tons of validations.
          vscode.window.showErrorMessage(reason.toString(), { modal: true, detail: reason.stack || ''})
        );
      }
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
 * a folder that belongs to an open workspace.
 */
async function createNewItemsAsync(folder: vscode.Uri | string): Promise<void> {
  const targetFolderUri = folder instanceof vscode.Uri ? folder : vscode.Uri.parse(folder, true);

  const targetWorkspaceFolder = vscode.workspace.getWorkspaceFolder(targetFolderUri);
  if (!targetWorkspaceFolder) {
    vscode.window.showErrorMessage(
      `Target folder does not belong to a currently open workspace. Folder:${targetFolderUri}`);
    return;
  }

  // Load templates every time to avoid the risks and complexities of monitoring 
  // the FS on a feature that would be uncommonly used. 
  const templates = await loadTemplates(targetWorkspaceFolder);
  if (templates.size === 0) {
    // TODO: Offer to create a template file?
    vscode.window.showWarningMessage(
      "There are no templates available. They can be define in your workspace or user directory");
    return;
  }

  const selection = await showTemplateWizardAsync(Array.from(templates.values()));
  if (!selection) {
    return; // cancelled by user
  }

  const rootUri = selection.rootUri ?? targetWorkspaceFolder.uri;
  const templateRootUri = selection.template.location ? vscode.Uri.joinPath(rootUri, selection.template.location) : rootUri;
  const edit = await createTemplateEditAsync({
    ...selection.values,
    targetFolder: targetFolderUri,
    template: selection.template,
    templateRoot: templateRootUri,
    workspace: targetWorkspaceFolder
  });

  const applied = await vscode.workspace.applyEdit(edit);
  if (!applied) {
    throw new Error("Failed to apply template changes."); // TODO: how to get further details here?
  }
}

async function loadTemplates(workspaceFolder: vscode.WorkspaceFolder): Promise<Map<string, TemplateRootUriTuple>> {
  const templates = new Map<string, TemplateRootUriTuple>();

  // Load programatically-added templates. There is no manifest to connect them to, 
  // so it is assumed these provide absolute or workspace-relative URIs.
  getRegisteredTemplates().forEach((template: Template, id: string) => {
    templates.set(id, { template: template });
  });

  // Load templates from user folder then workspace
  const homeFolder = vscode.Uri.file(os.homedir());
  const homeManifestUri = getManifestFileUri(homeFolder);
  const workspaceManifestUri = getWorkspaceManifestFileUri(workspaceFolder);
  for (var manifestUri of [homeManifestUri, workspaceManifestUri]) {
    const manifestExists = await vscode.workspace.fs.stat(manifestUri).then(() => true, () => false);
    if (!manifestExists) {
      continue; // Nothing to process
    }

    const manifest = await loadManifestAsync(manifestUri);
    manifest.templates.forEach((template: Template, index: number) => {
      // TODO: Design ID scheme to support overriding
      const id = `${template.name}@${manifestUri}[${index}]`;
      templates.set(
        id,
        {
          rootUri: UriUtils.dirname(manifestUri),
          template: template,
        });
    });
  }

  return templates;
}

