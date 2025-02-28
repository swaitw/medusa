import {
  FulfillmentDTO,
  OrderExchangeDTO,
  OrderWorkflow,
} from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import {
  WorkflowData,
  createStep,
  createWorkflow,
  parallelize,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"
import { useRemoteQueryStep } from "../../../common"
import { deleteReservationsByLineItemsStep } from "../../../reservation/steps/delete-reservations-by-line-items"
import { cancelOrderExchangeStep } from "../../steps"
import { throwIfIsCancelled } from "../../utils/order-validation"
import { cancelReturnWorkflow } from "../return/cancel-return"

/**
 * The data to validate that an exchange can be canceled.
 */
export type CancelExchangeValidateOrderStepInput = {
  /**
   * The order exchange's details.
   */
  orderExchange: OrderExchangeDTO
  /**
   * The details of canceling the exchange.
   */
  input: OrderWorkflow.CancelOrderExchangeWorkflowInput
}

/**
 * This step validates that an exchange can be canceled.
 * If the exchange is canceled, or any of the fulfillments are not canceled, the step will throw an error.
 * 
 * :::note
 * 
 * You can retrieve an order exchange's details using [Query](https://docs.medusajs.com/learn/fundamentals/module-links/query),
 * or [useQueryGraphStep](https://docs.medusajs.com/resources/references/medusa-workflows/steps/useQueryGraphStep).
 * 
 * :::
 * 
 * @example
 * const data = cancelExchangeValidateOrder({
 *   orderExchange: {
 *     id: "exchange_123",
 *     // other order exchange details...
 *   },
 *   input: {
 *     exchange_id: "exchange_123",
 *   }
 * })
 */
export const cancelExchangeValidateOrder = createStep(
  "validate-exchange",
  ({
    orderExchange,
  }: CancelExchangeValidateOrderStepInput) => {
    const orderExchange_ = orderExchange as OrderExchangeDTO & {
      fulfillments: FulfillmentDTO[]
    }

    throwIfIsCancelled(orderExchange, "Exchange")

    const throwErrorIf = (
      arr: unknown[],
      pred: (obj: any) => boolean,
      message: string
    ) => {
      if (arr?.some(pred)) {
        throw new MedusaError(MedusaError.Types.NOT_ALLOWED, message)
      }
    }

    const notCanceled = (o) => !o.canceled_at

    throwErrorIf(
      orderExchange_.fulfillments,
      notCanceled,
      "All fulfillments must be canceled before canceling am exchange"
    )
  }
)

export const cancelOrderExchangeWorkflowId = "cancel-exchange"
/**
 * This workflow cancels a confirmed exchange. It's used by the
 * [Cancel Exchange Admin API Route](https://docs.medusajs.com/api/admin#exchanges_postexchangesidcancel).
 * 
 * You can use this workflow within your customizations or your own custom workflows, allowing you to cancel an exchange
 * for an order in your custom flow.
 * 
 * @example
 * const { result } = await cancelOrderExchangeWorkflow(container)
 * .run({
 *   input: {
 *     exchange_id: "exchange_123",
 *   }
 * })
 * 
 * @summary
 * 
 * Cancel an exchange for an order.
 */
export const cancelOrderExchangeWorkflow = createWorkflow(
  cancelOrderExchangeWorkflowId,
  (
    input: WorkflowData<OrderWorkflow.CancelOrderExchangeWorkflowInput>
  ): WorkflowData<void> => {
    const orderExchange: OrderExchangeDTO & { fulfillments: FulfillmentDTO[] } =
      useRemoteQueryStep({
        entry_point: "order_exchange",
        fields: [
          "id",
          "order_id",
          "return_id",
          "canceled_at",
          "fulfillments.canceled_at",
          "additional_items.item_id",
        ],
        variables: { id: input.exchange_id },
        list: false,
        throw_if_key_not_found: true,
      })

    cancelExchangeValidateOrder({ orderExchange, input })

    const lineItemIds = transform({ orderExchange }, ({ orderExchange }) => {
      return orderExchange.additional_items?.map((i) => i.item_id)
    })

    parallelize(
      cancelOrderExchangeStep({
        exchange_id: orderExchange.id,
        order_id: orderExchange.order_id,
        canceled_by: input.canceled_by,
      }),
      deleteReservationsByLineItemsStep(lineItemIds)
    )

    when({ orderExchange }, ({ orderExchange }) => {
      return !!orderExchange.return_id
    }).then(() => {
      cancelReturnWorkflow.runAsStep({
        input: {
          return_id: orderExchange.return_id!,
          no_notification: input.no_notification,
        },
      })
    })
  }
)
