import 'jspdf';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';
  
  export interface UserOptions {
    head?: any[][];
    body?: any[][];
    startY?: number;
    theme?: 'striped' | 'grid' | 'plain';
    headStyles?: any;
    margin?: { left?: number; right?: number; top?: number; bottom?: number };
    styles?: any;
    columnStyles?: any;
  }

  export default function autoTable(doc: jsPDF, options: UserOptions): void;
}