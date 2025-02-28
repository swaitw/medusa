import { Modules } from "@medusajs/framework/utils"
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep, useRemoteQueryStep } from "../../common"
import { createPaymentCollectionsStep } from "../../cart"

/**
 * The details of the payment collection to create.
 */
export type CreateOrderPaymentCollectionWorkflowInput = {
  /**
   * The id of the order for which to create a payment collection.
   */
  order_id: string
  /**
   * The amount of the payment collection.
   */
  amount: number
}

export const createOrderPaymentCollectionWorkflowId =
  "create-order-payment-collection"
/**
 * This workflow creates a payment collection for an order. It's used by the
 * [Create Payment Collection Admin API Route](https://docs.medusajs.com/api/admin#payment-collections_postpaymentcollections).
 * 
 * You can use this workflow within your customizations or your own custom workflows, allowing you to wrap custom logic around
 * creating a payment collection for an order.
 * 
 * @example
 * const { result } = await createOrderPaymentCollectionWorkflow(container)
 * .run({
 *   input: {
 *     order_id: "order_123",
 *     amount: 10,
 *   }
 * })
 * 
 * @summary
 * 
 * Create a payment collection for an order.
 */
export const createOrderPaymentCollectionWorkflow = createWorkflow(
  createOrderPaymentCollectionWorkflowId,
  (
    input: WorkflowData<CreateOrderPaymentCollectionWorkflowInput>
  ) => {
    const order = useRemoteQueryStep({
      entry_point: "order",
      fields: ["id", "summary", "currency_code", "region_id"],
      variables: { id: input.order_id },
      throw_if_key_not_found: true,
      list: false,
    })

    const paymentCollectionData = transform(
      { order, input },
      ({ order, input }) => {
        return {
          currency_code: order.currency_code,
          amount: input.amount,
        }
      }
    )

    const createdPaymentCollections = createPaymentCollectionsStep([
      paymentCollectionData,
    ])

    const orderPaymentCollectionLink = transform(
      { order, createdPaymentCollections },
      ({ order, createdPaymentCollections }) => {
        return [
          {
            [Modules.ORDER]: { order_id: order.id },
            [Modules.PAYMENT]: {
              payment_collection_id: createdPaymentCollections[0].id,
            },
          },
        ]
      }
    )

    createRemoteLinkStep(orderPaymentCollectionLink).config({
      name: "order-payment-collection-link",
    })

    return new WorkflowResponse(createdPaymentCollections)
  }
)
