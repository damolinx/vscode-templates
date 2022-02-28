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
    .get("manifestPath", TemplatesManifestDefaultPath);
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
  return vscode.workspace.openTextDocument(uri)
    .then((document: vscode.TextDocument) => {
      const contents = document.getText();
      return <TemplatesManifest>JSON.parse(contents);
    });
}

/**
 * Load a template manifest.
 * @param manifestUri Manifets URI. Expected to belong to an existing workspace.
 * @returns {@link TemplateManifest} instance.
 */
export async function loadTemplateManifestAsync2(manifestUri: vscode.Uri): Promise<TemplatesManifest> {
  return vscode.workspace.openTextDocument(manifestUri)
    .then((document: vscode.TextDocument) => {
      const documentText = document.getText();
      const manifest = <TemplatesManifest>JSON.parse(documentText);
      return manifest;
    });
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
