import React from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, Package } from 'lucide-react';

interface BudgetItem {
  _id: string;
  description: string;
  vendor: string;
  quantity: number;
  unitCost: number;
  committedStatus: string;
  category: string;
  projectId: {
    _id: string;
    projectName: string;
    brand: string;
  };
}

interface BudgetTasksListProps {
  budgetItems: BudgetItem[];
}

export default function BudgetTasksList({ budgetItems }: BudgetTasksListProps) {
  const router = useRouter();

  const statusColors: { [key: string]: string } = {
    'Planned': 'bg-gray-100 text-gray-700',
    'Committed': 'bg-orange-100 text-orange-700',
    'Invoiced': 'bg-blue-100 text-blue-700',
    'Paid': 'bg-green-100 text-green-700',
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Budget Items</h2>
        <p className="text-sm text-gray-500 mt-1">Recent planned and committed budget items</p>
      </div>

      {budgetItems.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-500">
          <p className="font-semibold mb-2">No budget items</p>
          <p className="text-sm">No planned or committed budget items</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {budgetItems.map((item) => (
                <tr
                  key={item._id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/admin/projects/${item.projectId._id}/budget`)}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{item.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {item.projectId.projectName}
                      </div>
                      <div className="text-gray-500">{item.projectId.brand}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-900">
                      <Package size={14} className="text-gray-400" />
                      {item.category}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.vendor}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.quantity}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 font-semibold text-gray-900">
                      <DollarSign size={14} />
                      {formatCurrency(item.quantity * item.unitCost)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[item.committedStatus]
                      }`}
                    >
                      {item.committedStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}