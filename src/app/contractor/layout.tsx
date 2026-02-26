import React from 'react';

export const metadata = {
  title: 'Tender Bid Submission',
  description: 'Submit your bid for the tender',
};

export default function ContractorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout intentionally does NOT include AdminSidebar/AdminHeader.
  // It renders a clean, standalone page for external contractors.
  return <>{children}</>;
}