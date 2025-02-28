import Handlebars from "handlebars"
import { DeclarationReflection, SignatureReflection } from "typedoc"
import { getReflectionTypeFakeValueStr, getWorkflowInputType } from "utils"
import beautifyCode from "../../utils/beautify-code.js"

export default function () {
  Handlebars.registerHelper(
    "workflowExamples",
    function (this: SignatureReflection): string {
      const workflowReflection = this.parent
      const exampleStr: string[] = []

      const exampleTags = workflowReflection.comment?.blockTags.filter(
        (tag) => tag.tag === "@example"
      )

      if (!exampleTags?.length) {
        exampleStr.push(
          getExecutionCodeTabs({
            exampleCode: generateWorkflowExample(workflowReflection),
            workflowName: workflowReflection.name,
          })
        )
      } else {
        exampleTags.forEach((exampleTag) => {
          exampleTag.content.forEach((part) => {
            if (
              part.kind !== "code" ||
              part.text.startsWith("```ts workflow={false}")
            ) {
              exampleStr.push(part.text)
              return
            }

            exampleStr.push(
              getExecutionCodeTabs({
                exampleCode: part.text,
                workflowName: workflowReflection.name,
              })
            )
          })
        })
      }

      return `${Handlebars.helpers.titleLevel()} Examples\n\n${exampleStr.join(
        "\n"
      )}`
    }
  )
}

function getExecutionCodeTabs({
  exampleCode,
  workflowName,
}: {
  exampleCode: string
  workflowName: string
}): string {
  exampleCode = exampleCode.replace("```ts\n", "").replace("\n```", "")

  return `<CodeTabs group="workflow-exection">
    <CodeTab label="API Route" value="api-route">
    
\`\`\`ts title="src/api/workflow/route.ts"
${beautifyCode(`import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ${workflowName} } from "@medusajs/medusa/core-flows"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  ${exampleCode.replace("container", "req.scope")}

  res.send(result)
}
`)}
\`\`\`

    </CodeTab>
    <CodeTab label="Subscriber" value="subscriber">
    
\`\`\`ts title="src/subscribers/order-placed.ts"
${beautifyCode(`import {
  type SubscriberConfig,
  type SubscriberArgs,
} from "@medusajs/framework"
import { ${workflowName} } from "@medusajs/medusa/core-flows"

export default async function handleOrderPlaced({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  ${exampleCode}

  console.log(result)
}

export const config: SubscriberConfig = {
  event: "order.placed",
}`)}
\`\`\`

    </CodeTab>
    <CodeTab label="Scheduled Job" value="scheduled-job">
    
\`\`\`ts title="src/jobs/message-daily.ts"
${beautifyCode(`import { MedusaContainer } from "@medusajs/framework/types"
import { ${workflowName} } from "@medusajs/medusa/core-flows"

export default async function myCustomJob(
  container: MedusaContainer
) {
  ${exampleCode}

  console.log(result)
}

export const config = {
  name: "run-once-a-day",
  schedule: "0 0 * * *",
}`)}
\`\`\`

    </CodeTab>
    <CodeTab label="Another Workflow" value="another-workflow">
    
\`\`\`ts title="src/workflows/my-workflow.ts"
${beautifyCode(`import { createWorkflow } from "@medusajs/framework/workflows-sdk"
import { ${workflowName} } from "@medusajs/medusa/core-flows"

const myWorkflow = createWorkflow(
  "my-workflow",
  () => {
    ${exampleCode
      .replace(`{ result }`, "result")
      .replace(`await `, "")
      .replace(`(container)`, "")
      .replace(".run(", ".runAsStep(")}
  }
)`)}
\`\`\`

    </CodeTab>
  </CodeTabs>`
}

function generateWorkflowExample(
  workflowReflection: DeclarationReflection
): string {
  if (!workflowReflection.signatures?.length) {
    return ""
  }
  const inputType = getWorkflowInputType(workflowReflection.signatures[0])
  const inputStr = inputType
    ? `{\n\t\tinput: ${getReflectionTypeFakeValueStr({
        reflectionType: inputType,
        name: "",
      })}\n\t}`
    : ""

  // generate example
  return `const { result } = await ${workflowReflection.name}(container)\n\t.run(${inputStr})`
}
