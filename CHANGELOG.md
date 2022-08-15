# Change Log

# Preview
## 0.0.3
- Add support for templates to be defined from user home directory.
  - For now, expected path is default `./templates/templates.json` OR value of `templates.manifestPath` setting.
- Add error dialog to help with debugging (temporarily until a logger is in place).

## 0.0.2
- Fix: template manifest not detected.
- Add `New item from template …` to `File/New File …` command, and enable it on the Command-Palette.
  - Due to [VSCode#3553](https://github.com/Microsoft/vscode/issues/3553): 
    - Only supported when a single workspace folder is open.
    - Always adds items to the root folder. 
## 0.0.1
- Initial commit. Extension is, and will be maintaned, in usable state on every check-in.
- Commands:
  - `New item from template …`: added on the context menu for folders.
  - `templates.registerTemplate` and `templates.unregisterTemplate` are commands other extensions can use to register their own templates.
- Initial version of the `templates.json` schema.
  