import { useForm, Link, Head } from "@inertiajs/react";
import { useState } from "react";
import {
  Package,
  Wrench,
  Trash2,
  Info,
  BarChart3,
  Users,
  Store,
  FileText,
  AlertCircle,
  ChevronLeft,
  Save,
  Plus,
  FlaskConical,
  PhilippinePeso,
} from "lucide-react";

export default function Create({ project, objects, equipments, nonequipments, refunds, markets }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Calculate totals for display
  const approvedItemsTotal = equipments
    .concat(nonequipments)
    .filter(item => item.report === "approved")
    .reduce((sum, item) => sum + Number(item.item_cost || 0), 0);

  const totalRefunds = refunds.reduce((sum, refund) => sum + Number(refund.refund_amount || 0), 0);
  const totalAmountToBeRefunded = Number(project.project_cost || 0) - totalRefunds;

  // Calculate refund status
  const currentDate = new Date();
  const currentMonth = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0') + '-01';
  
  const refundStart = new Date(project.refund_initial);
  const refundEnd = new Date(project.refund_end);
  
  // Calculate unpaid months and delayed refunds
  const unpaidMonths = [];
  let refundDelayedSince = null;
  
  for (let d = new Date(refundStart); d <= refundEnd && d <= currentDate; d.setMonth(d.getMonth() + 1)) {
    const monthKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-01';
    const isPaid = refunds.some(refund => 
      refund.month_paid === monthKey || refund.status === 'paid'
    );
    
    if (!isPaid && monthKey <= currentMonth) {
      unpaidMonths.push(monthKey);
      if (!refundDelayedSince) {
        refundDelayedSince = monthKey;
      }
    }
  }

  const { data, setData, post, processing, errors } = useForm({
    project_id: project.project_id,
    actual_accom: objects.map(() => ""),   
    actual_remarks: objects.map(() => ""), 
    util_remarks: "",
    new_male: 0,
    new_female: 0,
    new_ifmale: 0,
    new_iffemale: 0,
    new_ibmale: 0,
    new_ibfemale: 0,
    problems: "",
    actions: "",
    promotional: "",
    products: [
    { product_name: "", volume: "", quarter: 1, gross_sales: "" }
    ],
    markets_new: [],
    equipments_actual: equipments.map((item) => ({
      item_name: item.item_name,
      specifications: item.specifications,
      quantity: item.quantity,
      item_cost: item.item_cost,
      acknowledge: "",
      remarks: "",
    })),
    nonequipments_actual: nonequipments.map((item) => ({
      item_name: item.item_name,
      specifications: item.specifications,
      quantity: item.quantity,
      item_cost: item.item_cost,
      acknowledge: "",
      remarks: "",
    })),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route("reports.store"));
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleEquipChange = (index, field, value, type) => {
    const updated = [...data[type]];
    if (!updated[index]) {
      updated[index] = {};
    }
    updated[index] = { ...updated[index], [field]: value };
    setData(type, updated);
  };

  const addProduct = () => {
    setData("products", [
      ...data.products,
      { product_name: "", volume: 0, quarter: 1, gross_sales: 0 }
    ]);
  };

  const removeProduct = (index) => {
    const updated = [...data.products];
    updated.splice(index, 1);
    setData("products", updated);
  };

  const updateProduct = (index, field, value) => {
    const updated = [...data.products];
    updated[index] = { ...updated[index], [field]: value };
    setData("products", updated);
  };

  const addNewMarket = () => {
    setData("markets_new", [
      ...data.markets_new,
      { place_name: "", effective_date: "" }
    ]);
  };

  const removeNewMarket = (index) => {
    const updated = [...data.markets_new];
    updated.splice(index, 1);
    setData("markets_new", updated);
  };

  const updateNewMarket = (index, field, value) => {
    const updated = [...data.markets_new];
    updated[index] = { ...updated[index], [field]: value };
    setData("markets_new", updated);
  };

  // Calculate employment totals
  const newEmploymentTotal = Number(data.new_male || 0) + Number(data.new_female || 0);
  const newIndirectMaleTotal = Number(data.new_ifmale || 0) + Number(data.new_iffemale || 0);
  const newIndirectFemaleTotal = Number(data.new_ibmale || 0) + Number(data.new_ibfemale || 0);
  const overallTotal = newEmploymentTotal + newIndirectMaleTotal + newIndirectFemaleTotal;

  return (
        <main className="flex-1 p-6 overflow-y-auto">
                  <Head title="Create Report" />
          <div className="max-w-6xl mx-auto">
            {/* Back & Title */}
            <div className="mb-8">
              <Link
                href={route("reports.index")}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 mb-4 group"
              >
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Back to Reports
              </Link>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {project.project_title}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Complete the project report details
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 1. Project Accomplishment */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Info className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Expected vs Actual Accomplishment</h2>
                </div>
                
                <div className="space-y-4">
                {objects.map((obj, index) => (
                    <div 
                        key={obj.objective_id ?? index} // ✅ unique key
                        className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl border-gray-500"
                      >                    <div className="text-gray-700 font-medium">
                      <label className="text-sm text-gray-500 block mb-1">Expected Output</label>
                      {obj.details}
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 block mb-1">Actual Accomplishment</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="Enter actual accomplishment"
                        value={data.actual_accom[index] || ""}
                        onChange={(e) => {
                          const updated = [...data.actual_accom];
                          updated[index] = e.target.value;
                          setData("actual_accom", updated);
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 block mb-1">Remarks</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="Enter remarks"
                        value={data.actual_remarks[index] || ""}
                        onChange={(e) => {
                          const updated = [...data.actual_remarks];
                          updated[index] = e.target.value;
                          setData("actual_remarks", updated);
                        }}
                      />
                    </div>
                  </div>
                ))}

                </div>
              </div>
{/* 2. Equipment */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-200 rounded-lg">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">List of Equipment</h2>
              </div>

              <div className="space-y-4">
                {equipments.filter(item => item.report === "approved").length === 0 ? (
                  <p className="text-gray-500 italic">No existing equipment found</p>
                ) : (
                  equipments
                    .filter(item => item.report === "approved")
                    .map((item, index) => (
                      <div
                        key={item.item_id}
                        className="p-6 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl border border-gray-200"
                      >
                        <h3 className="font-semibold text-gray-700 mb-2">Approved Equipment:</h3>
                        <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-700 mb-4">
                          <span>
                            <span className="block text-xs text-gray-500">Item Name</span>
                            {item.item_name} <br /> Specifications: {item.specifications}
                          </span>
                          <span>
                            <span className="block text-xs text-gray-500">Quantity</span>
                            {item.quantity}
                          </span>
                          <span>
                            <span className="block text-xs text-gray-500">Cost</span>
                            ₱{Number(item.item_cost || 0).toLocaleString()}
                          </span>
                        </div>

                        <div className="my-6 h-[2px] bg-black rounded-full"></div>

                        <h4 className="font-medium text-gray-600 mb-3">Actual Equipment:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Item Name</label>
                            <input
                              className="w-full px-4 py-2 border border-gray-500 rounded-lg focus:ring-2 focus:ring-green-500"
                              placeholder="Item name"
                              value={data.equipments_actual[index]?.item_name || item.item_name}
                              onChange={(e) =>
                                handleEquipChange(index, "item_name", e.target.value, "equipments_actual")
                              }
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Quantity</label>
                            <input
                              type="number"
                              className="w-full px-4 py-2 border-gray-500 rounded-lg focus:ring-2 focus:ring-green-500"
                              placeholder="Quantity"
                              value={data.equipments_actual[index]?.quantity || item.quantity}
                              onChange={(e) =>
                                handleEquipChange(index, "quantity", Number(e.target.value), "equipments_actual")
                              }
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Item Cost</label>
                            <input
                              type="number"
                              step="0.01"
                              className="w-full px-4 py-2 border-gray-500 rounded-lg focus:ring-2 focus:ring-green-500"
                              placeholder="Cost"
                              value={data.equipments_actual[index]?.item_cost || item.item_cost}
                              onChange={(e) =>
                                handleEquipChange(index, "item_cost", Number(e.target.value), "equipments_actual")
                              }
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Acknowledge</label>
                            <select
                              className="w-full px-4 py-2 border-gray-500 rounded-lg focus:ring-2 focus:ring-green-500"
                              value={data.equipments_actual[index]?.acknowledge || ""}
                              onChange={(e) =>
                                handleEquipChange(index, "acknowledge", e.target.value, "equipments_actual")
                              }
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          </div>
                        </div>

                        {/* Big Specifications */}
                        <div className="mt-3">
                          <label className="text-xs text-gray-500 block mb-1">Specifications</label>
                          <textarea
                            rows="3"
                            className="w-full px-4 py-2 border-gray-500 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="Specifications"
                            value={data.equipments_actual[index]?.specifications || item.specifications}
                            onChange={(e) =>
                              handleEquipChange(index, "specifications", e.target.value, "equipments_actual")
                            }
                          />
                        </div>

                        {/* Big Remarks */}
                        <div className="mt-3">
                          <label className="text-xs text-gray-500 block mb-1">Remarks</label>
                          <textarea
                            rows="3"
                            className="w-full px-4 py-2 border-gray-500 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="Additional remarks"
                            value={data.equipments_actual[index]?.remarks || ""}
                            onChange={(e) =>
                              handleEquipChange(index, "remarks", e.target.value, "equipments_actual")
                            }
                          />
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

{/* 3. Non-Equipment */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FlaskConical className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">List of Non-Equipment</h2>
              </div>

              <div className="space-y-4">
                {nonequipments.filter(item => item.report === "approved").length === 0 ? (
                  <p className="text-gray-500 italic">No existing non-equipment found</p>
                ) : (
                  nonequipments
                    .filter(item => item.report === "approved")
                    .map((item, index) => (
                      <div
                        key={item.item_id}
                        className="p-6 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl border-gray-500"
                      >
                        <h3 className="font-semibold text-gray-700 mb-2">Approved Non-Equipment:</h3>
                        <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-700 mb-4">
                          <span>
                            <span className="block text-xs text-gray-500">Item Name</span>
                            {item.item_name} <br /> Specifications: {item.specifications}
                          </span>
                          <span>
                            <span className="block text-xs text-gray-500">Quantity</span>
                            {item.quantity}
                          </span>
                          <span>
                            <span className="block text-xs text-gray-500">Cost</span>
                            ₱{Number(item.item_cost || 0).toLocaleString()}
                          </span>
                        </div>

                        <div className="my-6 h-[2px] bg-black rounded-full"></div>

                        <h4 className="font-medium text-gray-600 mb-3">Actual Non-Equipment:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Item Name</label>
                            <input
                              className="w-full px-4 py-2 border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Item name"
                              value={data.nonequipments_actual[index]?.item_name || item.item_name}
                              onChange={(e) =>
                                handleEquipChange(index, "item_name", e.target.value, "nonequipments_actual")
                              }
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Quantity</label>
                            <input
                              type="number"
                              className="w-full px-4 py-2 border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Quantity"
                              value={data.nonequipments_actual[index]?.quantity || item.quantity}
                              onChange={(e) =>
                                handleEquipChange(index, "quantity", Number(e.target.value), "nonequipments_actual")
                              }
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Item Cost</label>
                            <input
                              type="number"
                              step="0.01"
                              className="w-full px-4 py-2 border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Cost"
                              value={data.nonequipments_actual[index]?.item_cost || item.item_cost}
                              onChange={(e) =>
                                handleEquipChange(index, "item_cost", Number(e.target.value), "nonequipments_actual")
                              }
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Acknowledge</label>
                            <select
                              className="w-full px-4 py-2 border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                              value={data.nonequipments_actual[index]?.acknowledge || ""}
                              onChange={(e) =>
                                handleEquipChange(index, "acknowledge", e.target.value, "nonequipments_actual")
                              }
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          </div>
                        </div>

                        {/* Big Specifications */}
                        <div className="mt-3">
                          <label className="text-xs text-gray-500 block mb-1">Specifications</label>
                          <textarea
                            rows="3"
                            className="w-full px-4 py-2 border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Specifications"
                            value={data.nonequipments_actual[index]?.specifications || item.specifications}
                            onChange={(e) =>
                              handleEquipChange(index, "specifications", e.target.value, "nonequipments_actual")
                            }
                          />
                        </div>

                        {/* Big Remarks */}
                        <div className="mt-3">
                          <label className="text-xs text-gray-500 block mb-1">Remarks</label>
                          <textarea
                            rows="3"
                            className="w-full px-4 py-2 border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Additional remarks"
                            value={data.nonequipments_actual[index]?.remarks || ""}
                            onChange={(e) =>
                              handleEquipChange(index, "remarks", e.target.value, "nonequipments_actual")
                            }
                          />
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>


              {/* 4. Fund Utilization */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Status of Fund Utilization</h2>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Project Cost</p>
                      <p className="text-2xl font-bold text-gray-900">₱{Number(project.project_cost || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Approved Items Total</p>
                      <p className="text-2xl font-bold text-purple-600">₱{approvedItemsTotal.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Utilization Remarks</label>
                  <textarea
                    className="w-full px-4 py-3 border-gray-500 rounded-xl focus:ring-2 focus:ring-purple-500 bg-gray-50"
                    rows="3"
                    placeholder="Enter fund utilization remarks"
                    value={data.util_remarks}
                    onChange={(e) => setData("util_remarks", e.target.value)}
                  />
                </div>
              </div>

              {/* 5. Refund Status */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <PhilippinePeso className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Status of Refund</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600">Total Amount to be Refunded</p>
                    <p className="text-xl font-bold text-yellow-600">₱{totalAmountToBeRefunded.toLocaleString()}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600">Refund Schedule</p>
                    <p className="text-sm font-medium text-blue-600">
                      {new Date(project.refund_initial).toLocaleDateString('en-US', { 
                        year: 'numeric', month: 'long', day: 'numeric' 
                      })} - {new Date(project.refund_end).toLocaleDateString('en-US', { 
                        year: 'numeric', month: 'long', day: 'numeric' 
                      })}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600">Total Amount Refunded</p>
                    <p className="text-xl font-bold text-green-600">₱{totalRefunds.toLocaleString()}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600">Unsettled Refund</p>
                    <p className="text-lg font-bold text-red-600">{unpaidMonths.length} months</p>
                    {refundDelayedSince && (
                      <p className="text-xs text-red-500 mt-1">
                        Delayed since: {new Date(refundDelayedSince).toLocaleDateString('en-US', { 
                          year: 'numeric', month: 'long' 
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>

           {/* 6. Volume of Products */}
<div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-orange-100 rounded-lg">
        <Package className="w-5 h-5 text-orange-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900">Volume of Products</h2>
    </div>
    <button
      type="button"
      onClick={addProduct}
      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
    >
      <Plus className="w-4 h-4" />
      Add Product
    </button>
  </div>

  <div className="space-y-4">
    {data.products.map((product, index) => (
      <div
        key={index}
        className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-orange-50 rounded-xl"
      >
        {/* Product Name */}
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-600 mb-1">Product Name</label>
          <input
            className="px-3 py-2 border-gray-500 rounded-lg focus:ring-2 focus:ring-orange-500"
            value={product.product_name || ""}
            onChange={(e) => updateProduct(index, "product_name", e.target.value)}
            required={index === 0}
          />
        </div>

        {/* Volume */}
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-600 mb-1">Volume</label>
          <input
            type="number"
            className="px-3 py-2 border-gray-500 rounded-lg focus:ring-2 focus:ring-orange-500"
            value={product.volume || ""}
            onChange={(e) => updateProduct(index, "volume", Number(e.target.value))}
            required={index === 0}
          />
        </div>

        {/* Quarter */}
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-600 mb-1">Quarter</label>
          <select
            className="px-3 py-2 border-gray-500 rounded-lg focus:ring-2 focus:ring-orange-500"
            value={product.quarter || 1}
            onChange={(e) => updateProduct(index, "quarter", Number(e.target.value))}
            required={index === 0}
          >
            <option value={1}>Q1</option>
            <option value={2}>Q2</option>
            <option value={3}>Q3</option>
            <option value={4}>Q4</option>
          </select>
        </div>

        {/* Gross Sales */}
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-600 mb-1">Gross Sales (₱)</label>
          <input
            type="number"
            className="px-3 py-2 border-gray-500 rounded-lg focus:ring-2 focus:ring-orange-500"
            value={product.gross_sales || ""}
            onChange={(e) => updateProduct(index, "gross_sales", Number(e.target.value))}
            required={index === 0}
          />
        </div>

        {/* Delete Button */}
        <div className="flex items-end justify-center">
          <button
            type="button"
            onClick={() => removeProduct(index)}
            className="flex items-center justify-center gap-1 text-red-600 hover:text-red-800 text-sm"
            disabled={index === 0}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    ))}
  </div>
</div>


              {/* 7. Employment */}
{/* 7. Employment */}
<div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
  <div className="flex items-center gap-3 mb-6">
    <div className="p-2 bg-green-100 rounded-lg">
      <Users className="w-5 h-5 text-green-600" />
    </div>
    <h2 className="text-xl font-semibold text-gray-900">New Employment</h2>
  </div>

  <div className="space-y-6">
    {/* Direct Employment */}
    <div>
      <h3 className="font-semibold text-gray-700 mb-3">New Direct Employment:</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col">
          <label className="text-gray-600 font-medium mb-1">Male</label>
          <input
            type="number"
            placeholder="New Male"
            className="px-4 py-3 border-gray-500 rounded-xl focus:ring-2 focus:ring-green-500 bg-gray-50"
            value={data.new_male ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              setData("new_male", val === "" ? "" : Number(val));
            }}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-gray-600 font-medium mb-1">Female</label>
          <input
            type="number"
            placeholder="New Female"
            className="px-4 py-3 border-gray-500 rounded-xl focus:ring-2 focus:ring-green-500 bg-gray-50"
            value={data.new_female ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              setData("new_female", val === "" ? "" : Number(val));
            }}
          />
        </div>
        <div className="px-4 py-3 bg-green-100 rounded-xl text-center font-semibold text-green-700">
          Total: {newEmploymentTotal}
        </div>
      </div>
    </div>

    {/* Indirect Employment - Forward */}
    <div>
      <h3 className="font-semibold text-gray-700 mb-3">New Indirect Employment (Forward):</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col">
          <label className="text-gray-600 font-medium mb-1">Male</label>
          <input
            type="number"
            placeholder="New IF Male"
            className="px-4 py-3 border-gray-500 rounded-xl focus:ring-2 focus:ring-green-500 bg-gray-50"
            value={data.new_ifmale ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              setData("new_ifmale", val === "" ? "" : Number(val));
            }}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-gray-600 font-medium mb-1">Female</label>
          <input
            type="number"
            placeholder="New IF Female"
            className="px-4 py-3 border-gray-500 rounded-xl focus:ring-2 focus:ring-green-500 bg-gray-50"
            value={data.new_iffemale ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              setData("new_iffemale", val === "" ? "" : Number(val));
            }}
          />
        </div>
        <div className="px-4 py-3 bg-blue-100 rounded-xl text-center font-semibold text-blue-700">
          Total: {newIndirectMaleTotal}
        </div>
      </div>
    </div>

    {/* Indirect Employment - Backward */}
    <div>
      <h3 className="font-semibold text-gray-700 mb-3">New Indirect Employment (Backward):</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col">
          <label className="text-gray-600 font-medium mb-1">Male</label>
          <input
            type="number"
            placeholder="New IB Male"
            className="px-4 py-3 border-gray-500 rounded-xl focus:ring-2 focus:ring-green-500 bg-gray-50"
            value={data.new_ibmale ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              setData("new_ibmale", val === "" ? "" : Number(val));
            }}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-gray-600 font-medium mb-1">Female</label>
          <input
            type="number"
            placeholder="New IB Female"
            className="px-4 py-3 border-gray-500 rounded-xl focus:ring-2 focus:ring-green-500 bg-gray-50"
            value={data.new_ibfemale ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              setData("new_ibfemale", val === "" ? "" : Number(val));
            }}
          />
        </div>
        <div className="px-4 py-3 bg-indigo-100 rounded-xl text-center font-semibold text-indigo-700">
          Total: {newIndirectFemaleTotal}
        </div>
      </div>
    </div>

    {/* Overall Total */}
    <div className="bg-gradient-to-r from-green-100 to-blue-100 p-4 rounded-xl">
      <p className="text-center text-lg font-bold text-gray-800">
        Overall Employment Total: {overallTotal}
      </p>
    </div>
  </div>
</div>


              {/* 8. Markets */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Store className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">List of Market Penetrated</h2>
                </div>
                
                {/* Existing Markets */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-3">Existing:</h3>
                  <div className="bg-indigo-50 p-4 rounded-xl">
                    {markets.filter(m => m.type === "existing").length > 0 ? (
                      <div className="space-y-2">
                        {markets
                          .filter(m => m.type === "existing")
                          .map((market) => (
                            <div key={market.market_id} className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                              <span className="text-gray-700">{market.place_name}</span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No existing markets found</p>
                    )}
                  </div>
                </div>
                
                {/* New Markets */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-700">New Market:</h3>
                    <button
                      type="button"
                      onClick={addNewMarket}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add New Market
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {data.markets_new.map((market, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-indigo-50 rounded-xl">
                        <input
                          type="text"
                          placeholder="Market Place Name"
                          className="px-4 py-3 border-gray-500 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                          value={market.place_name || ""}
                          onChange={(e) => updateNewMarket(index, "place_name", e.target.value)}
                        />
                        <input
                          type="date"
                          placeholder="Effective Date"
                          className="px-4 py-3 border-gray-500 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                          value={market.effective_date || ""}
                          onChange={(e) => updateNewMarket(index, "effective_date", e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeNewMarket(index)}
                          className="flex items-center justify-center gap-1 text-red-600 hover:text-red-800 text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 9. Problems, Actions & Promotional */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Problems, Actions & Promotions</h2>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Problems Encountered</label>
                    <textarea
                      rows="4"
                      className="w-full px-4 py-3 border-gray-500 rounded-xl focus:ring-2 focus:ring-red-500 bg-gray-50"
                      placeholder="Problems met & actions taken during project implementation"
                      value={data.problems}
                      onChange={(e) => setData("problems", e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Actions Taken</label>
                    <textarea
                      rows="4"
                      className="w-full px-4 py-3 border-gray-500 rounded-xl focus:ring-2 focus:ring-red-500 bg-gray-50"
                      placeholder="Action/plan for the improvement of project’s operation"
                      value={data.actions}
                      onChange={(e) => setData("actions", e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Promotional/Linkages Plan</label>
                    <textarea
                      rows="4"
                      className="w-full px-4 py-3 border-gray-500 rounded-xl focus:ring-2 focus:ring-red-500 bg-gray-50"
                      placeholder="Describe promotional or linkages plan"
                      value={data.promotional}
                      onChange={(e) => setData("promotional", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4 pb-8">
                <Link
                  href={route("reports.index")}
                  className="px-6 py-3 bg-gray-500 text-white rounded-xl shadow hover:bg-gray-600 transition-colors duration-200"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={processing}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {processing ? "Saving..." : "Save Report"}
                </button>
              </div>
            </form>
          </div>
        </main>
  );
}