"use client"

import { BarsThree, Book, SidebarLeft, TimelineVertical } from "@medusajs/icons"
import React, { useMemo, useRef, useState } from "react"
import {
  Button,
  getOsShortcut,
  Menu,
  useClickOutside,
  useSidebar,
} from "../../.."
import clsx from "clsx"
import { HouseIcon } from "../../Icons/House"
import { MainNavThemeMenu } from "./ThemeMenu"
import { MenuItem } from "types"

export const MainNavDesktopMenu = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { setDesktopSidebarOpen, isSidebarShown, desktopSidebarOpen } =
    useSidebar()
  const ref = useRef<HTMLDivElement>(null)

  useClickOutside({
    elmRef: ref,
    onClickOutside: () => setIsOpen(false),
  })

  const items: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = [
      {
        type: "link",
        icon: <HouseIcon />,
        title: "Homepage",
        link: "https://medusajs.com",
      },
      {
        type: "link",
        icon: <Book />,
        title: "Medusa v1",
        link: "https://docs.medusajs.com/v1",
      },
      {
        type: "link",
        icon: <TimelineVertical />,
        title: "Changelog",
        link: "https://medusajs.com/changelog",
      },
    ]

    if (isSidebarShown) {
      items.push(
        {
          type: "divider",
        },
        {
          type: "action",
          title: desktopSidebarOpen ? "Hide Sidebar" : "Show Sidebar",
          icon: <SidebarLeft />,
          shortcut: `${getOsShortcut()}\\`,
          action: () => {
            setDesktopSidebarOpen((prev) => !prev)
            setIsOpen(false)
          },
        }
      )
    }

    items.push(
      {
        type: "divider",
      },
      {
        type: "custom",
        content: <MainNavThemeMenu />,
      }
    )

    return items
  }, [isSidebarShown, desktopSidebarOpen])

  return (
    <div
      className="relative hidden lg:flex justify-center items-center"
      ref={ref}
    >
      <Button
        variant="transparent"
        onClick={() => setIsOpen((prev) => !prev)}
        className="!p-[6.5px]"
      >
        <BarsThree className="text-medusa-fg-subtle" />
      </Button>
      <Menu
        className={clsx(
          "absolute top-[calc(100%+8px)] right-0 min-w-[200px]",
          !isOpen && "hidden"
        )}
        items={items}
      />
    </div>
  )
}
