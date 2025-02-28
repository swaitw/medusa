import { FormattingOptionsType } from "types"
import baseSectionsOptions from "../base-section-options.js"

const authProviderOptions: FormattingOptionsType = {
  "^auth_provider/.*AbstractAuthModuleProvider": {
    reflectionGroups: {
      Constructors: false,
    },
    reflectionDescription: `In this document, you’ll learn how to create an auth provider module and the methods you must implement in its main service.`,
    frontmatterData: {
      slug: "/references/auth/provider",
    },
    reflectionTitle: {
      fullReplacement: "How to Create an Auth Provider Module",
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
      `## 1. Create Module Provider Directory

Start by creating a new directory for your module provider.

If you're creating the module provider in a Medusa application, create it under the \`src/modules\` directory. For example, \`src/modules/my-auth\`.

If you're creating the module provider in a plugin, create it under the \`src/providers\` directory. For example, \`src/providers/my-auth\`.

<Note>

The rest of this guide always uses the \`src/modules/my-auth\` directory as an example.

</Note>`,
      `## 2. Create the Auth Provider Service

Create the file \`src/modules/my-auth/service.ts\` that holds the module's main service. It must extend the \`AbstractAuthModuleProvider\` class imported from \`@medusajs/framework/utils\`:

\`\`\`ts title="src/modules/my-auth/service.ts"
import { AbstractAuthModuleProvider } from "@medusajs/framework/utils"

class MyAuthProviderService extends AbstractAuthModuleProvider {
  // TODO implement methods
}

export default MyAuthProviderService
\`\`\``,
    ],
    endSections: [
      `## 3. Create Module Definition File

Create the file \`src/modules/my-auth/index.ts\` with the following content:

\`\`\`ts title="src/modules/my-auth/index.ts"
import MyAuthProviderService from "./service"
import { 
  ModuleProvider, 
  Modules
} from "@medusajs/framework/utils"

export default ModuleProvider(Modules.AUTH, {
  services: [MyAuthProviderService],
})
\`\`\`

This exports the module's definition, indicating that the \`MyAuthProviderService\` is the module's service.`,
      `## 4. Use Module

To use your Auth Module Provider, add it to the \`providers\` array of the Auth Module in \`medusa-config.ts\`:

\`\`\`ts title="medusa-config.ts"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

module.exports = defineConfig({
  // ...
  modules: [
    {
      resolve: "@medusajs/medusa/auth",
      options: {
        providers: [
          // default provider
          {
            resolve: "@medusajs/medusa/auth-emailpass",
            dependencies: [Modules.CACHE, ContainerRegistrationKeys.LOGGER],
            id: "emailpass",
          },
          {
            // if module provider is in a plugin, use \`plugin-name/providers/my-auth\`
            resolve: "./src/modules/my-auth",
            id: "my-auth",
            dependencies: [Modules.CACHE, ContainerRegistrationKeys.LOGGER],
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
      `## 5. Test it Out

To test out your authentication provider, use any of the [Authentication Routes](https://docs.medusajs.com/v2/resources/commerce-modules/auth/authentication-route), using your provider's ID as a path parameter.

For example, to get a registration token for an admin user, send a \`POST\` request to \`/auth/user/my-auth/register\` replacing \`my-auth\` with your authentication provider's ID:

\`\`\`bash
curl -X POST http://localhost:9000/auth/user/my-auth/register
-H 'Content-Type: application/json' \
--data-raw '{
  "email": "Whitney_Schultz@gmail.com",
  "password": "supersecret"
}'
\`\`\`

Change the request body to pass the data required for your authentication provider to register the user.

If registration is successful, the response will have a \`token\` property.
      `,
    ],
  },
}

export default authProviderOptions
