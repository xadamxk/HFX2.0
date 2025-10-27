export interface OptionsPageBuilderOptions {
  title?: string;
}

/**
 * Options Page Builder for Chrome Extension
 * Generates HTML for the React-based options interface
 */
export class OptionsPageBuilder {
  private options: OptionsPageBuilderOptions;

  constructor(options: OptionsPageBuilderOptions = {}) {
    this.options = {
      title: "HFX Settings",
      ...options,
    };
  }

  /**
   * Generate the complete options HTML for React
   */
  generateHTML(): string {
    return this.generateHTMLWithReact();
  }

  generateHTMLWithReact(reactSrc?: string, reactDomSrc?: string): string {
    // For production, we don't need external React scripts since they're bundled

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.options.title}</title>
    <link rel="stylesheet" href="options.css">
</head>
<body>
    <div id="root"></div>
    
    ${reactSrc ? `<script src="${reactSrc}"></script>` : ""}
    ${reactDomSrc ? `<script src="${reactDomSrc}"></script>` : ""}
    <script src="options-react.js"></script>
</body>
</html>`;
  }
}
