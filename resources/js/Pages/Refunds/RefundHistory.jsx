import { useState } from 'react';
import { CheckCircle, Circle } from "lucide-react";
import { Head } from '@inertiajs/react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function RefundHistory({ projects }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Get current month/year
  const currentMonth = new Date().toLocaleString("default", { month: "long" });
  const currentYear = new Date().getFullYear();

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Fixed Header */}
        <div className="sticky top-0 z-20 bg-white shadow">
          <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        </div>

        <Head title="Refund Monitoring" />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
{projects.map((project) => {
  const currentMonthIndex = new Date().getMonth();

  // Refunds for current month/year
  const refundsThisMonth = project.refunds.filter((refund) => {
    const refundDate = new Date(refund.refund_date);
    return (
      refundDate.getMonth() === currentMonthIndex &&
      refundDate.getFullYear() === currentYear
    );
  });

  const hasPaidThisMonth = refundsThisMonth.some(
    (refund) => refund.status === "paid"
  );

  return (
    <div
      key={project.project_id}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
    >
      {/* Status Banner */}
      <div
        className={`px-5 py-2 rounded-t-lg font-medium ${
          refundsThisMonth.length === 0
            ? "bg-gray-200 text-gray-700" // No record for this month
            : hasPaidThisMonth
            ? "bg-green-100 text-green-700" // Paid this month
            : "bg-red-100 text-red-700" // Unpaid this month
        }`}
      >
        {refundsThisMonth.length === 0
          ? `ℹ Nothing to pay for ${currentMonth} ${currentYear}`
          : hasPaidThisMonth
          ? `✅ You’ve paid for ${currentMonth}`
          : `❌ You haven’t paid for ${currentMonth}`}
      </div>

      {/* Card Content */}
      <div className="p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          {project.project_title}{" "}
          <span className="text-gray-500 font-normal">
            ({project.company_name})
          </span>
        </h2>

        {/* Refund Grid - always show all refunds */}
        {project.refunds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {project.refunds.map((refund, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg shadow-sm min-h-[40px]"
              >
                {refund.status === "paid" ? (
                  <CheckCircle
                    className="w-5 h-5 text-green-500 flex-shrink-0"
                    strokeWidth={2}
                  />
                ) : (
                  <Circle
                    className="w-5 h-5 text-gray-400 flex-shrink-0"
                    strokeWidth={2}
                  />
                )}
                <span className="text-sm text-gray-700">
                  {refund.refund_date}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">
            No refunds recorded
          </p>
        )}
      </div>
    </div>
  );
})}

        </div>
      </div>
    </div>
  );
}
