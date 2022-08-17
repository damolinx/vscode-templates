# `Templates` extension

`Templates` is a VSCode extension that provides functionality to add items to a workspace using a template as source. A single template can include multiple files, and [variables](#variables-reference) can be used to customize their target name and content.

Note that the extension itself does not currently provide any templates, they either need to be defined in the [workspace](#workspace) or provided by another [extension](#using-an-extension).

# Defining new templates
You need to create a JSON file that follows the [Template Manifest](#template-manifest) schema. Two locations are supported, the Wokrspace folder or the current user home directory. In both cases, the manifest file is loaded by default from the `./templates/template.json` path but you can control this using the `templates.manifestPath` preference. All paths referenced from the manifest will be resolved relative to the manifest's parent folder.

### Example
To add a simple HTML+JavaScript template, your manifest will look like this:

```json
 {
    "templates": [
        {
            "name": "HTML Page",
            "description": "Create a HTML page with associated JavaScript file.",
            "createFolder": true,
            "defaultItemName": "mypage",
            "location": "html/",
            "files": [
                {
                    "source": "page.html",
                    "target": "${itemName}.html"
                },
                {
                    "source": "page.js",
                    "target": "${itemName}.js"
                }
            ]
        }
    ]
}
```
If your manifest is at the expected default location, `page.html` would expected to have this path `./templates/html/page.html`, relative to your current workspace. Similar logic applies to `page.js`. 

## Using from an extension
The extension allows other extensions to register, or unregister, their own templates. This is achieved using VSCode two commands: 

- `template.registerTemplate` allows to register a single template (but you can call multiple times).The command takes two arguments:
  - `id`: unique identifier for a given template
  - `template`: a JSON `string` representation of a [Template](#template) schema. Use absolute paths for all template files, otherwise the will be resolved against the current workspace root.

-  `template.registerTemplate` allows to unregister a template by `id`.

# Adding a new item from template
Once you have defined your templates, using them to create items is straight forward: 
1. From the context menu on any folder, use the `New item from template …` to start the wizard.
![image](https://user-images.githubusercontent.com/38414719/155912187-ebffe7f2-c7dd-4626-b266-1f08b9a6e113.png)
    - Alternatively, you can access from the `File/New File…` menu. Due to [VSCode#3553](https://github.com/Microsoft/vscode/issues/3553), this always adds items to the root of the workspace.

2. Select the template you want to instantiate from the drop down.
![image](https://user-images.githubusercontent.com/38414719/155913124-7012a0bd-13f3-484e-932c-cdfeb1da7b95.png)

3. Finally, provide a name for your new item.
![image](https://user-images.githubusercontent.com/38414719/155913242-8476fb85-e916-40f4-ae04-434ef4341efe.png)

4. And done!
![image](https://user-images.githubusercontent.com/38414719/155915384-1f5fc5fc-ae5a-4c01-83ba-18d26f8f8306.png)

The result of adding a new item via a template is a single transaction that can be undone as such. 

If there are any filename conflicts when adding your items (e.g. one or more target files already exists), VSCode's [Refactor Preview](https://code.visualstudio.com/updates/v1_42#_rename-preview) will be use to show them and allow you to decide whether to apply (normally meaning you will override the target file).

# Schemas
This extension consumes JSON that conforms to the following schemas: 

## Template Manifest
The template manifest is normally used  by the `templates.json` file that is added to the workspace to describe all available templates.  It supports the following properties:
- `templates` - array of [Template](#template) objects.

## Template
Describes one template. It supports the following properties:
- `createFolder` (`boolean`, optional, default: `false`) - create a `$itemName` folder to place all items under. 
- `defaultItemName` (`string`, optional) - item name suggestion used by the wizard. 
- `description` (`string`, optional) - template description as displayed in the template selection drop down.
- `files` (`array`, required) - list of [file templates](#file-template).
- `location` (`string`, required) - template `files` parent folder. 
- `name` (`string`, required) - template name as displayed in the template selection drop down.

## File Template
A file template entry. It supports the following properties:
- `source` (`string`, required) - Template-manifest relative path to a file template. 
- `target` (`string`, optional) - Target-folder relative path. If missing, 'source' is used.

# Variables Reference
Extension supports variable substitution in files as well as their target file names. Predefined variables include a subset of those provide by VSCode ([documentation](https://code.visualstudio.com/docs/editor/variables-reference)), with their meaning adapted to current context.

## General use
These variables can be used to define target file names as well as target file contents: 
- **${itemName}** - target name for template as provided by user. 
- **${pathSeparator}** - character used to separate path components.
- **${workspaceFolder}** - full path to workspace folder on which the template is being added.
- **${workspaceFolderBasename}** - name of the workspace on which the template is being added. 

## File contents 
These variables can only be used to define target file contents:
- **${file}** - current target file full path.
- **${fileBasename}** - current target file name.
- **${fileBasenameNoExtension}** - current target file name without extension.
- **${fileExtname}** - current target file extension. 

VSCode's [command variables](https://code.visualstudio.com/docs/editor/variables-reference#_command-variables) are supported.
