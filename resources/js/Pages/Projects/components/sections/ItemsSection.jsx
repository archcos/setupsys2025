import { Package, Plus, Trash2, AlertCircle } from 'lucide-react';
import FormCard from '../FormCard';

export default function ItemsSection({ data, setData, errors }) {
  const addItem = () => {
    setData('items', [...data.items, { item_name: '', specifications: '', item_cost: '', quantity: 1, type: 'equipment' }]);
  };

  const removeItem = (index) => {
    setData('items', data.items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...data.items];
    updated[index][field] = value;
    setData('items', updated);
  };

  return (
    <FormCard icon={Package} title="Project Items" iconBgColor="bg-orange-100" iconColor="text-orange-600">
      <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-3 md:gap-0 mb-4 md:mb-6">
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs md:text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <Plus className="w-3 h-3 md:w-4 md:h-4" />
          Add Item
        </button>
      </div>

      <div className="space-y-4 md:space-y-6">
        {data.items.map((item, index) => (
          <div key={index} className="p-4 md:p-6 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-lg md:rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-sm md:text-base font-medium text-gray-900">Item #{index + 1}</h3>
              {data.items.length > 1 && (
                <button
                  type="button"
                  className="p-1.5 md:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                  onClick={() => removeItem(index)}
                >
                  <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 md:gap-4">
              <div className="grid grid-cols-12 gap-2 md:gap-4">
                <div className="col-span-12 md:col-span-6">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Item Name
                    <span className="text-xs text-gray-500 font-normal ml-2">
                      ({item.item_name.length}/100)
                    </span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="Enter item name"
                    value={item.item_name}
                    onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                    maxLength={100}
                    required
                  />
                  {errors[`items.${index}.item_name`] && (
                    <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      {errors[`items.${index}.item_name`]}
                    </div>
                  )}
                </div>

                <div className="col-span-6 md:col-span-3">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Cost</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">₱</span>
                    </div>
                    <input
                      type="number"
                      className="w-full pl-7 md:pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      placeholder="0.00"
                      value={item.item_cost}
                      onChange={(e) => handleItemChange(index, 'item_cost', e.target.value)}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  {errors[`items.${index}.item_cost`] && (
                    <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      {errors[`items.${index}.item_cost`]}
                    </div>
                  )}
                </div>

                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Qty</label>
                  <input
                    type="number"
                    className="w-full px-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center text-sm"
                    placeholder="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    min="1"
                    required
                  />
                  {errors[`items.${index}.quantity`] && (
                    <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      {errors[`items.${index}.quantity`]}
                    </div>
                  )}
                </div>

                <div className="col-span-3 md:col-span-2">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    className="w-full px-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    value={item.type}
                    onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                    required
                  >
                    <option value="equipment">Equipment</option>
                    <option value="nonequip">Non-Equipment</option>
                  </select>
                  {errors[`items.${index}.type`] && (
                    <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      {errors[`items.${index}.type`]}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Specifications
                  <span className="text-xs text-gray-500 font-normal ml-2">
                    ({item.specifications.length}/255)
                  </span>
                </label>
                <textarea
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none text-sm"
                  placeholder="Enter detailed specifications..."
                  value={item.specifications}
                  onChange={(e) => handleItemChange(index, 'specifications', e.target.value)}
                  maxLength={255}
                  required
                />
                {errors[`items.${index}.specifications`] && (
                  <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {errors[`items.${index}.specifications`]}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </FormCard>
  );
}
