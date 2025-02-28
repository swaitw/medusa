import { FormattingOptionsType } from "types"
import baseSectionsOptions from "../base-section-options.js"

const paymentProviderOptions: FormattingOptionsType = {
  "^payment_provider": {
    maxLevel: 2,
  },
  "^payment_provider/.*AbstractPaymentProvider": {
    reflectionDescription: `In this document, you’ll learn how to create a Payment Provider to be used with the Payment Module.`,
    frontmatterData: {
      slug: "/references/payment/provider",
    },
    reflectionTitle: {
      fullReplacement: "How to Create a Payment Provider",
    },
    shouldIncrementAfterStartSections: true,
    expandMembers: true,
    expandProperties: true,
    sections: {
      ...baseSectionsOptions,
      member_declaration_title: false,
      reflection_typeParameters: false,
    },
    startSections: [
      `## Understanding Payment Provider Implementation

The Payment Module Provider handles processing payment with a third-party provirder. However, it's not responsible for managing payment concepts within Medusa, such as payment sessions or collections. These concepts are handled by the Payment Module which uses your payment provider within core operations.

For example, when the merchant captures an order's payment, the Payment Module uses the payment provider to capture the payment, the makes updates to the \`Payment\` record associated with the order. So, you only have to implement the third-party payment processing logic in your payment provider.
`,
      `## 1. Create Module Provider Directory

Start by creating a new directory for your module provider.

If you're creating the module provider in a Medusa application, create it under the \`src/modules\` directory. For example, \`src/modules/my-payment\`.

If you're creating the module provider in a plugin, create it under the \`src/providers\` directory. For example, \`src/providers/my-payment\`.

<Note>

The rest of this guide always uses the \`src/modules/my-payment\` directory as an example.

</Note>`,
      `## 2. Create the Payment Provider Service

Create the file \`src/modules/my-payment/service.ts\` that holds the module's main service. It must extend the \`AbstractPaymentProvider\` class imported from \`@medusajs/framework/utils\`:

\`\`\`ts title="src/modules/my-payment/service.ts"
import { AbstractPaymentProvider } from "@medusajs/framework/utils"

type Options = {
  apiKey: string
}

class MyPaymentProviderService extends AbstractPaymentProvider<
  Options
> {
  // TODO implement methods
}

export default MyPaymentProviderService
\`\`\``,
    ],
    endSections: [
      `## 3. Create Module Definition File

Create the file \`src/modules/my-payment/index.ts\` with the following content:

\`\`\`ts title="src/modules/my-payment/index.ts"
import MyPaymentProviderService from "./service"
import { 
  ModuleProvider, 
  Modules
} from "@medusajs/framework/utils"

export default ModuleProvider(Modules.PAYMENT, {
  services: [MyPaymentProviderService],
})
\`\`\`

This exports the module's definition, indicating that the \`MyPaymentProviderService\` is the module's service.`,
      `## 4. Use Module

To use your Payment Module Provider, add it to the \`providers\` array of the Payment Module in \`medusa-config.ts\`:

\`\`\`ts title="medusa-config.ts"
module.exports = defineConfig({
  // ...
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            // if module provider is in a plugin, use \`plugin-name/providers/my-payment\`
            resolve: "./src/modules/my-payment",
            id: "my-payment",
            options: {
              // provider options...
              apiKey: "..."
            }
          }
        ]
      }
    }
  ]
})
\`\`\`
`,
      `## 5. Test it Out

Before you use your payment provider, enable it in a region using the Medusa Admin.

Then, go through checkout to place an order. Your payment provider is used to authorize the payment.
`,
      `## Useful Guides

- [Storefront Guide: how to implement UI for your payment provider during checkout](https://docs.medusajs.com/resources/storefront-development/checkout/payment)
`,
    ],
  },
}

export default paymentProviderOptions
