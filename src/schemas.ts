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
   * Template location, relative to parent {@link TemplateManifest} or {@link workspace}.
   */
  readonly location: string;

  /**
 * Template name.
 */
  readonly name: string;

  /**
   * Template description.
   */
  readonly description?: string;

  /**
   * List of files to add.
   */
  readonly files: ReadonlyArray<FileTemplate>;

  /**
 * Default item name.
 */
  readonly defaultItemName?: string;
}

/**
 * Template Manifest.
 */
export interface TemplatesManifest {
  /**
   * List of available templates.
   */
  readonly templates: ReadonlyArray<Template>;
}