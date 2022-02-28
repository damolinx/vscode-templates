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

export function getManifestPath(folder: vscode.WorkspaceFolder): vscode.Uri {
  const manifestPath = vscode.workspace.getConfiguration("templates")
    .get("manifestPath", TemplatesManifestDefaultPath) || TemplatesManifestDefaultPath;
  const uri = vscode.Uri.joinPath(folder.uri, manifestPath);
  return uri;
}

/**
 * Get registered manifests.
 * @returns Registered manifests.
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
 * @param id 
 * @param templateAsJSON 
 */
export function registerTemplate(id: string, templateAsJSON: string): void {
  const template = <Template>JSON.parse(templateAsJSON);
  Templates.set(id, template);
}

/**
 * Unregister a template registered via {@link registerTemplate}.
 * @param id Template Id.
 */
export function unregisterTemplate(id: string): boolean {
  return Templates.delete(id);
}
