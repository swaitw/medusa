import {
  OrderChangeDTO,
  OrderDTO,
  OrderWorkflow,
} from "@medusajs/framework/types"
import {
  WorkflowData,
  WorkflowResponse,
  createStep,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { useRemoteQueryStep } from "../../../common"
import { createOrderChangeStep } from "../../steps/create-order-change"
import { throwIfOrderIsCancelled } from "../../utils/order-validation"

/**
 * The data to validate that an order-edit can be requested for an order.
 */
export type BeginOrderEditValidationStepInput = {
  /**
   * The order's details.
   */
  order: OrderDTO
}

/**
 * This step validates that an order-edit can be requested for an order.
 * If the order is canceled, the step will throw an error.
 * 
 * :::note
 * 
 * You can retrieve an order's details using [Query](https://docs.medusajs.com/learn/fundamentals/module-links/query),
 * or [useQueryGraphStep](https://docs.medusajs.com/resources/references/medusa-workflows/steps/useQueryGraphStep).
 * 
 * :::
 * 
 * @example
 * const data = beginOrderEditValidationStep({
 *   order: {
 *     id: "order_123",
 *     // other order details...
 *   }
 * })
 */
export const beginOrderEditValidationStep = createStep(
  "begin-order-edit-validation",
  async function ({ order }: BeginOrderEditValidationStepInput) {
    throwIfOrderIsCancelled({ order })
  }
)

export const beginOrderEditOrderWorkflowId = "begin-order-edit-order"
/**
 * This workflow creates an order edit request. It' used by the
 * [Create Order Edit Admin API Route](https://docs.medusajs.com/api/admin#order-edits_postorderedits).
 * 
 * To request the order edit, use the {@link requestOrderEditRequestWorkflow}. The order edit is then only applied after the 
 * order edit is confirmed using the {@link confirmOrderEditRequestWorkflow}.
 * 
 * You can use this workflow within your customizations or your own custom workflows, allowing you to create an order edit
 * for an order in your custom flows.
 * 
 * @example
 * const { result } = await beginOrderEditOrderWorkflow(container)
 * .run({
 *   input: {
 *     order_id: "order_123",
 *   }
 * })
 * 
 * @summary
 * 
 * Create an order edit request.
 */
export const beginOrderEditOrderWorkflow = createWorkflow(
  beginOrderEditOrderWorkflowId,
  function (
    input: WorkflowData<OrderWorkflow.BeginorderEditWorkflowInput>
  ): WorkflowResponse<OrderChangeDTO> {
    const order: OrderDTO = useRemoteQueryStep({
      entry_point: "orders",
      fields: ["id", "status"],
      variables: { id: input.order_id },
      list: false,
      throw_if_key_not_found: true,
    })

    beginOrderEditValidationStep({ order })

    const orderChangeInput = transform({ input }, ({ input }) => {
      return {
        change_type: "edit" as const,
        order_id: input.order_id,
        created_by: input.created_by,
        description: input.description,
        internal_note: input.internal_note,
      }
    })
    return new WorkflowResponse(createOrderChangeStep(orderChangeInput))
  }
)
