import * as vscode from 'vscode';
import { Template, TemplatesManifest } from "./schemas";

/**
 * Template registered via {@link registerTemplate}.
 */
const Templates: Map<string, Template> = new Map<string, Template>();

/**
 * Templates manifest default workspace-relative path.
 */
const TemplatesManifestDefaultPath = "./.templates/templates.json";

/**
 * Get expected path to templates manifest.
 * @param uri Folder containing manifest.
 * @returns Path as URI.
 */
export function getManifestPath(uri: vscode.Uri): vscode.Uri {
  const manifestPath = vscode.workspace.getConfiguration("templates")
    .get("manifestPath", TemplatesManifestDefaultPath) || TemplatesManifestDefaultPath;
  return vscode.Uri.joinPath(uri, manifestPath);
}

/**
 * Get expected path to templates manifest.
 * @param folder Workspace root containing manifest.
 * @returns Path as URI.
 */
export function getWorkspaceManifestPath(folder: vscode.WorkspaceFolder): vscode.Uri {
  return getManifestPath(folder.uri);
}


/**
 * Get templates registered via {@link registerTemplate}.
 * @returns Registered templates.
 */
export function getRegisteredTemplates(): ReadonlyMap<string, Template> {
  return Templates;
}

/**
 * Load a template manifest. 
 * @param uri Template URI.
 * @returns {@link TemplateManifest} instance.
 */
export async function loadManifestAsync(uri: vscode.Uri): Promise<TemplatesManifest> {
  const document = await vscode.workspace.openTextDocument(uri);
  const contents = document.getText();
  return <TemplatesManifest>JSON.parse(contents);
}

/**
 * Register a template.
 * @param id Template Id. Recommended format: "${extension-id}:${exntension's template id}".
 * @param templateAsJSON JSON vesion of {@link Template}.
 */
export function registerTemplate(id: string, templateAsJSON: string): void {
  const template = <Template>JSON.parse(templateAsJSON);
  Templates.set(id, template);
}

/**
 * Unregister a template.
 * @param id Template Id.
 */
export function unregisterTemplate(id: string): boolean {
  return Templates.delete(id);
}
