/**
 * File template descriptor.
 */
export interface FileTemplate {
  /**
   * Template-manifest relative path to a file template.
   */
  readonly source: string;

  /**
   * Target-folder relative path. If missing, 'source' is used.
   */
  readonly target?: string;
}

/**
 * Template descriptor.
 */
export interface Template {
  /**
   * Create folder. Defaults to `false`.
   */
  readonly createFolder?: boolean;

  /**
   * Default item name.
   */
  readonly defaultItemName?: string;

  /**
   * Template description. This is displayed in the template selection UI.
   */
  readonly description?: string;

  /**
   * File templates to add.
   */
  readonly files: ReadonlyArray<FileTemplate>;

  /**
   * Template location. This is relative to parent {@link TemplateManifest}.
   */
  readonly location: string;

  /**
   * Template name. This is displayed in the template selection UI.
   */
  readonly name: string;
}

/**
 * Templates Manifest.
 */
export interface TemplatesManifest {
  /**
   * List of available templates.
   */
  readonly templates: ReadonlyArray<Template>;
}