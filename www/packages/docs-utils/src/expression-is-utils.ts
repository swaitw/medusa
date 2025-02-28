import { ExpressionJsVarLiteral, ExpressionJsVarObj } from "types"

export function isExpressionJsVarLiteral(
  expression: unknown
): expression is ExpressionJsVarLiteral {
  return (
    typeof expression === "object" &&
    expression !== null &&
    Object.hasOwn(expression, "original")
  )
}

export function isExpressionJsVarObj(
  expression: unknown
): expression is ExpressionJsVarObj {
  return (
    typeof expression === "object" &&
    expression !== null &&
    !Object.hasOwn(expression, "original")
  )
}
