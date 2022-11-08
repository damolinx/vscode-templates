# `Templates` extension

`Templates` is a VSCode extension that provides functionality to add items to a workspace using a template as source. A single template can include multiple files, and [variables](#variables-reference) can be used to customize their target name and content.

Note that the extension itself does not currently provide any templates, they either need to be defined in the [workspace](#workspace) or provided by another [extension](#using-an-extension).

# Defining new templates
The extension will look for your template manifest under the current user's home directory, or the current workspace.  In both cases, it is loaded by default from the `./templates/templates.json` path but this can be configured from the extension's settings.
The template manifest must follow the [Template Manifest](#template-manifest) schema. All paths referenced from the manifest will be resolved relative to the specific manifest's parent folder.

### Example
Defining a HTML+JavaScript template requires the following `templates.json`:

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
If your manifest is at the default location, `page.html` would be expected to exist at this path `./templates/html/page.html`. Similarly, `page.js` should exist at this path `./templates/html/page.js`.

## Programmatic Template Registration
The following commands are exposed by the extension for programmatic registration of templates: 

- `template.registerTemplate`: registers one template at a time. The command takes two arguments:
  - `id`: unique identifier for a given template
  - `template`: a JSON `string` representation of a [Template](#template) schema. Relative paths will be resolved against the current workspace root.

-  `template.registerTemplate`: unregisters a template by `id`.

# Adding a new item from a template
1. From the context menu on any folder, use the `New item from template…` action to start the wizard.
    - Alternatively, you can access from the `File/New File…` menu. Due to [VSCode#3553](https://github.com/Microsoft/vscode/issues/3553), this always adds items to the root of the workspace.

    ![image](https://user-images.githubusercontent.com/38414719/155912187-ebffe7f2-c7dd-4626-b266-1f08b9a6e113.png)


2. Select the template you want to instantiate from the drop down.

    ![image](https://user-images.githubusercontent.com/38414719/155913124-7012a0bd-13f3-484e-932c-cdfeb1da7b95.png)

3. Finally, provide a name for your new item.

    ![image](https://user-images.githubusercontent.com/38414719/155913242-8476fb85-e916-40f4-ae04-434ef4341efe.png)

4. And you are done!
    ![image](https://user-images.githubusercontent.com/38414719/155915384-1f5fc5fc-ae5a-4c01-83ba-18d26f8f8306.png)

Even thouhgt multiple files might be created, they are all part of single undoable transaction. If there are any conflicts when adding your items (e.g. a target files already exists), VSCode's [Refactor Preview](https://code.visualstudio.com/updates/v1_42#_rename-preview) will be presented to help you resolve the issues.

# Schemas
This extension consumes JSON files that conform to the following schemas: 

## Template Manifest
The template manifest is normally used  by the `templates.json` file that is added to the workspace to describe all available templates.  It supports the following properties:
- `templates` - array of [Template](#template) objects.

### Template
Describes one template. It supports the following properties:
- `createFolder` (`boolean`, optional, default: `false`) - create a `$itemName` folder to place all items under. 
- `defaultItemName` (`string`, optional) - item name suggestion used by the wizard. 
- `description` (`string`, optional) - template description as displayed in the template selection drop down.
- `files` (`array`, required) - list of [file templates](#file-template).
- `location` (`string`, required) - template `files` parent folder. 
- `name` (`string`, required) - template name as displayed in the template selection drop down.

### File Template
A file template entry. It supports the following properties:
- `source` (`string`, required) - Template-manifest relative path to a file template. 
- `target` (`string`, optional) - Target-folder relative path. If missing, 'source' is used.

# Replacement Variables
Extension supports variable substitution in files as well as their target file names. Predefined variables include a subset of those provide by VSCode ([documentation](https://code.visualstudio.com/docs/editor/variables-reference)), with their meaning adapted to current context.

## General Use Variables
These variables can be used to define target file names as well as target file contents: 
- **${itemName}** - target name for template as provided by user. 
- **${pathSeparator}** - character used to separate path components.
- **${workspaceFolder}** - full path to workspace folder on which the template is being added.
- **${workspaceFolderBasename}** - name of the workspace on which the template is being added. 

## File-template Use Variables
These variables can only be used to define target file contents:
- **${file}** - current target file full path.
- **${fileBasename}** - current target file name.
- **${fileBasenameNoExtension}** - current target file name without extension.
- **${fileExtname}** - current target file extension. 

VSCode's [command variables](https://code.visualstudio.com/docs/editor/variables-reference#_command-variables) are supported.
