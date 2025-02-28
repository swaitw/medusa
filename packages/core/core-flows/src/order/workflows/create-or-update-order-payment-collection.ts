import { PaymentCollectionDTO } from "@medusajs/framework/types"
import {
  MathBN,
  MedusaError,
  PaymentCollectionStatus,
} from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  when,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useRemoteQueryStep } from "../../common"
import { updatePaymentCollectionStep } from "../../payment-collection"
import { createOrderPaymentCollectionWorkflow } from "./create-order-payment-collection"

/**
 * The details of the order payment collection to create or update.
 */
export type CreateOrUpdateOrderPaymentCollectionInput = {
  /**
   * The order to create or update payment collection for.
   */
  order_id: string
  /**
   * The amount to charge. It can't be greater than the
   * pending amount of the order. The order's payment collection
   * will be created or updated with this amount.
   * If no amount is set, the payment collection's amount is set to `0`.
   */
  amount?: number
}

export const createOrUpdateOrderPaymentCollectionWorkflowId =
  "create-or-update-order-payment-collection"
/**
 * This workflow creates or updates payment collection for an order. It's used by other order-related workflows,
 * such as {@link createOrderPaymentCollectionWorkflow} to update an order's payment collections based on changes made to the order.
 * 
 * You can use this workflow within your customizations or your own custom workflows, allowing you to wrap custom logic around
 * creating or updating payment collections for an order.
 * 
 * @example
 * const { result } = await createOrUpdateOrderPaymentCollectionWorkflow(container)
 * .run({
 *   input: {
 *     order_id: "order_123",
 *     amount: 20
 *   }
 * })
 * 
 * @summary
 * 
 * Create or update payment collection for an order.
 */
export const createOrUpdateOrderPaymentCollectionWorkflow = createWorkflow(
  createOrUpdateOrderPaymentCollectionWorkflowId,
  (
    input: WorkflowData<{
      order_id: string
      amount?: number
    }>
  ) => {
    const order = useRemoteQueryStep({
      entry_point: "order",
      fields: ["id", "summary", "currency_code", "region_id"],
      variables: { id: input.order_id },
      throw_if_key_not_found: true,
      list: false,
    })

    const orderPaymentCollections = useRemoteQueryStep({
      entry_point: "order_payment_collection",
      fields: ["payment_collection_id"],
      variables: { order_id: order.id },
    }).config({ name: "order-payment-collection-query" })

    const orderPaymentCollectionIds = transform(
      { orderPaymentCollections },
      ({ orderPaymentCollections }) =>
        orderPaymentCollections.map((opc) => opc.payment_collection_id)
    )

    const existingPaymentCollection = useRemoteQueryStep({
      entry_point: "payment_collection",
      fields: ["id", "status"],
      variables: {
        filters: {
          id: orderPaymentCollectionIds,
          status: [PaymentCollectionStatus.NOT_PAID],
        },
      },
      list: false,
    }).config({ name: "payment-collection-query" })

    const amountPending = transform({ order, input }, ({ order, input }) => {
      const amountToCharge = input.amount ?? 0
      const amountPending =
        order.summary.raw_pending_difference ?? order.summary.pending_difference

      if (amountToCharge > 0 && MathBN.gt(amountToCharge, amountPending)) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Amount cannot be greater than ${amountPending}`
        )
      }

      return amountPending
    })

    const updatedPaymentCollections = when(
      { existingPaymentCollection, amountPending },
      ({ existingPaymentCollection, amountPending }) => {
        return !!existingPaymentCollection?.id && MathBN.gt(amountPending, 0)
      }
    ).then(() => {
      return updatePaymentCollectionStep({
        selector: { id: existingPaymentCollection.id },
        update: {
          amount: amountPending,
        },
      }) as PaymentCollectionDTO[]
    })

    const createdPaymentCollection = when(
      { existingPaymentCollection, amountPending },
      ({ existingPaymentCollection, amountPending }) => {
        return !!!existingPaymentCollection?.id && MathBN.gt(amountPending, 0)
      }
    ).then(() => {
      return createOrderPaymentCollectionWorkflow.runAsStep({
        input: {
          order_id: order.id,
          amount: amountPending,
        },
      }) as PaymentCollectionDTO[]
    })

    const paymentCollections = transform(
      { updatedPaymentCollections, createdPaymentCollection },
      ({ updatedPaymentCollections, createdPaymentCollection }) =>
        updatedPaymentCollections || createdPaymentCollection
    )

    return new WorkflowResponse(paymentCollections)
  }
)
