import * as vscode from 'vscode';
import * as os from 'os';
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
 * Get expected path to templates manifest in user's home folder.
 * @returns Absolute {@link vscode.Uri}.
 */
export function getHomeManifestUri(): vscode.Uri {
  const homeFolder = vscode.Uri.file(os.homedir());
  return getManifestUri("globalManifestPath", homeFolder);
}

/**
 * Get expected path to templates manifest.
 * @param configurationValue Name of configuration value under `templates` a user-defined path.
 * @param baseUri Base folder to resolve a relative path from.
 * @returns Absolute {@link vscode.Uri}.
 */
function getManifestUri(configurationValue: string, baseUri: vscode.Uri): vscode.Uri {
  const manifestPath = vscode.workspace.getConfiguration("templates")
    .get(configurationValue, TemplatesManifestDefaultPath) || TemplatesManifestDefaultPath;
  return vscode.Uri.joinPath(baseUri, manifestPath);
}

/**
 * Get expected path to templates manifest in folder.
 * @param folder Workspace root containing manifest.
 * @returns Absolute {@link vscode.Uri}.
 */
export function getWorkspaceManifestUri(folder: vscode.WorkspaceFolder): vscode.Uri {
  return getManifestUri("workspaceManifestPath", folder.uri);
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
