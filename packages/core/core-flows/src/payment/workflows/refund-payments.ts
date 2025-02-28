import { BigNumberInput, PaymentDTO } from "@medusajs/framework/types"
import { MathBN, MedusaError } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  transform,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "../../common"
import { addOrderTransactionStep } from "../../order"
import { refundPaymentsStep } from "../steps/refund-payments"

/**
 * The data to validate whether the refund is valid for the payment.
 */
export type ValidatePaymentsRefundStepInput = {
  /**
   * The payment details.
   */
  payments: PaymentDTO[]
  /**
   * The payments to refund.
   */
  input: RefundPaymentsWorkflowInput
}

/**
 * This step validates that the refund is valid for the payment.
 * If the payment's refundable amount is less than the amount to be refunded,
 * the step throws an error.
 * 
 * :::note
 * 
 * You can retrieve a payment's details using [Query](https://docs.medusajs.com/learn/fundamentals/module-links/query),
 * or [useQueryGraphStep](https://docs.medusajs.com/resources/references/medusa-workflows/steps/useQueryGraphStep).
 * 
 * :::
 * 
 * @example
 * const data = validatePaymentsRefundStep({
 *   payment: [{
 *     id: "payment_123",
 *     // other payment details...
 *   }],
 *   input: [
 *     {
 *       payment_id: "payment_123",
 *       amount: 10,
 *     }
 *   ]
 * })
 */
export const validatePaymentsRefundStep = createStep(
  "validate-payments-refund-step",
  async function ({
    payments,
    input,
  }: ValidatePaymentsRefundStepInput) {
    const paymentIdAmountMap = new Map<string, BigNumberInput>(
      input.map(({ payment_id, amount }) => [payment_id, amount])
    )

    for (const payment of payments) {
      const capturedAmount = (payment.captures || []).reduce(
        (acc, capture) => MathBN.sum(acc, capture.amount),
        MathBN.convert(0)
      )

      const refundedAmount = (payment.refunds || []).reduce(
        (acc, capture) => MathBN.sum(acc, capture.amount),
        MathBN.convert(0)
      )

      const refundableAmount = MathBN.sub(capturedAmount, refundedAmount)
      const amountToRefund = paymentIdAmountMap.get(payment.id)!

      if (MathBN.gt(amountToRefund, refundableAmount)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Payment with id ${payment.id} is trying to refund amount greater than the refundable amount`
        )
      }
    }
  }
)

/**
 * The data to refund a payment.
 */
export type RefundPaymentsWorkflowInput = {
  /**
   * The ID of the payment to refund.
   */
  payment_id: string
  /**
   * The amount to refund. Must be less than the refundable amount of the payment.
   */
  amount: BigNumberInput
  /**
   * The ID of the user that's refunding the payment.
   */
  created_by?: string
}[]

export const refundPaymentsWorkflowId = "refund-payments-workflow"
/**
 * This workflow refunds payments.
 * 
 * You can use this workflow within your customizations or your own custom workflows, allowing you to
 * refund payments in your custom flow.
 * 
 * @example
 * const { result } = await refundPaymentsWorkflow(container)
 * .run({
 *   input: [
 *     {
 *       payment_id: "pay_123",
 *       amount: 10,
 *     }
 *   ]
 * })
 * 
 * @summary
 * 
 * Refund one or more payments.
 */
export const refundPaymentsWorkflow = createWorkflow(
  refundPaymentsWorkflowId,
  (input: WorkflowData<RefundPaymentsWorkflowInput>) => {
    const paymentIds = transform({ input }, ({ input }) =>
      input.map((paymentInput) => paymentInput.payment_id)
    )

    const paymentsQuery = useQueryGraphStep({
      entity: "payments",
      fields: [
        "id",
        "currency_code",
        "refunds.id",
        "refunds.amount",
        "captures.id",
        "captures.amount",
        "payment_collection.order.id",
        "payment_collection.order.currency_code",
      ],
      filters: { id: paymentIds },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-cart" })

    const payments = transform(
      { paymentsQuery },
      ({ paymentsQuery }) => paymentsQuery.data
    )

    validatePaymentsRefundStep({ payments, input })

    const refundedPayments = refundPaymentsStep(input)

    const orderTransactionData = transform(
      { payments, input },
      ({ payments, input }) => {
        const paymentsMap: Record<
          string,
          PaymentDTO & {
            payment_collection: { order: { id: string; currency_code: string } }
          }
        > = {}

        for (const payment of payments) {
          paymentsMap[payment.id] = payment
        }

        return input.map((paymentInput) => {
          const payment = paymentsMap[paymentInput.payment_id]!
          const order = payment.payment_collection.order

          return {
            order_id: order.id,
            amount: MathBN.mult(paymentInput.amount, -1),
            currency_code: payment.currency_code,
            reference_id: payment.id,
            reference: "refund",
          }
        })
      }
    )

    addOrderTransactionStep(orderTransactionData)

    return new WorkflowResponse(refundedPayments)
  }
)
