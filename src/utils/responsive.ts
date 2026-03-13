export const responsive = {
  page: "w-full max-w-full overflow-x-hidden",
  sectionCard: "bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6",
  sectionHeader:
    "flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-6",
  sectionTitleWrap: "min-w-0 flex-1",
  actionsRow: "flex flex-wrap items-center gap-2 w-full sm:w-auto",
  primaryButton:
    "inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors",
  secondaryButton:
    "inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors",
  filterPanel: "flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg",
  filterOptions: "flex-1 flex flex-wrap items-center gap-3",
  formControl:
    "w-full min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm",
  inlineMeta: "flex flex-wrap items-center gap-2 sm:gap-3 mt-1",
} as const;
