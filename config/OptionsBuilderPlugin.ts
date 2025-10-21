import { Compiler, WebpackPluginInstance, sources, Compilation } from "webpack";
import { OptionsPageBuilder } from "../src/configuration/OptionsPageBuilder";

/**
 * Webpack plugin to build options HTML during build
 */
export class OptionsBuilderPlugin implements WebpackPluginInstance {
  private options: {
    title?: string;
  };

  constructor(
    options: {
      title?: string;
    } = {}
  ) {
    this.options = {
      title: "HFX Settings",
      ...options,
    };
  }

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap("OptionsBuilderPlugin", (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: "OptionsBuilderPlugin",
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        () => {
          try {
            console.log("Building options HTML...");

            // Create React HTML generator instance
            const generator = new OptionsPageBuilder(this.options);

            // Generate HTML
            const html = generator.generateHTML();

            // Add options.html to webpack assets
            compilation.assets["options.html"] = new sources.RawSource(html);

            console.log("Options HTML built successfully");
          } catch (error) {
            console.error("Error building options HTML:", error);
            throw error;
          }
        }
      );
    });
  }
}
