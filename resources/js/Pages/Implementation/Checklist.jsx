import React, { useEffect, useState } from 'react';
import { useForm, usePage, router, Head, Link } from '@inertiajs/react';
import {
  CheckCircle,
  Circle,
  Loader2,
  Eye,
  Download,
  X,
  Plus,
  Pencil,
  Save,
  ChevronLeft,
  FileText,
  Package,
  ClipboardList,
  Building2,
  Target,
  Activity,
  Upload,
  Trash2,
  Calendar,
  BarChart3,
  Sparkles,
  PhilippinePeso
} from 'lucide-react';

const fieldLabels = {
  tarp: 'Tarpaulin',
  pdc: 'Post-Dated Check',
  liquidation: 'Liquidation Report',
};

const fieldIcons = {
  tarp: FileText,
  pdc: ClipboardList,
  liquidation: BarChart3,
};

export default function Checklist({ implementation, approvedItems }) {
  const { data, setData, post, processing, reset } = useForm({
    tarp: null,
    pdc: null,
    liquidation: null,
    tag_name: '',
    tag_amount: '',
    selected_item_id: '',
  });

  const { props: page } = usePage();
  const [loadingField, setLoadingField] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState(null);
  const [editingTag, setEditingTag] = useState(null);
  const [editedTag, setEditedTag] = useState({ name: '', amount: '' });

  const handleItemSelect = (e) => {
    const itemId = e.target.value;
    setData('selected_item_id', itemId);
    
    if (itemId) {
      const selectedItem = approvedItems.find(item => item.item_id == itemId);
      if (selectedItem) {
        setData({
          ...data,
          selected_item_id: itemId,
          tag_name: selectedItem.item_name,
          tag_amount: selectedItem.item_cost,
        });
      }
    } else {
      setData({
        ...data,
        selected_item_id: '',
        tag_name: '',
        tag_amount: '',
      });
    }
  };

  const upload = (field) => {
    if (implementation[field]) return;
    setLoadingField(field);
    const formData = new FormData();
    formData.append(field, data[field]);
    formData.append('implement_id', implementation.implement_id);

    router.post(`/implementation/upload/${field}`, formData, {
      forceFormData: true,
      preserveScroll: true,
      onFinish: () => {
        setLoadingField(null);
        reset(field);
      },
    });
  };

  const deleteFile = (field) => {
    if (!confirm(`Are you sure you want to delete the ${fieldLabels[field]}?`)) return;
    setLoadingField(field);
    router.delete(`/implementation/delete/${field}`, {
      data: { implement_id: implementation.implement_id },
      preserveScroll: true,
      onFinish: () => setLoadingField(null),
    });
  };

  const addTag = () => {
    if (!data.tag_name.trim() || !data.tag_amount.trim()) return;

    router.post(
      '/tags',
      {
        implement_id: implementation.implement_id,
        tag_name: data.tag_name,
        tag_amount: parseFloat(data.tag_amount),
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setData({
            ...data,
            tag_name: '',
            tag_amount: '',
            selected_item_id: '',
          });
          router.reload({ preserveScroll: true });
        },
      }
    );
  };

  const deleteTag = (tagId) => {
    if (!confirm('Delete this tag?')) return;
    router.delete(`/tags/${tagId}`, {
      preserveScroll: true,
    });
  };

  const startEditTag = (tag) => {
    setEditingTag(tag.tag_id);
    setEditedTag({ name: tag.tag_name, amount: tag.tag_amount });
  };

  const saveEditTag = (tagId) => {
    router.put(
      `/tags/${tagId}`,
      {
        tag_name: editedTag.name,
        tag_amount: parseFloat(editedTag.amount),
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setEditingTag(null);
        },
      }
    );
  };

  const renderStatus = (value) =>
    value ? (
      <CheckCircle className="text-green-500 w-5 h-5 md:w-6 md:h-6" />
    ) : (
      <Circle className="text-gray-400 w-5 h-5 md:w-6 md:h-6" />
    );

  const previewFile = (url) => {
    const extension = url.split('.').pop().toLowerCase();
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const pdfTypes = ['pdf'];

    if (imageTypes.includes(extension)) {
      setPreviewType('image');
    } else if (pdfTypes.includes(extension)) {
      setPreviewType('pdf');
    } else {
      setPreviewType('other');
    }

    setPreviewUrl(url);
  };

  useEffect(() => {
    if (page.errors.upload) alert(page.errors.upload);
    if (page.errors.delete) alert(page.errors.delete);
    if (page.success) alert(page.success);
  }, [page.errors, page.success]);

  const totalAmount = implementation.tags?.reduce(
    (sum, tag) => sum + parseFloat(tag.tag_amount || 0),
    0
  );

  const projectCost = parseFloat(implementation.project?.project_cost || 0);
  const percentage = (totalAmount / projectCost) * 100;
  const canUploadLiquidation = percentage >= 100;

  const renderFileUploadSection = (field) => {
    const fileExists = !!implementation[field];
    const isLoading = loadingField === field;
    const uploadDateField = `${field}_upload`;
    const Icon = fieldIcons[field];
    
    return (
      <div key={field} className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <Icon className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">{fieldLabels[field]}</h3>
            {implementation[uploadDateField] && (
              <p className="text-xs text-gray-500">
                Uploaded: {new Date(implementation[uploadDateField]).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            {renderStatus(fileExists)}
          </div>
        </div>

        <div className="space-y-3 md:space-y-4">
          {fileExists && (
            <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
              <span className="text-xs md:text-sm text-green-700 font-medium flex-1">File uploaded</span>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => previewFile(implementation[field])}
                  className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-xs md:text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  <Eye className="w-3 h-3 md:w-4 md:h-4" /> View
                </button>
                <a
                  href={`/implementation/download/${field}?url=${encodeURIComponent(
                    implementation[field]
                  )}`}
                  className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-xs md:text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                  <Download className="w-3 h-3 md:w-4 md:h-4" /> DL
                </a>
                <button
                  onClick={() => deleteFile(field)}
                  className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-xs md:text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="animate-spin w-3 h-3 md:w-4 md:h-4" /> : <Trash2 className="w-3 h-3 md:w-4 md:h-4" />}
                </button>
              </div>
            </div>
          )}

          {fileExists && (
            <div className="p-2 md:p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-xs md:text-sm text-yellow-700">
              Delete existing file to upload a new one.
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-2 md:gap-3">
            <input
              type="file"
              onChange={(e) => setData(field, e.target.files[0])}
              className="flex-1 text-xs md:text-sm text-gray-500 file:mr-2 md:file:mr-4 file:py-1.5 md:file:py-2 file:px-3 md:file:px-4 file:rounded-lg file:border-0 file:text-xs md:file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={fileExists}
            />
            <button
              onClick={() => upload(field)}
              disabled={!data[field] || fileExists || isLoading}
              className="inline-flex items-center justify-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-2 bg-blue-500 text-white text-xs md:text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden md:inline">Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden md:inline">Upload</span>
                  <span className="md:hidden">Up</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head title="Implementation Checklist" />
      
      <div className="p-3 md:p-6 overflow-y-auto w-full">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="mb-4 md:mb-8">
            <Link
              href="/implementation"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 mb-2 md:mb-4 group"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to Implementation
            </Link>
            <div className="flex items-start gap-2 md:gap-4">
              <div className="p-2 md:p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg md:rounded-xl shadow-lg flex-shrink-0">
                <ClipboardList className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl md:text-3xl font-bold text-gray-900">Implementation Checklist</h1>
                <p className="text-xs md:text-base text-gray-600 mt-1">Track project deliverables and requirements</p>
              </div>
            </div>
          </div>

          {/* Project Information Card */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100 mb-4 md:mb-8">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="p-1.5 md:p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                <Building2 className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
              </div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Project Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className="text-xs md:text-sm font-medium text-gray-500">Company</label>
                  <p className="text-base md:text-lg font-semibold text-gray-900">{implementation.company_name}</p>
                </div>
                <div>
                  <label className="text-xs md:text-sm font-medium text-gray-500">Project</label>
                  <p className="text-base md:text-lg font-semibold text-gray-900 line-clamp-2">{implementation.project_title}</p>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center p-3 md:p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg md:rounded-xl border border-green-200 w-full">
                  <PhilippinePeso className="w-6 h-6 md:w-8 md:h-8 text-green-600 mx-auto mb-2" />
                  <label className="text-xs md:text-sm font-medium text-gray-500 block">Project Cost</label>
                  <p className="text-lg md:text-2xl font-bold text-green-600">
                    ₱{projectCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* File Upload Sections */}
          <div className="space-y-3 md:space-y-6 mb-4 md:mb-8">
            {['tarp', 'pdc'].map((field) => renderFileUploadSection(field))}
          </div>

          {/* Tagging Section */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100 mb-4 md:mb-8">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="p-1.5 md:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <Package className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
              </div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Equipment Tagging</h2>
            </div>

            {/* Add Tag Form */}
            <div className="mb-4 md:mb-6 p-3 md:p-4 bg-gray-50 rounded-lg md:rounded-xl border border-gray-200">
              <div className="flex flex-col gap-2 md:gap-3">
                {/* Item Dropdown */}
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5">
                    Select Approved Item
                  </label>
                  <select
                    value={data.selected_item_id}
                    onChange={handleItemSelect}
                    className="w-full px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">-- Select or enter manually --</option>
                    {approvedItems?.map((item) => (
                      <option key={item.item_id} value={item.item_id}>
                        {item.item_name} - ₱{parseFloat(item.item_cost).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Manual Input Fields */}
                <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                  <input
                    type="text"
                    value={data.tag_name}
                    onChange={(e) => setData('tag_name', e.target.value)}
                    placeholder="Equipment Name"
                    className="flex-1 px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                  <input
                    type="number"
                    value={data.tag_amount}
                    onChange={(e) => setData('tag_amount', e.target.value)}
                    placeholder="Amount"
                    className="w-24 md:w-32 px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                  <button
                    onClick={addTag}
                    className="inline-flex items-center justify-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs md:text-sm font-medium rounded-lg md:rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap flex-shrink-0"
                  >
                    <Plus className="w-3 h-3 md:w-4 md:h-4" /> 
                    <span className="hidden md:inline">Add Tag</span>
                    <span className="md:hidden">Add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Progress Section */}
            <div className="mb-4 md:mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs md:text-sm font-medium text-gray-700">Project Completion</span>
                <span className="text-xs md:text-sm font-bold text-purple-600">{percentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 md:h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
              <div className="flex items-center gap-1 md:gap-2 mt-2">
                <Target className="w-3 h-3 md:w-4 md:h-4 text-purple-500 flex-shrink-0" />
                <span className="text-xs md:text-sm text-gray-600">
                  Tag Total: <strong>₱{totalAmount?.toLocaleString()}</strong> / ₱{projectCost.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Tags List */}
            <div className="space-y-2 md:space-y-3">
              {implementation.tags?.map((tag) => (
                <div
                  key={tag.tag_id}
                  className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 p-2 md:p-4 bg-gradient-to-r from-gray-50 to-gray-50/30 rounded-lg md:rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  {editingTag === tag.tag_id ? (
                    <>
                      <input
                        value={editedTag.name}
                        onChange={(e) =>
                          setEditedTag((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="flex-1 px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        value={editedTag.amount}
                        onChange={(e) =>
                          setEditedTag((prev) => ({ ...prev, amount: e.target.value }))
                        }
                        className="w-20 md:w-32 px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => saveEditTag(tag.tag_id)}
                        className="p-1.5 md:p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors flex-shrink-0"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs md:text-sm font-medium text-gray-900">{tag.tag_name}</span>
                        <span className="text-purple-600 font-semibold text-xs md:text-sm ml-2">
                          ₱{parseFloat(tag.tag_amount).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => startEditTag(tag)}
                          className="p-1.5 md:p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Pencil className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                        <button
                          onClick={() => deleteTag(tag.tag_id)}
                          className="p-1.5 md:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <X className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Untagging Status */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100 mb-4 md:mb-8">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="p-1.5 md:p-2 bg-orange-100 rounded-lg flex-shrink-0">
                <Activity className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
              </div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Untagging Status</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
              <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-gradient-to-r from-orange-50 to-orange-50/30 rounded-lg md:rounded-xl border border-orange-200">
                {renderStatus(implementation.first_untagged)}
                <div className="min-w-0">
                  <h3 className="text-sm md:text-base font-medium text-gray-900">First Untagging</h3>
                  <p className="text-xs md:text-sm text-gray-500">50% Progress Milestone</p>
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-gradient-to-r from-green-50 to-green-50/30 rounded-lg md:rounded-xl border border-green-200">
                {renderStatus(implementation.final_untagged)}
                <div className="min-w-0">
                  <h3 className="text-sm md:text-base font-medium text-gray-900">Final Untagging</h3>
                  <p className="text-xs md:text-sm text-gray-500">100% Completion</p>
                </div>
              </div>
            </div>
          </div>

          {/* Liquidation Section */}
          <div className="bg-white rounded-lg md:rounded-2xl shadow-md md:shadow-xl p-4 md:p-8 border border-gray-100">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="p-1.5 md:p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Liquidation Report</h2>
                <p className="text-xs md:text-sm text-gray-600">Available when tagging reaches 100%</p>
              </div>
              {renderStatus(implementation.liquidation)}
            </div>

            {!canUploadLiquidation && (
              <div className="mb-4 md:mb-6 p-3 md:p-4 bg-yellow-50 rounded-lg md:rounded-xl border border-yellow-200">
                <div className="flex items-start gap-2 md:gap-3">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs md:text-sm text-yellow-700">
                    <strong>Complete all tagging first!</strong> Liquidation upload becomes available when tagging reaches 100% of project cost.
                  </p>
                </div>
              </div>
            )}

            {implementation.liquidation && implementation.liquidation_upload && (
              <div className="mb-3 md:mb-4">
                <p className="text-xs text-gray-500">
                  <Calendar className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                  Uploaded: {new Date(implementation.liquidation_upload).toLocaleDateString()}
                </p>
              </div>
            )}

            {implementation.liquidation && (
              <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-green-50 rounded-lg border border-green-200 mb-3 md:mb-4">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                <span className="text-xs md:text-sm text-green-700 font-medium flex-1">Liquidation report uploaded</span>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => previewFile(implementation.liquidation)}
                    className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-xs md:text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    <Eye className="w-3 h-3 md:w-4 md:h-4" /> View
                  </button>
                  <a
                    href={`/implementation/download/liquidation?url=${encodeURIComponent(
                      implementation.liquidation
                    )}`}
                    className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-xs md:text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                  >
                    <Download className="w-3 h-3 md:w-4 md:h-4" /> DL
                  </a>
                  <button
                    onClick={() => deleteFile('liquidation')}
                    className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-xs md:text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                    disabled={loadingField === 'liquidation'}
                  >
                    {loadingField === 'liquidation' ? <Loader2 className="animate-spin w-3 h-3 md:w-4 md:h-4" /> : <Trash2 className="w-3 h-3 md:w-4 md:h-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-2 md:gap-3">
              <input
                type="file"
                onChange={(e) => setData('liquidation', e.target.files[0])}
                className="flex-1 text-xs md:text-sm text-gray-500 file:mr-2 md:file:mr-4 file:py-1.5 md:file:py-2 file:px-3 md:file:px-4 file:rounded-lg file:border-0 file:text-xs md:file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                disabled={implementation.liquidation || !canUploadLiquidation}
              />
              <button
                onClick={() => upload('liquidation')}
                disabled={!data.liquidation || implementation.liquidation || loadingField === 'liquidation' || !canUploadLiquidation}
                className="inline-flex items-center justify-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-2 bg-emerald-500 text-white text-xs md:text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
              >
                {loadingField === 'liquidation' ? (
                  <>
                    <Loader2 className="animate-spin w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden md:inline">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden md:inline">Upload</span>
                    <span className="md:hidden">Up</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-3 md:p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="bg-white rounded-lg md:rounded-2xl max-w-2xl md:max-w-4xl w-full p-3 md:p-6 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 md:top-4 md:right-4 text-gray-400 hover:text-gray-600 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-xl md:text-2xl font-bold"
              onClick={() => setPreviewUrl(null)}
              aria-label="Close"
            >
              ×
            </button>

            <div className="mt-6 md:mt-8">
              {previewType === 'image' && (
                <img src={previewUrl} alt="Preview" className="w-full max-h-[60vh] md:max-h-[70vh] object-contain rounded-lg" />
              )}

              {previewType === 'pdf' && (
                <iframe src={previewUrl} className="w-full h-[60vh] md:h-[70vh] border rounded-lg" title="PDF Preview" />
              )}

              {previewType === 'other' && (
                <div className="flex items-center justify-center h-40 md:h-64 text-gray-500">
                  <div className="text-center">
                    <FileText className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-gray-400" />
                    <p className="text-sm md:text-base">No preview available for this file type.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}