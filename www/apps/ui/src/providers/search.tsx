"use client"

import { SearchProvider as UiSearchProvider, searchFilters } from "docs-ui"
import { absoluteUrl } from "../lib/absolute-url"

type SearchProviderProps = {
  children: React.ReactNode
}

const SearchProvider = ({ children }: SearchProviderProps) => {
  return (
    <UiSearchProvider
      algolia={{
        appId: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "temp",
        apiKey: process.env.NEXT_PUBLIC_ALGOLIA_API_KEY || "temp",
        mainIndexName:
          process.env.NEXT_PUBLIC_DOCS_ALGOLIA_INDEX_NAME || "temp",
        indices: [
          process.env.NEXT_PUBLIC_API_ALGOLIA_INDEX_NAME || "temp",
          process.env.NEXT_PUBLIC_DOCS_ALGOLIA_INDEX_NAME || "temp",
        ],
      }}
      searchProps={{
        isLoading: false,
        suggestions: [
          {
            title: "Search Suggestions",
            items: ["Install in Admin Extension", "Icons", "Colors"],
          },
        ],
        checkInternalPattern: new RegExp(`^${absoluteUrl()}/ui`),
        filterOptions: searchFilters,
      }}
      initialDefaultFilters={["ui"]}
    >
      {children}
    </UiSearchProvider>
  )
}

export default SearchProvider
