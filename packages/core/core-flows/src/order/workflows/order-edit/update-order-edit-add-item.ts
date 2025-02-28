import {
  OrderChangeActionDTO,
  OrderChangeDTO,
  OrderDTO,
  OrderPreviewDTO,
  OrderWorkflow,
} from "@medusajs/framework/types"
import { ChangeActionType, OrderChangeStatus } from "@medusajs/framework/utils"
import {
  WorkflowData,
  WorkflowResponse,
  createStep,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { useRemoteQueryStep } from "../../../common"
import {
  previewOrderChangeStep,
  updateOrderChangeActionsStep,
} from "../../steps"
import {
  throwIfIsCancelled,
  throwIfOrderChangeIsNotActive,
} from "../../utils/order-validation"

/**
 * The data to validate that a new item can be updated in an order edit.
 */
export type UpdateOrderEditAddItemValidationStepInput = {
  /**
   * The order's details.
   */
  order: OrderDTO
  /**
   * The order change's details.
   */
  orderChange: OrderChangeDTO
  /**
   * The details of the item to be updated.
   */
  input: OrderWorkflow.UpdateOrderEditAddNewItemWorkflowInput
}

/**
 * This step validates that a new item can be updated in an order edit.
 * If the order is canceled, the order change is not active, 
 * the item isn't in the order edit, or the action isn't adding an item,
 * the step will throw an error.
 * 
 * :::note
 * 
 * You can retrieve an order and order change details using [Query](https://docs.medusajs.com/learn/fundamentals/module-links/query),
 * or [useQueryGraphStep](https://docs.medusajs.com/resources/references/medusa-workflows/steps/useQueryGraphStep).
 * 
 * :::
 * 
 * @example
 * const data = updateOrderEditAddItemValidationStep({
 *   order: {
 *     id: "order_123",
 *     // other order details...
 *   },
 *   orderChange: {
 *     id: "orch_123",
 *     // other order change details...
 *   },
 *   input: {
 *     order_id: "order_123",
 *     action_id: "orchac_123",
 *     data: {
 *       quantity: 1,
 *     }
 *   }
 * })
 */
export const updateOrderEditAddItemValidationStep = createStep(
  "update-order-edit-add-item-validation",
  async function (
    {
      order,
      orderChange,
      input,
    }: UpdateOrderEditAddItemValidationStepInput,
    context
  ) {
    throwIfIsCancelled(order, "Order")
    throwIfOrderChangeIsNotActive({ orderChange })

    const associatedAction = (orderChange.actions ?? []).find(
      (a) => a.id === input.action_id
    ) as OrderChangeActionDTO

    if (!associatedAction) {
      throw new Error(
        `No request to add item for order ${input.order_id} in order change ${orderChange.id}`
      )
    } else if (associatedAction.action !== ChangeActionType.ITEM_ADD) {
      throw new Error(`Action ${associatedAction.id} is not adding an item`)
    }
  }
)

export const updateOrderEditAddItemWorkflowId = "update-order-edit-add-item"
/**
 * This workflow updates a new item in an order edit. It's used by the
 * [Update Item Admin API Route](https://docs.medusajs.com/api/admin#order-edits_postordereditsiditemsaction_id).
 * 
 * You can use this workflow within your customizations or your own custom workflows, allowing you to update a new item in an order edit
 * in your custom flows.
 * 
 * @example
 * const { result } = await updateOrderEditAddItemWorkflow(container)
 * .run({
 *   input: {
 *     order_id: "order_123",
 *     action_id: "orchac_123",
 *     data: {
 *       quantity: 1,
 *     }
 *   }
 * })
 * 
 * @summary
 * 
 * Update a new item in an order edit.
 */
export const updateOrderEditAddItemWorkflow = createWorkflow(
  updateOrderEditAddItemWorkflowId,
  function (
    input: WorkflowData<OrderWorkflow.UpdateOrderEditAddNewItemWorkflowInput>
  ): WorkflowResponse<OrderPreviewDTO> {
    const order: OrderDTO = useRemoteQueryStep({
      entry_point: "orders",
      fields: ["id", "status", "canceled_at", "items.*"],
      variables: { id: input.order_id },
      list: false,
      throw_if_key_not_found: true,
    }).config({ name: "order-query" })

    const orderChange: OrderChangeDTO = useRemoteQueryStep({
      entry_point: "order_change",
      fields: ["id", "status", "version", "actions.*"],
      variables: {
        filters: {
          order_id: input.order_id,
          status: [OrderChangeStatus.PENDING, OrderChangeStatus.REQUESTED],
        },
      },
      list: false,
    }).config({ name: "order-change-query" })

    updateOrderEditAddItemValidationStep({
      order,
      input,
      orderChange,
    })

    const updateData = transform(
      { orderChange, input },
      ({ input, orderChange }) => {
        const originalAction = (orderChange.actions ?? []).find(
          (a) => a.id === input.action_id
        ) as OrderChangeActionDTO

        const data = input.data
        return {
          id: input.action_id,
          details: {
            quantity: data.quantity ?? originalAction.details?.quantity,
            unit_price: data.unit_price ?? originalAction.details?.unit_price,
            compare_at_unit_price:
              data.compare_at_unit_price ??
              originalAction.details?.compare_at_unit_price,
          },
          internal_note: data.internal_note,
        }
      }
    )

    updateOrderChangeActionsStep([updateData])

    return new WorkflowResponse(previewOrderChangeStep(order.id))
  }
)
