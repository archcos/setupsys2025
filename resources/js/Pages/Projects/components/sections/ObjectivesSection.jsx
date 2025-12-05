import { Target, Plus, Trash2, AlertCircle } from 'lucide-react';
import FormCard from '../FormCard';

export default function ObjectivesSection({ data, setData, errors }) {
  const addObjective = () => {
    setData('objectives', [...data.objectives, { details: '' }]);
  };

  const removeObjective = (index) => {
    setData('objectives', data.objectives.filter((_, i) => i !== index));
  };

  const handleObjectiveChange = (index, value) => {
    const updated = [...data.objectives];
    updated[index].details = value;
    setData('objectives', updated);
  };

  return (
    <FormCard icon={Target} title="Project Objectives" iconBgColor="bg-indigo-100" iconColor="text-indigo-600">
      <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-3 md:gap-0 mb-4 md:mb-6">
        <button
          type="button"
          onClick={addObjective}
          className="inline-flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-xs md:text-sm font-medium rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <Plus className="w-3 h-3 md:w-4 md:h-4" />
          Add Objective
        </button>
      </div>

      <div className="space-y-3 md:space-y-4">
        {data.objectives.map((objective, index) => (
          <div key={index} className="flex gap-3 md:gap-4 p-3 md:p-4 bg-gradient-to-r from-gray-50 to-indigo-50/30 rounded-lg md:rounded-xl border border-gray-200">
            <div className="flex-shrink-0 mt-1">
              <div className="w-5 h-5 md:w-6 md:h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-indigo-600">{index + 1}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-xs text-gray-500 mb-1">
                ({objective.details.length}/255)
              </label>
              <textarea
                rows="2"
                placeholder="Describe the project objective..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none text-sm"
                value={objective.details}
                onChange={(e) => handleObjectiveChange(index, e.target.value)}
                maxLength={255}
                required
              />
              {errors[`objectives.${index}.details`] && (
                <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {errors[`objectives.${index}.details`]}
                </div>
              )}
            </div>
            {data.objectives.length > 1 && (
              <button
                type="button"
                className="flex-shrink-0 p-1.5 md:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200 self-start"
                onClick={() => removeObjective(index)}
              >
                <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </FormCard>
  );
}