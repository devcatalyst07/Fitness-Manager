// PDF Generator using jsPDF
// Note: Install jspdf and jspdf-autotable: npm install jspdf jspdf-autotable

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PortfolioReportData {
  summary: {
    totalProjects: number;
    totalBudget: number;
    totalSpent: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    completionRate: number;
    budgetUtilization: number;
  };
  projectDetails: Array<{
    name: string;
    brand: string;
    status: string;
    budget: number;
    spent: number;
    totalTasks: number;
    completedTasks: number;
    budgetItems: number;
  }>;
  budgetByCategory: Array<{
    category: string;
    items: number;
    amount: number;
  }>;
  taskStatusDistribution: Array<{
    status: string;
    count: number;
  }>;
  generatedAt: string;
}

export interface ProjectReportData {
  project: {
    name: string;
    code?: string;
    brand: string;
    status: string;
    budget: number;
    spent: number;
    startDate?: string;
    endDate?: string;
    description?: string;
  };
  tasks: Array<{
    title: string;
    status: string;
    priority: string;
    assignees: string[];
    progress: number;
    dueDate?: string;
  }>;
  budgetItems: Array<{
    description: string;
    category: string;
    vendor: string;
    quantity: number;
    unitCost: number;
    total: number;
    status: string;
  }>;
  summary: any;
  generatedAt: string;
}

export interface BrandReportData {
  brandName: string;
  summary: {
    totalProjects: number;
    totalBudget: number;
    totalSpent: number;
    totalTasks: number;
    completedTasks: number;
  };
  projectDetails: Array<{
    name: string;
    status: string;
    budget: number;
    spent: number;
    totalTasks: number;
    completedTasks: number;
    budgetItems: number;
  }>;
  generatedAt: string;
}

const formatCurrency = (amount: number) => {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US');
};

export const generatePortfolioPDF = (data: PortfolioReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('Portfolio Report', 15, 25);
  doc.setFontSize(10);
  doc.text(`Generated: ${formatDate(data.generatedAt)}`, 15, 33);

  yPos = 50;
  doc.setTextColor(0, 0, 0);

  // Summary Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Portfolio Summary', 15, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const summaryData = [
    ['Total Projects', data.summary.totalProjects.toString()],
    ['Total Budget', formatCurrency(data.summary.totalBudget)],
    ['Total Spent', formatCurrency(data.summary.totalSpent)],
    ['Budget Utilization', `${data.summary.budgetUtilization}%`],
    ['Total Tasks', data.summary.totalTasks.toString()],
    ['Completed Tasks', data.summary.completedTasks.toString()],
    ['Task Completion Rate', `${data.summary.completionRate}%`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 15, right: 15 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Project Details
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Project Details', 15, yPos);
  yPos += 5;

  const projectData = data.projectDetails.map(p => [
    p.name,
    p.brand,
    p.status,
    formatCurrency(p.budget),
    formatCurrency(p.spent),
    p.totalTasks.toString(),
    p.completedTasks.toString(),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Project', 'Brand', 'Status', 'Budget', 'Spent', 'Tasks', 'Done']],
    body: projectData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 15, right: 15 },
    styles: { fontSize: 8 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Budget by Category
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Budget by Category', 15, yPos);
  yPos += 5;

  const budgetData = data.budgetByCategory.map(c => [
    c.category,
    c.items.toString(),
    formatCurrency(c.amount),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Category', 'Items', 'Amount']],
    body: budgetData,
    theme: 'grid',
    headStyles: { fillColor: [34, 197, 94] },
    margin: { left: 15, right: 15 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount} | Fitout Manager`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`portfolio-report-${Date.now()}.pdf`);
};

export const generateProjectPDF = (data: ProjectReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text(`Project Report: ${data.project.name}`, 15, 20);
  doc.setFontSize(10);
  doc.text(`Code: ${data.project.code || 'N/A'}`, 15, 28);
  doc.text(`Generated: ${formatDate(data.generatedAt)}`, 15, 35);

  yPos = 50;
  doc.setTextColor(0, 0, 0);

  // Project Information
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Project Information', 15, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const projectInfo = [
    ['Brand', data.project.brand],
    ['Status', data.project.status],
    ['Budget', formatCurrency(data.project.budget)],
    ['Spent', formatCurrency(data.project.spent)],
    ['Start Date', formatDate(data.project.startDate)],
    ['End Date', formatDate(data.project.endDate)],
  ];

  autoTable(doc, {
    startY: yPos,
    body: projectInfo,
    theme: 'plain',
    margin: { left: 15 },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Tasks
  if (data.tasks.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Tasks', 15, yPos);
    yPos += 5;

    const taskData = data.tasks.slice(0, 20).map(t => [
      t.title,
      t.status,
      t.priority,
      t.assignees.join(', ') || 'Unassigned',
      `${t.progress}%`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Task', 'Status', 'Priority', 'Assignees', 'Progress']],
      body: taskData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 15, right: 15 },
      styles: { fontSize: 8 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Budget Items
  if (data.budgetItems.length > 0) {
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Budget Items', 15, yPos);
    yPos += 5;

    const budgetData = data.budgetItems.slice(0, 20).map(b => [
      b.description,
      b.category,
      b.vendor,
      b.quantity.toString(),
      formatCurrency(b.unitCost),
      formatCurrency(b.total),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Description', 'Category', 'Vendor', 'Qty', 'Unit Cost', 'Total']],
      body: budgetData,
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94] },
      margin: { left: 15, right: 15 },
      styles: { fontSize: 8 },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount} | Fitout Manager`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`${data.project.code || data.project.name}-report-${Date.now()}.pdf`);
};

export const generateBrandPDF = (data: BrandReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text(`${data.brandName} Brand Report`, 15, 25);
  doc.setFontSize(10);
  doc.text(`Generated: ${formatDate(data.generatedAt)}`, 15, 33);

  yPos = 50;
  doc.setTextColor(0, 0, 0);

  // Summary
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Brand Summary', 15, yPos);
  yPos += 8;

  const summaryData = [
    ['Total Projects', data.summary.totalProjects.toString()],
    ['Total Budget', formatCurrency(data.summary.totalBudget)],
    ['Total Spent', formatCurrency(data.summary.totalSpent)],
    ['Total Tasks', data.summary.totalTasks.toString()],
    ['Completed Tasks', data.summary.completedTasks.toString()],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 15, right: 15 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Project Details
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Projects', 15, yPos);
  yPos += 5;

  const projectData = data.projectDetails.map(p => [
    p.name,
    p.status,
    formatCurrency(p.budget),
    formatCurrency(p.spent),
    p.totalTasks.toString(),
    p.completedTasks.toString(),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Project', 'Status', 'Budget', 'Spent', 'Tasks', 'Done']],
    body: projectData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 15, right: 15 },
    styles: { fontSize: 9 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount} | Fitout Manager`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`${data.brandName}-brand-report-${Date.now()}.pdf`);
};