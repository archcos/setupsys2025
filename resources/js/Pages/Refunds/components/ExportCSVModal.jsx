import React, { useState, useMemo } from "react";
import {
    Download,
    X,
    FileSpreadsheet,
    Calendar,
    Filter,
    Building2,
    Search,
    ChevronDown,
    ChevronUp,
    Loader2,
} from "lucide-react";
import { MONTHS } from "../constants/refundConstants";

export default function ExportCsvModal({
    isOpen,
    onClose,
    selectedMonth,
    selectedYear,
    availableYears,
    statusFilter,
    includeAll,
    includeWithdrawn,
    includeTerminated,
    officeFilter,
    offices,
    isRPMO,
    allProjects = [],
}) {
    const [exportOptions, setExportOptions] = useState({
        year: selectedYear || '',
        month: selectedMonth || '',
        status: statusFilter || '',
        office: officeFilter || '',
        include_withdrawn: includeWithdrawn || false,
        include_terminated: includeTerminated || false,
        selectProjects: false,
        selectedProjects: [],
        projectSearch: '',
    });
    
    const [showProjectList, setShowProjectList] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const sortedProjects = useMemo(() => {
        return [...allProjects].sort((a, b) => {
            const aNum = parseInt(String(a.project_id).replace(/\D/g, '')) || 0;
            const bNum = parseInt(String(b.project_id).replace(/\D/g, '')) || 0;
            return bNum - aNum;
        });
    }, [allProjects]);

    const filteredProjects = useMemo(() => {
        if (!exportOptions.projectSearch) return sortedProjects;
        const search = exportOptions.projectSearch.toLowerCase();
        return sortedProjects.filter(project => 
            String(project.project_id).toLowerCase().includes(search) ||
            (project.project_title || '').toLowerCase().includes(search) ||
            (project.company_name || '').toLowerCase().includes(search)
        );
    }, [sortedProjects, exportOptions.projectSearch]);

    const handleExport = () => {
        setIsExporting(true);
        
        const params = new URLSearchParams();
        
        if (exportOptions.year) {
            params.append('year', exportOptions.year);
            if (exportOptions.month) {
                params.append('month', exportOptions.month);
            }
        }
        
        if (exportOptions.status) {
            params.append('status', exportOptions.status);
        }
        
        if (exportOptions.office) {
            params.append('office', exportOptions.office);
        }
        
        if (exportOptions.include_withdrawn) {
            params.append('include_withdrawn', '1');
        }
        if (exportOptions.include_terminated) {
            params.append('include_terminated', '1');
        }
        
        if (exportOptions.selectProjects && exportOptions.selectedProjects.length > 0) {
            params.append('project_ids', exportOptions.selectedProjects.join(','));
        }
        
        if (!exportOptions.year) {
            params.append('include_all', '1');
        }
        
        window.location.href = `/refunds/export-csv?${params.toString()}`;
        
        // Reset after download starts
        setTimeout(() => {
            setIsExporting(false);
            onClose();
        }, 2000);
    };

    const updateOption = (key, value) => {
        setExportOptions(prev => {
            const updated = { ...prev, [key]: value };
            if (key === 'year' && !value) {
                updated.month = '';
            }
            return updated;
        });
    };

    const toggleProject = (projectId) => {
        setExportOptions(prev => {
            const selected = prev.selectedProjects.includes(projectId)
                ? prev.selectedProjects.filter(id => id !== projectId)
                : [...prev.selectedProjects, projectId];
            return { ...prev, selectedProjects: selected };
        });
    };

    const selectAllFiltered = () => {
        const allIds = filteredProjects.map(p => p.project_id);
        if (exportOptions.selectedProjects.length === allIds.length) {
            setExportOptions(prev => ({ ...prev, selectedProjects: [] }));
        } else {
            setExportOptions(prev => ({ ...prev, selectedProjects: allIds }));
        }
    };

    const getPeriodText = () => {
        if (!exportOptions.year) return 'All years and months';
        if (!exportOptions.month) return `All months in ${exportOptions.year}`;
        const monthLabel = MONTHS.find(m => m.value == exportOptions.month)?.label || '';
        return `${monthLabel} ${exportOptions.year}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg md:rounded-2xl shadow-2xl max-w-xl w-full p-4 md:p-6 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <FileSpreadsheet className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Export Refunds
                            </h3>
                            <p className="text-sm text-gray-600">
                                Download as Excel with sheets per year
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="space-y-4 mb-6">
                    {/* Period Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Period
                        </label>
                        <div className="flex gap-2">
                            <select
                                value={exportOptions.year}
                                onChange={(e) => updateOption('year', e.target.value)}
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Years</option>
                                {availableYears.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <select
                                value={exportOptions.month}
                                onChange={(e) => updateOption('month', e.target.value)}
                                disabled={!exportOptions.year}
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-100"
                            >
                                <option value="">All Months</option>
                                {MONTHS.map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                        <p className="text-xs text-blue-600 mt-1 font-medium">
                            📅 {getPeriodText()}
                        </p>
                    </div>

                    {/* Status & Office */}
                    <div className="flex gap-2 flex-col sm:flex-row">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Filter className="w-4 h-4 inline mr-1" />
                                Status
                            </label>
                            <select
                                value={exportOptions.status}
                                onChange={(e) => updateOption('status', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Status</option>
                                <option value="paid">Paid</option>
                                <option value="partial">Partial</option>
                                <option value="unpaid">Unpaid</option>
                                <option value="restructured">Restructured</option>
                            </select>
                        </div>

                        {isRPMO && offices?.length > 0 && (
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Building2 className="w-4 h-4 inline mr-1" />
                                    Office
                                </label>
                                <select
                                    value={exportOptions.office}
                                    onChange={(e) => updateOption('office', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Offices</option>
                                    {offices.map((o) => (
                                        <option key={o.office_id} value={o.office_id}>
                                            {o.office_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Project Progress Filters */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Include Projects with Status
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={exportOptions.include_withdrawn}
                                    onChange={(e) => updateOption('include_withdrawn', e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                />
                                <span className="text-sm text-gray-700">Withdrawn</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={exportOptions.include_terminated}
                                    onChange={(e) => updateOption('include_terminated', e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm text-gray-700">Terminated</span>
                            </label>
                        </div>
                    </div>

                    {/* Select Specific Projects */}
                    <div>
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                            <input
                                type="checkbox"
                                checked={exportOptions.selectProjects}
                                onChange={(e) => {
                                    updateOption('selectProjects', e.target.checked);
                                    if (!e.target.checked) {
                                        updateOption('selectedProjects', []);
                                        updateOption('projectSearch', '');
                                    }
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Select Specific Projects
                            </span>
                            <span className="text-xs text-gray-400">
                                ({allProjects.length} available)
                            </span>
                        </label>

                        {exportOptions.selectProjects && (
                            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Search project ID, title, or proponent..."
                                            value={exportOptions.projectSearch}
                                            onChange={(e) => updateOption('projectSearch', e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setShowProjectList(!showProjectList)}
                                        className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0"
                                    >
                                        {showProjectList ? (
                                            <ChevronUp className="w-4 h-4 text-blue-600" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-blue-600" />
                                        )}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-500">
                                        {exportOptions.selectedProjects.length} selected 
                                        {exportOptions.projectSearch && ` (${filteredProjects.length} found)`}
                                    </span>
                                    {exportOptions.selectedProjects.length > 0 && (
                                        <button
                                            onClick={() => updateOption('selectedProjects', [])}
                                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                                        >
                                            Clear selection
                                        </button>
                                    )}
                                </div>

                                {showProjectList && (
                                    <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                                        {filteredProjects.length > 0 ? (
                                            <>
                                                <button
                                                    onClick={selectAllFiltered}
                                                    className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 border-b font-medium sticky top-0 bg-gray-50 z-10"
                                                >
                                                    {exportOptions.selectedProjects.length === filteredProjects.length && filteredProjects.length > 0
                                                        ? '↩ Deselect All'
                                                        : `✓ Select All (${filteredProjects.length})`}
                                                </button>
                                                {filteredProjects.map((project) => (
                                                    <label
                                                        key={project.project_id}
                                                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={exportOptions.selectedProjects.includes(project.project_id)}
                                                            onChange={() => toggleProject(project.project_id)}
                                                            className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 flex-shrink-0"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-semibold text-gray-900">
                                                                {project.project_id}
                                                            </div>
                                                            <div className="text-xs text-gray-500 truncate">
                                                                {project.project_title}
                                                            </div>
                                                            <div className="text-xs text-gray-400 truncate">
                                                                {project.company_name}
                                                            </div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </>
                                        ) : (
                                            <div className="p-6 text-center">
                                                <p className="text-sm text-gray-500">No matching projects</p>
                                                <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary Box */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 mb-4 border border-blue-200">
                    <p className="text-sm font-semibold text-gray-800 mb-1">
                        📊 Export Summary
                    </p>
                    <ul className="text-xs text-gray-600 space-y-0.5">
                        <li>• Period: <span className="font-medium">{getPeriodText()}</span></li>
                        <li>• Format: Excel (.xlsx) with separate sheets per year</li>
                        <li>• Includes: Project details, refund amounts, payment info, bank details, check/OR numbers</li>
                        {exportOptions.selectProjects && exportOptions.selectedProjects.length > 0 && (
                            <li>• Selected: <span className="font-medium">{exportOptions.selectedProjects.length} projects</span></li>
                        )}
                    </ul>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isExporting}
                        className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Export Excel
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}