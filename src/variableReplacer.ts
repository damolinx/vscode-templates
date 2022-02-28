import * as vscode from 'vscode';
import * as vscodeUri from 'vscode-uri';
import * as path from 'path';
import { FileEditContext, TemplateEditContext } from './templateEdit';

// VSCode does not expose its system for variable replacement, so this 
// code provides it. 
//   https://github.com/microsoft/vscode/issues/46471

export async function replaceFileTemplateLevelVariablesAsync(context: FileEditContext, content: string): Promise<string> {
  const cache = new Map<string, string>();
  const matches = content.match(/\${.+?}/g);

  // TODO: This uses the regexp twice to deal with async, but parsing the file
  // manually would allow to do this in just one pass.
  for (let match of matches!) {
    if (!cache.has(match)) {
      const replacementValue = await getReplacementValueAsync(context, match);
      cache.set(match, replacementValue);
    }
  }

  return content.replace(/\${.+?}/g, (match) => cache.get(match) ?? match);
}

export function replaceTemplateLevelVariables(context: TemplateEditContext, content: string): string {
  const cache = new Map<string, string>();
  return content.replace(/\${.+?}/g, (match) => {
    let replacement = cache.get(match);
    if (replacement === undefined) {
      replacement = evalTemplateLevelVariable(context, match) ?? match;
      cache.set(match, replacement);
    }
    return replacement;
  });
}

async function getReplacementValueAsync(context: FileEditContext, variableName: string): Promise<string> {
  let replacementValue: string | undefined;
  if (replacementValue === undefined) {
    if (variableName.startsWith('${env:')) {
      const envVarName = variableName.substring(6, variableName.length - 1);
      replacementValue = (envVarName && process.env[envVarName]);
    } else if (variableName.startsWith('${command:')) {
      const commandName = variableName.substring(10, variableName.length - 1);
      replacementValue = await evalCommandAsync(commandName);
    } else if (variableName.startsWith('${input:')) {
      // TODO: Needs UI to read inputs (aka a Wizard)
    } else {
      replacementValue = evalFileTemplateLevelVariable(context, variableName);
    }
  }
  return replacementValue ?? variableName;
}

async function evalCommandAsync(command: string): Promise<string | undefined> {
  try {
    const replacementValue = await vscode.commands.executeCommand(command);
    return replacementValue ? String(replacementValue) : undefined;
  } catch (e) {
    // TODO: output error message? show error dialog, fail process?
    return;
  }
}

// VSCode default variable reference:
//   https://github.com/Microsoft/vscode-docs/blob/main/docs/editor/variables-reference.md

// For reference, VS template parameters:
//  https://docs.microsoft.com/en-us/visualstudio/ide/template-parameters?view=vs-2022

function evalFileTemplateLevelVariable(context: FileEditContext, variable: string): string | undefined {
  switch (variable) {
    case '${file}':
      return context.target.toString();
    case '${fileBasename}':
      return vscodeUri.Utils.basename(context.target);
    case '${fileBasenameNoExtension}':
      return path.parse(vscodeUri.Utils.basename(context.target)).name;
    case '${fileExtname}':
      return path.parse(vscodeUri.Utils.basename(context.target)).ext;
    default:
      return evalTemplateLevelVariable(context, variable);
  }
}

function evalTemplateLevelVariable(context: TemplateEditContext, variable: string): string | undefined {
  switch (variable) {
    case '${itemName}':
      return context.itemName;
    case '${pathSeparator}':
      return path.sep;
    case '${workspaceFolder}':
      return context.workspace.uri.toString();
    case '${workspaceFolderBasename}':
      return context.workspace.name;
    default:
      return;
  }
}