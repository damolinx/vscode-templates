import * as vscode from 'vscode';
import { FileTemplate, Template } from './schemas';
import { replaceFileTemplateLevelVariablesAsync, replaceTemplateLevelVariablesAsync } from './variableReplacer';

/**
 * Context used to create a template edit.
 */
export interface TemplateEditContext {
  itemName: string;
  targetFolder: vscode.Uri;
  template: Template;
  templateRoot: vscode.Uri;
  workspace: vscode.WorkspaceFolder;
}

/**
 * Context used to create a file-template edit.
 */
export interface FileEditContext extends TemplateEditContext {
  source: vscode.Uri;
  target: vscode.Uri;
}

/**
 * Creates a workspace edit that is a collection of all changes that the template
 * would apply. Use {@link vscode.workspace.applyEdit} to complete operation.
 */
export async function createTemplateEditAsync(context: TemplateEditContext): Promise<vscode.WorkspaceEdit> {
  const edit = new vscode.WorkspaceEdit();
  for (const templateFile of context.template.files) {
    const editContext = {
      ...context,
      ...await getUrisAsync(context, templateFile),
    } as FileEditContext;
    const targetContent = await getTargetContentAsync(editContext);
    await updateWorkspaceEditAsync(edit, editContext.target, targetContent);
  }
  return edit;
}

async function getUrisAsync(context: TemplateEditContext, templateFile: FileTemplate): Promise<{ source: vscode.Uri, target: vscode.Uri }> {
  const targetItemName = (templateFile.target && await replaceTemplateLevelVariablesAsync(context, templateFile.target)) || templateFile.source;
  const targetRelativePath = context.template.createFolder ? [context.itemName, targetItemName] : [targetItemName];
  return {
    source: vscode.Uri.joinPath(context.templateRoot, templateFile.source),
    target: vscode.Uri.joinPath(context.targetFolder, ...targetRelativePath),
  };
}

async function getTargetContentAsync(context: FileEditContext): Promise<string> {
  const document = await vscode.workspace.openTextDocument(context.source);
  const targetContent = await replaceFileTemplateLevelVariablesAsync(context, document.getText());
  return targetContent;
}

async function updateWorkspaceEditAsync(edit: vscode.WorkspaceEdit, target: vscode.Uri, content: string): Promise<void> {
  const targetExists = await vscode.workspace.fs.stat(target).then(() => true, () => false);
  edit.createFile(target, {
    overwrite: true,
  }, {
    label: targetExists ? 'Overwrite file' : 'Create file',
    needsConfirmation: targetExists,
  });
  edit.insert(target, new vscode.Position(0, 0), content);
}