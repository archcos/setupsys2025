import React, { useEffect, useState } from 'react';
import { useForm, usePage, router, Head } from '@inertiajs/react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
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
} from 'lucide-react';

const fieldLabels = {
  tarp: 'Tarpaulin',
  pdc: 'Post-Dated Check',
  liquidation: 'Liquidation Report',
};

export default function Checklist({ implementation }) {
  const { data, setData, post, processing, reset } = useForm({
    tarp: null,
    pdc: null,
    liquidation: null,
    tag_name: '',
    tag_amount: '',
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const { props: page } = usePage();
  const [loadingField, setLoadingField] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState(null);
  const [editingTag, setEditingTag] = useState(null);
  const [editedTag, setEditedTag] = useState({ name: '', amount: '' });

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
          setData('tag_name', '');
          setData('tag_amount', '');
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
      <CheckCircle className="text-green-500 w-6 h-6" />
    ) : (
      <Circle className="text-gray-400 w-6 h-6" />
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

  return (
    <div className="flex bg-gray-100 h-screen">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Head title="Checklist" />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow space-y-6 p-6">
            <h2 className="text-xl font-semibold">Implementation Checklist</h2>

            <div className="text-sm text-gray-700 border-b pb-4">
              Project Cost:{' '}
              <strong>₱{projectCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
            </div>

            {['tarp', 'pdc'].map((field) => {
              const fileExists = !!implementation[field];
              const isLoading = loadingField === field;
              return (
                <div key={field} className="flex flex-col border-b pb-4 mb-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {renderStatus(fileExists)}
                      <span>{fieldLabels[field]}</span>
                      {fileExists && (
                        <>
                          <button
                            onClick={() => previewFile(implementation[field])}
                            className="text-blue-500 hover:underline text-sm flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" /> View
                          </button>
                          <a
                            href={`/implementation/download/${field}?url=${encodeURIComponent(
                              implementation[field]
                            )}`}
                            className="text-green-600 hover:underline text-sm flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" /> Download
                          </a>
                        </>
                      )}
                    </div>
                    {fileExists && (
                      <button
                        onClick={() => deleteFile(field)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:opacity-50"
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Delete'}
                      </button>
                    )}
                  </div>
                  {fileExists && (
                    <p className="text-sm text-yellow-600 mt-1">
                      A file has already been uploaded. You must delete it before uploading a new one.
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="file"
                      onChange={(e) => setData(field, e.target.files[0])}
                      className="block text-sm text-gray-500"
                      disabled={fileExists}
                    />
                    <button
                      onClick={() => upload(field)}
                      disabled={!data[field] || fileExists || isLoading}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Upload'}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Tags Section */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Tags</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={data.tag_name}
                  onChange={(e) => setData('tag_name', e.target.value)}
                  placeholder="Tag name"
                  className="border rounded px-3 py-1 flex-1"
                />
                <input
                  type="number"
                  value={data.tag_amount}
                  onChange={(e) => setData('tag_amount', e.target.value)}
                  placeholder="Amount"
                  className="border rounded px-3 py-1 w-32"
                />
                <button
                  onClick={addTag}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                >
                  <Plus className="w-4 h-4 inline mr-1" /> Add
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded h-4 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all"
                   style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-600">
                Tag Total: <strong>₱{totalAmount?.toLocaleString()}</strong> ({percentage.toFixed(1)}% of project cost)
              </div>

              <ul className="space-y-1">
                {implementation.tags?.map((tag) => (
                  <li
                    key={tag.tag_id}
                    className="bg-gray-100 border px-3 py-1 rounded flex justify-between items-center gap-2"
                  >
                    {editingTag === tag.tag_id ? (
                      <>
                        <input
                          value={editedTag.name}
                          onChange={(e) =>
                            setEditedTag((prev) => ({ ...prev, name: e.target.value }))
                          }
                          className="border rounded px-2 py-0.5 text-sm w-1/3"
                        />
                        <input
                          type="number"
                          value={editedTag.amount}
                          onChange={(e) =>
                            setEditedTag((prev) => ({ ...prev, amount: e.target.value }))
                          }
                          className="border rounded px-2 py-0.5 text-sm w-1/4"
                        />
                        <button
                          onClick={() => saveEditTag(tag.tag_id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1">
                          {tag.tag_name} - ₱{parseFloat(tag.tag_amount).toLocaleString()}
                        </span>
                        <button
                          onClick={() => startEditTag(tag)}
                          className="text-gray-600 hover:text-blue-700"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteTag(tag.tag_id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Untagging Status */}
            <div className="flex flex-col gap-3 border-t pt-4">
              <div className="flex items-center gap-3">
                {renderStatus(implementation.first_untagged)}
                <span>First Untagging (≥ 50%)</span>
              </div>
              <div className="flex items-center gap-3">
                {renderStatus(implementation.final_untagged)}
                <span>Final Untagging (100%)</span>
              </div>
            </div>

            {/* Liquidation Upload */}
            {['liquidation'].map((field) => {
              const fileExists = !!implementation[field];
              const isLoading = loadingField === field;

              return (
                <div key={field} className="flex flex-col border-t pt-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {renderStatus(fileExists)}
                      <span>{fieldLabels[field]}</span>

                      {fileExists && (
                        <>
                          <button
                            onClick={() => previewFile(implementation[field])}
                            className="text-blue-500 hover:underline text-sm flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" /> View
                          </button>

                          <a
                            href={`/implementation/download/${field}?url=${encodeURIComponent(
                              implementation[field]
                            )}`}
                            className="text-green-600 hover:underline text-sm flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" /> Download
                          </a>
                        </>
                      )}
                    </div>

                    {fileExists && (
                      <button
                        onClick={() => deleteFile(field)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:opacity-50"
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Delete'}
                      </button>
                    )}
                  </div>

                  {fileExists && (
                    <p className="text-sm text-yellow-600 mt-1">
                      A file has already been uploaded. You must delete it before uploading a new one.
                    </p>
                  )}

                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="file"
                      onChange={(e) => setData(field, e.target.files[0])}
                      className="block text-sm text-gray-500"
                      disabled={fileExists || !canUploadLiquidation}
                    />
                    <button
                      onClick={() => upload(field)}
                      disabled={!data[field] || fileExists || isLoading || !canUploadLiquidation}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Upload'}
                    </button>
                    {!canUploadLiquidation && (
                      <p className="text-red-500 text-sm mt-1">
                        You must reach 100% in tag allocation before uploading the liquidation report.
                      </p>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="bg-white rounded-lg max-w-3xl w-full p-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-0 right-0 text-red-600 hover:text-red-800 text-3xl font-bold"
              onClick={() => setPreviewUrl(null)}
              aria-label="Close"
            >
              &times;
            </button>

            {previewType === 'image' && (
              <img src={previewUrl} alt="Preview" className="w-full max-h-[80vh] object-contain" />
            )}

            {previewType === 'pdf' && (
              <iframe src={previewUrl} className="w-full h-[80vh] border" title="PDF Preview" />
            )}

            {previewType === 'other' && (
              <p className="text-center text-gray-700">No preview available for this file type.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
