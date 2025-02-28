import { FormattingOptionsType } from "types"

const taxProviderOptions: FormattingOptionsType = {
  "^tax_provider/.*ITaxProvider": {
    reflectionGroups: {
      Properties: false,
    },
    reflectionDescription: `In this document, you’ll learn how to create a tax provider to use with the Tax Module, and the methods to implement.`,
    frontmatterData: {
      slug: "/references/tax/provider",
    },
    reflectionTitle: {
      fullReplacement: "How to Create a Tax Provider",
    },
    shouldIncrementAfterStartSections: true,
    expandMembers: true,
    expandProperties: true,
    startSections: [
      `## Overview

A tax provider is used to retrieve the tax lines in a provided context. The Tax Module provides a default \`system\` provider. You can create your own tax provider, either in a plugin, in a module provider, or directly in your Medusa application's codebase, then use it in any tax region.`,
      `## Understanding Tax Provider Implementation

The Tax Module Provider handles calculating taxes with a third-party provirder. However, it's not responsible for managing tax concepts within Medusa, such as creating a tax region. The Tax Module uses your tax provider within core operations.

For example, during checkout, the tax provider of the tax region that the customer is in is used to calculate the tax for the cart and order. So, you only have to implement the third-party tax calculation logic in your tax provider.`,
      `## 1. Create Module Provider Directory

Start by creating a new directory for your module provider.

If you're creating the module provider in a Medusa application, create it under the \`src/modules\` directory. For example, \`src/modules/my-tax\`.

If you're creating the module provider in a plugin, create it under the \`src/providers\` directory. For example, \`src/providers/my-tax\`.

<Note>

The rest of this guide always uses the \`src/modules/my-tax\` directory as an example.

</Note>`,
      `## 2. Create the Tax Provider Service

Create the file \`src/modules/my-tax/service.ts\` that holds the module's main service. It must extend the \`ITaxProvider\` class imported from \`@medusajs/framework/types\`:

\`\`\`ts title="src/modules/my-tax/service.ts"
import { ITaxProvider } from "@medusajs/framework/types"

export default class MyTaxProvider implements ITaxProvider {
  // TODO implement methods
}
\`\`\``,
    ],
    endSections: [
      `## 3. Create Module Definition File

Create the file \`src/modules/my-tax/index.ts\` with the following content:

\`\`\`ts title="src/modules/my-tax/index.ts"
import MyTaxProvider from "./service"
import { 
  ModuleProvider, 
  Modules
} from "@medusajs/framework/utils"

export default ModuleProvider(Modules.TAX, {
  services: [MyTaxProvider],
})
\`\`\`

This exports the module's definition, indicating that the \`MyTaxProvider\` is the module's service.`,
      `## 4. Use Module

To use your Tax Module Provider, add it to the \`providers\` array of the Tax Module in \`medusa-config.ts\`:

\`\`\`ts title="medusa-config.ts"
module.exports = defineConfig({
  // ...
  modules: [
    {
      resolve: "@medusajs/medusa/tax",
      options: {
        providers: [
          {
            // if module provider is in a plugin, use \`plugin-name/providers/my-tax\`
            resolve: "./src/modules/my-tax",
            id: "my-tax",
            options: {
              // provider options...
            },
          },
        ],
      },
    },
  ]
})
\`\`\`
`,
    ],
  },
}

export default taxProviderOptions
