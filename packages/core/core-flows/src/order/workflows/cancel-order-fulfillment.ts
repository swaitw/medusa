import {
  AdditionalData,
  BigNumberInput,
  FulfillmentDTO,
  OrderDTO,
  OrderWorkflow,
} from "@medusajs/framework/types"
import {
  MedusaError,
  Modules,
  OrderWorkflowEvents,
} from "@medusajs/framework/utils"
import {
  WorkflowData,
  WorkflowResponse,
  createHook,
  createStep,
  createWorkflow,
  parallelize,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep, useRemoteQueryStep } from "../../common"
import { cancelFulfillmentWorkflow } from "../../fulfillment"
import { adjustInventoryLevelsStep } from "../../inventory"
import { cancelOrderFulfillmentStep } from "../steps/cancel-fulfillment"
import {
  throwIfItemsDoesNotExistsInOrder,
  throwIfOrderIsCancelled,
} from "../utils/order-validation"

/**
 * The data to validate the order fulfillment cancelation.
 */
export type CancelOrderFulfillmentValidateOrderStep = {
  /**
   * The order to cancel the fulfillment for.
   */
  order: OrderDTO & {
    /**
     * The order's fulfillments.
     */
    fulfillments: FulfillmentDTO[]
  }
  /**
   * The cancelation details.
   */
  input: OrderWorkflow.CancelOrderFulfillmentWorkflowInput
}

/**
 * This step validates that an order fulfillment can be canceled. If
 * the fulfillment doesn't exist, or it has already been shipped, the step throws an error.
 *
 * :::note
 *
 * You can retrieve an order and fulfillment details using [Query](https://docs.medusajs.com/learn/fundamentals/module-links/query),
 * or [useQueryGraphStep](https://docs.medusajs.com/resources/references/medusa-workflows/steps/useQueryGraphStep).
 *
 * :::
 *
 * @example
 * const data = cancelOrderFulfillmentValidateOrder({
 *   order: {
 *     id: "order_123",
 *     fulfillments: [
 *       {
 *         id: "ful_123",
 *         // other fulfillment details...
 *       }
 *     ]
 *     // other order details...
 *   },
 *   input: {
 *     order_id: "order_123",
 *     fulfillment_id: "ful_123"
 *   }
 * })
 */
export const cancelOrderFulfillmentValidateOrder = createStep(
  "cancel-fulfillment-validate-order",
  ({ order, input }: CancelOrderFulfillmentValidateOrderStep) => {
    throwIfOrderIsCancelled({ order })

    const fulfillment = order.fulfillments.find(
      (f) => f.id === input.fulfillment_id
    )
    if (!fulfillment) {
      throw new Error(
        `Fulfillment with id ${input.fulfillment_id} not found in the order`
      )
    }

    if (fulfillment.shipped_at) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `The fulfillment has already been shipped. Shipped fulfillments cannot be canceled`
      )
    }

    throwIfItemsDoesNotExistsInOrder({
      order,
      inputItems: fulfillment.items.map((i) => ({
        id: i.line_item_id as string,
        quantity: i.quantity,
      })),
    })
  }
)

function prepareCancelOrderFulfillmentData({
  order,
  fulfillment,
}: {
  order: OrderDTO
  fulfillment: FulfillmentDTO
}) {
  return {
    order_id: order.id,
    reference: Modules.FULFILLMENT,
    reference_id: fulfillment.id,
    items: fulfillment.items!.map((i) => {
      return {
        id: i.line_item_id as string,
        quantity: i.quantity,
      }
    }),
  }
}

function prepareInventoryUpdate({
  fulfillment,
}: {
  order: OrderDTO
  fulfillment: FulfillmentDTO
}) {
  const inventoryAdjustment: {
    inventory_item_id: string
    location_id: string
    adjustment: BigNumberInput
  }[] = []
  for (const item of fulfillment.items) {
    // if this is `null` this means that item is from variant that has `manage_inventory` false
    if (!item.inventory_item_id) {
      continue
    }

    inventoryAdjustment.push({
      inventory_item_id: item.inventory_item_id as string,
      location_id: fulfillment.location_id,
      adjustment: item.quantity,
    })
  }

  return {
    inventoryAdjustment,
  }
}

/**
 * The data to cancel an order's fulfillment, along with custom data that's passed to the workflow's hooks.
 */
export type CancelOrderFulfillmentWorkflowInput =
  OrderWorkflow.CancelOrderFulfillmentWorkflowInput & AdditionalData

export const cancelOrderFulfillmentWorkflowId = "cancel-order-fulfillment"
/**
 * This workflow cancels an order's fulfillment. It's used by the [Cancel Order's Fulfillment Admin API Route](https://docs.medusajs.com/api/admin#orders_postordersidfulfillmentsfulfillment_idcancel).
 *
 * This workflow has a hook that allows you to perform custom actions on the canceled fulfillment. For example, you can pass under `additional_data` custom data that
 * allows you to update custom data models linked to the fulfillment.
 *
 * You can also use this workflow within your customizations or your own custom workflows, allowing you to wrap custom logic around canceling a fulfillment.
 *
 * @example
 * const { result } = await cancelOrderFulfillmentWorkflow(container)
 * .run({
 *   input: {
 *     order_id: "order_123",
 *     fulfillment_id: "ful_123",
 *     additional_data: {
 *       reason: "Customer changed their mind"
 *     }
 *   }
 * })
 *
 * @summary
 *
 * Cancel an order's fulfillment.
 *
 * @property hooks.orderFulfillmentCanceled - This hook is executed after the fulfillment is canceled. You can consume this hook to perform custom actions on the canceled fulfillment.
 */
export const cancelOrderFulfillmentWorkflow = createWorkflow(
  cancelOrderFulfillmentWorkflowId,
  (input: WorkflowData<CancelOrderFulfillmentWorkflowInput>) => {
    const order: OrderDTO & { fulfillments: FulfillmentDTO[] } =
      useRemoteQueryStep({
        entry_point: "orders",
        fields: [
          "id",
          "status",
          "items.*",
          "fulfillments.*",
          "fulfillments.items.*",
        ],
        variables: { id: input.order_id },
        list: false,
        throw_if_key_not_found: true,
      })

    cancelOrderFulfillmentValidateOrder({ order, input })

    const fulfillment = transform({ input, order }, ({ input, order }) => {
      return order.fulfillments.find((f) => f.id === input.fulfillment_id)!
    })

    const cancelOrderFulfillmentData = transform(
      { order, fulfillment },
      prepareCancelOrderFulfillmentData
    )

    const { inventoryAdjustment } = transform(
      { order, fulfillment },
      prepareInventoryUpdate
    )

    const eventData = transform({ order, fulfillment, input }, (data) => {
      return {
        order_id: data.order.id,
        fulfillment_id: data.fulfillment.id,
        no_notification: data.input.no_notification,
      }
    })

    parallelize(
      cancelOrderFulfillmentStep(cancelOrderFulfillmentData),
      adjustInventoryLevelsStep(inventoryAdjustment),
      emitEventStep({
        eventName: OrderWorkflowEvents.FULFILLMENT_CANCELED,
        data: eventData,
      })
    )

    // last step because there is no compensation for this step
    cancelFulfillmentWorkflow.runAsStep({
      input: {
        id: input.fulfillment_id,
      },
    })

    const orderFulfillmentCanceled = createHook("orderFulfillmentCanceled", {
      fulfillment,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(void 0, {
      hooks: [orderFulfillmentCanceled],
    })
  }
)
