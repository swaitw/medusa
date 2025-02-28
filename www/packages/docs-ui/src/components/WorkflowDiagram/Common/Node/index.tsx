"use client"

import { Text } from "@medusajs/ui"
import clsx from "clsx"
import Link from "next/link"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { WorkflowStepUi } from "types"
import { InlineCode, MarkdownContent, Tooltip } from "../../.."
import { Bolt, InformationCircle } from "@medusajs/icons"
import { getBrowser } from "../../../../utils"

export type WorkflowDiagramNodeProps = {
  step: WorkflowStepUi
}

export const WorkflowDiagramStepNode = ({ step }: WorkflowDiagramNodeProps) => {
  const stepId = step.name.split(".").pop()
  const [offset, setOffset] = useState<number | undefined>(undefined)
  const ref = useRef<HTMLSpanElement>(null)

  const description = useMemo(() => {
    return step.description?.replaceAll(/:::[a-z]*/g, "") || ""
  }, [step.description])

  useEffect(() => {
    if (!ref.current) {
      return
    }

    // find parent
    const diagramParent = ref.current.closest(".workflow-list-diagram")
    const nodeParent = ref.current.closest(".workflow-node-group")

    if (!diagramParent || !nodeParent) {
      return
    }

    const firstChild = nodeParent.firstChild as HTMLElement

    const nodeBoundingRect = nodeParent.getBoundingClientRect()
    const diagramBoundingRect = diagramParent.getBoundingClientRect()
    const browser = getBrowser()

    if (browser === "Safari") {
      // React Tooltip has a bug in Safari where the offset is not calculated correctly
      // when place is set.
      const firstChildBoundingRect = firstChild.getBoundingClientRect()
      setOffset(diagramBoundingRect.width - firstChildBoundingRect.width + 20)
    } else {
      setOffset(
        Math.max(diagramBoundingRect.width - nodeBoundingRect.width + 10, 10)
      )
    }
  }, [ref.current])

  return (
    <Tooltip
      tooltipClassName="!text-left max-w-[300px] text-pretty overflow-scroll"
      tooltipChildren={
        <>
          <h4 className="text-compact-x-small-plus">{step.name}</h4>
          {step.when && (
            <span className="block py-docs_0.25">
              Runs only if a <InlineCode>when</InlineCode> condition is
              satisfied.
            </span>
          )}
          {description && (
            <MarkdownContent
              allowedElements={["a", "strong", "code"]}
              unwrapDisallowed={true}
            >
              {description}
            </MarkdownContent>
          )}
        </>
      }
      clickable={true}
      place="right"
      offset={offset}
      ref={ref}
    >
      <Link
        href={step.link || `#${step.name}`}
        className="focus-visible:shadow-borders-focus transition-fg rounded-docs_sm outline-none"
      >
        <div
          className={clsx(
            "shadow-borders-base flex w-fit bg-medusa-bg-base",
            "items-center rounded-docs_sm py-docs_0.125 px-docs_0.5",
            (step.type === "hook" || step.when) && "gap-x-docs_0.125"
          )}
          data-step-id={step.name}
        >
          {step.type === "hook" && (
            <div className="flex size-[20px] items-center justify-center text-medusa-tag-orange-icon">
              <Bolt />
            </div>
          )}
          {step.when && (
            <div className="flex size-[20px] items-center justify-center text-medusa-tag-green-icon">
              <InformationCircle />
            </div>
          )}
          <Text
            size="xsmall"
            leading="compact"
            weight="plus"
            className="select-none"
          >
            {stepId}
          </Text>
        </div>
      </Link>
    </Tooltip>
  )
}
