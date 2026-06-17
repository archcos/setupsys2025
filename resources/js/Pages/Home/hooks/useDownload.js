// resources/js/Pages/Home/hooks/useDownload.js

import { useCallback, useRef, useState } from 'react';

// Province mapping based on office_id
const PROVINCE_ORDER = [
  'Bukidnon',
  'Camiguin',
  'Lanao del Norte',
  'Misamis Occidental',
  'Misamis Oriental',
];

export function useDownload(filteredProjects, analytics, selectedYear) {
  const [showOfficeModal, setShowOfficeModal] = useState(false);
  const [selectedOffices, setSelectedOffices] = useState([]);
  const [allOffices, setAllOffices] = useState([]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const downloadCSV = useCallback((projects = filteredProjects) => {
    const headers = [
      'Project Title', 
      'Company', 
      'Office', 
      'Province',
      'Stage', 
      'Project Cost'
    ];
    
    const rows = projects.map(p => [
      p.project_title,
      p.company_name,
      p.office_name || 'N/A',
      p.province || 'N/A',
      p.progress || 'No Progress',
      parseFloat(p.project_cost || 0).toFixed(2)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `projects_${selectedYear}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }, [filteredProjects, selectedYear]);

  // Get unique offices from filtered projects
  const getUniqueOffices = useCallback(() => {
    const offices = new Set();
    filteredProjects.forEach(project => {
      if (project.office_name) {
        offices.add(project.office_name);
      }
    });
    return Array.from(offices).sort();
  }, [filteredProjects]);

  // Filter projects by selected offices
  const filterProjectsByOffices = useCallback((projects, offices) => {
    if (offices.length === 0 || offices.length === getUniqueOffices().length) {
      return projects;
    }
    return projects.filter(project => offices.includes(project.office_name));
  }, [getUniqueOffices]);

  const downloadAnalyticsPDF = useCallback((filteredByOffices = null) => {
    // Use filtered projects if provided, otherwise use the original filteredProjects
    const projectsToUse = filteredByOffices || filteredProjects;
    
    if (!projectsToUse || projectsToUse.length === 0) {
      console.warn('No projects to generate report');
      return;
    }
    
    const totalCost = projectsToUse.reduce((sum, p) => sum + (parseFloat(p.project_cost) || 0), 0);
    
    // Calculate withdrawn projects
    const withdrawnProjects = projectsToUse.filter(p => p.progress === 'Withdrawn');
    const withdrawnCost = withdrawnProjects.reduce((sum, p) => sum + (parseFloat(p.project_cost) || 0), 0);
    
    // Calculate terminated projects
    const terminatedProjects = projectsToUse.filter(p => p.progress === 'Terminated');
    const terminatedCost = terminatedProjects.reduce((sum, p) => sum + (parseFloat(p.project_cost) || 0), 0);
    
    // Calculate disapproved projects
    const disapprovedProjects = projectsToUse.filter(p => p.progress === 'Disapproved');
    const disapprovedCost = disapprovedProjects.reduce((sum, p) => sum + (parseFloat(p.project_cost) || 0), 0);
    
    // Calculate completed projects
    const completedProjects = projectsToUse.filter(p => p.progress === 'Completed');
    
    // Calculate In Progress (everything not Completed, Withdrawn, Terminated, or Disapproved)
    const inProgressProjects = projectsToUse.filter(p => 
      p.progress !== 'Completed' && 
      p.progress !== 'Withdrawn' && 
      p.progress !== 'Terminated' && 
      p.progress !== 'Disapproved'
    );
    const inProgressCount = inProgressProjects.length;
    
    // Calculate active projects (excluding Withdrawn, Terminated, and Disapproved)
    // This matches the useAnalytics.js calculation
    const activeProjects = projectsToUse.filter(p => 
      p.progress && !['Withdrawn', 'Terminated', 'Disapproved'].includes(p.progress)
    );
    const activeCost = activeProjects.reduce((sum, p) => sum + (parseFloat(p.project_cost) || 0), 0);
    const activeCount = activeProjects.length;
    
    // Calculate completion rate based on active projects only (excluding withdrawn, terminated, disapproved)
    // This matches the useAnalytics.js calculation
    const completionRate = activeCount > 0 ? parseFloat(((completedProjects.length / activeCount) * 100).toFixed(2)) : 0;
        
    // Calculate province costs based on filtered projects
    const provinceMap = new Map();
    
    projectsToUse.forEach(project => {
      const province = project.province || 'Unknown';
      const cost = parseFloat(project.project_cost) || 0;
      const status = project.progress || 'No Progress';
      
      if (!provinceMap.has(province)) {
        provinceMap.set(province, {
          province,
          totalCost: 0,
          projectCount: 0,
          activeCost: 0,
          activeCount: 0,
          withdrawnCost: 0,
          withdrawnCount: 0,
          terminatedCost: 0,
          terminatedCount: 0,
        });
      }
      
      const data = provinceMap.get(province);
      data.totalCost += cost;
      data.projectCount++;
      
      // Active means not Withdrawn, Terminated, or Disapproved (matches useAnalytics)
      if (status && !['Withdrawn', 'Terminated', 'Disapproved'].includes(status)) {
        data.activeCost += cost;
        data.activeCount++;
      }
      
      if (status === 'Withdrawn') {
        data.withdrawnCost += cost;
        data.withdrawnCount++;
      } else if (status === 'Terminated') {
        data.terminatedCost += cost;
        data.terminatedCount++;
      }
    });
    
    const provinceCostsFormatted = Array.from(provinceMap.values()).map(item => ({
      ...item,
      averageCost: item.projectCount > 0 ? item.totalCost / item.projectCount : 0,
      percentageOfTotal: totalCost > 0 ? (item.totalCost / totalCost) * 100 : 0
    }));

    // Sort province data by predefined order
    const sortByProvinceOrder = (data) => {
      return [...data].sort((a, b) => {
        const indexA = PROVINCE_ORDER.indexOf(a.province);
        const indexB = PROVINCE_ORDER.indexOf(b.province);
        
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.province.localeCompare(b.province);
      });
    };

    // Calculate stage distribution
    const stageMap = new Map();
    projectsToUse.forEach(project => {
      const stage = project.progress || 'No Progress';
      if (!stageMap.has(stage)) {
        stageMap.set(stage, { count: 0 });
      }
      stageMap.get(stage).count++;
    });
    
    const stageDistribution = {};
    stageMap.forEach((value, key) => {
      stageDistribution[key] = {
        count: value.count,
        percentage: projectsToUse.length > 0 ? (value.count / projectsToUse.length) * 100 : 0
      };
    });

    // Calculate terminal distribution
    const terminalDistribution = {
      Withdrawn: {
        count: withdrawnProjects.length,
        percentage: projectsToUse.length > 0 ? (withdrawnProjects.length / projectsToUse.length) * 100 : 0
      },
      Terminated: {
        count: terminatedProjects.length,
        percentage: projectsToUse.length > 0 ? (terminatedProjects.length / projectsToUse.length) * 100 : 0
      },
      Disapproved: {
        count: disapprovedProjects.length,
        percentage: projectsToUse.length > 0 ? (disapprovedProjects.length / projectsToUse.length) * 100 : 0
      }
    };

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Analytics Report - ${selectedYear}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 30px; 
            color: #1f2937;
            line-height: 1.4;
            font-size: 13px;
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px; 
          }
          h1 { 
            color: #6d28d9; 
            margin: 0; 
            font-size: 22px; 
            font-weight: 700;
          }
          h2 { 
            color: #374151; 
            border-bottom: 1.5px solid #e5e7eb; 
            padding-bottom: 6px;
            margin-top: 20px;
            margin-bottom: 12px;
            font-size: 15px;
            font-weight: 700;
          }
          h3 {
            color: #4b5563;
            margin-top: 16px;
            margin-bottom: 8px;
            font-size: 13px;
            font-weight: 700;
          }
          .metadata { 
            text-align: center; 
            color: #6b7280; 
            margin-bottom: 20px;
            font-size: 12px;
          }
          .filter-info {
            background: #f3f4f6;
            padding: 8px 12px;
            border-radius: 6px;
            margin-bottom: 20px;
            font-size: 11px;
            color: #4b5563;
            text-align: center;
          }
          .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 12px; 
            margin: 16px 0;
          }
          .stat-card { 
            background: #f9fafb; 
            padding: 12px 10px; 
            border-radius: 6px; 
            border: 1px solid #e5e7eb;
            text-align: center;
          }
          .stat-card h3 { 
            margin: 0 0 4px 0; 
            color: #6b7280; 
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .stat-card .value { 
            font-size: 24px; 
            font-weight: bold; 
            color: #111827;
            line-height: 1.2;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 10px 0;
            font-size: 12px;
          }
          th { 
            background: #f3f4f6; 
            padding: 8px 10px; 
            text-align: left; 
            font-weight: 600;
            border: 1px solid #d1d5db;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          td { 
            padding: 6px 10px; 
            border: 1px solid #e5e7eb;
          }
          .cost-summary {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            margin: 16px 0;
            overflow: hidden;
          }
          .cost-summary h2 {
            margin: 0;
            padding: 10px 16px;
            background: #f1f5f9;
            border-bottom: 1px solid #e2e8f0;
            font-size: 14px;
          }
          .cost-summary .content {
            padding: 14px;
          }
          .table-section {
            margin-bottom: 16px;
          }
          .table-section h3 {
            font-size: 12px;
            margin-top: 12px;
            margin-bottom: 6px;
          }
          .table-section.active h3 { color: #2563eb; }
          .table-section.withdrawn h3 { color: #d97706; }
          .table-section.terminated h3 { color: #dc2626; }
          .overall-total {
            background: #eef2ff;
            border: 1.5px solid #a5b4fc;
            padding: 10px 16px;
            border-radius: 6px;
            margin-top: 16px;
          }
          .overall-total table {
            margin: 0;
          }
          .overall-total th {
            background: #e0e7ff;
            font-size: 12px;
            font-weight: 700;
          }
          .overall-total td {
            font-size: 12px;
            font-weight: 700;
          }
          .footer { 
            text-align: center; 
            font-size: 10px; 
            color: #9ca3af;
          }
          .empty-state {
            text-align: center;
            color: #9ca3af;
            padding: 12px;
            font-style: italic;
          }
          .page-break {
            page-break-before: always;
          }
          @media print {
            body { padding: 15px; }
            @page { margin: 15mm; }
            .page-break {
              page-break-before: always;
            }
          }
                  .note {
        font-size: 10px;
        color: #6b7280;
        font-style: italic;
        margin-top: 4px;
        text-align: center;
        background: #fef3c7;
        padding: 6px 12px;
        border-radius: 6px;
        display: inline-block;
      }
      .summary-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        flex-wrap: wrap;
        gap: 10px;
      }
        </style>
      </head>
      <body>
        <!-- PAGE 1: Summary and Distributions -->
        <div class="header">
          <h1>Project Analytics Report</h1>
          <div class="metadata">
            <p>Reporting Period: ${selectedYear}</p>
            <p>Generated: ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </div>
        
        <div class="summary-header">
            <h2>Project Summary</h2>
            <div class="note">
                ⓘ Note: Completion rate excludes Withdrawn and Terminated projects
            </div>
            </div>
            <div class="stats-grid">
          <div class="stat-card">
            <h3>Total Projects</h3>
            <div class="value">${projectsToUse.length}</div>
          </div>
          <div class="stat-card">
            <h3>Completed</h3>
            <div class="value">${completedProjects.length}</div>
          </div>
          <div class="stat-card">
            <h3>In Progress</h3>
            <div class="value">${inProgressCount}</div>
          </div>
          <div class="stat-card">
            <h3>Withdrawn</h3>
            <div class="value">${withdrawnProjects.length}</div>
          </div>
          <div class="stat-card">
            <h3>Terminated</h3>
            <div class="value">${terminatedProjects.length}</div>
          </div>
          <div class="stat-card">
            <h3>Completion Rate</h3>
            <div class="value">${completionRate.toFixed(2)}%</div>
          </div>
        </div>
        
        <h2>Stage Distribution</h2>
        <table>
          <tr>
            <th>Stage</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
          ${Object.entries(stageDistribution).map(([stage, data]) => `
            <tr>
              <td>${stage}</td>
              <td>${data.count}</td>
              <td>${data.percentage.toFixed(1)}%</td>
            </tr>
          `).join('')}
        </table>
        
        <h2>Terminal States</h2>
        <table>
          <tr>
            <th>Status</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
          <tr>
            <td>Withdrawn</td>
            <td>${terminalDistribution.Withdrawn.count}</td>
            <td>${terminalDistribution.Withdrawn.percentage.toFixed(1)}%</td>
          </tr>
          <tr>
            <td>Terminated</td>
            <td>${terminalDistribution.Terminated.count}</td>
            <td>${terminalDistribution.Terminated.percentage.toFixed(1)}%</td>
          </tr>
          <tr>
            <td>Disapproved</td>
            <td>${terminalDistribution.Disapproved.count}</td>
            <td>${terminalDistribution.Disapproved.percentage.toFixed(1)}%</td>
          </tr>
        </table>

        <div class="footer">
          <p>This report was automatically generated by the SETUP Information Management System (SIMS).</p>
          <p>&copy; ${new Date().getFullYear()} - All Rights Reserved | Page 1 of 2</p>
        </div>

        <!-- PAGE 2: Project Cost by Province -->
        <div class="page-break">
          <div class="header">
            <h1>Project Cost by Province</h1>
            <div class="metadata">
              <p>Reporting Period: ${selectedYear}</p>
              <p>Generated: ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
          </div>
        </div>
        
        <div class="cost-summary">
          <div class="content">            
            <!-- Active Projects Table -->
            <div class="table-section active">
              <h3>Active Projects</h3>
              <table>
                <tr>
                  <th>Province</th>
                  <th>Projects</th>
                  <th>Total Cost</th>
                  <th>Average Cost</th>
                </tr>
                ${sortByProvinceOrder(provinceCostsFormatted)
                  .filter(item => item.activeCount > 0)
                  .map((item) => `
                    <tr>
                      <td>${item.province}</td>
                      <td>${item.activeCount}</td>
                      <td>${formatCurrency(item.activeCost)}</td>
                      <td>${item.activeCount > 0 ? formatCurrency(item.activeCost / item.activeCount) : formatCurrency(0)}</td>
                    </tr>
                  `).join('')}
                ${sortByProvinceOrder(provinceCostsFormatted).filter(item => item.activeCount > 0).length === 0 ? `
                  <tr>
                    <td colspan="4" class="empty-state">No active projects</td>
                  </tr>
                ` : ''}
                <tr style="font-weight: bold; background: #eff6ff;">
                  <td>Active Subtotal</td>
                  <td>${activeCount}</td>
                  <td>${formatCurrency(activeCost)}</td>
                  <td>-</td>
                </tr>
              </table>
            </div>

            <!-- Withdrawn Projects Table -->
            <div class="table-section withdrawn">
              <h3>Withdrawn Projects</h3>
              <table>
                <tr>
                  <th>Province</th>
                  <th>Projects</th>
                  <th>Total Cost</th>
                  <th>Average Cost</th>
                </tr>
                ${sortByProvinceOrder(provinceCostsFormatted)
                  .filter(item => item.withdrawnCount > 0)
                  .map((item) => `
                    <tr>
                      <td>${item.province}</td>
                      <td>${item.withdrawnCount}</td>
                      <td>${formatCurrency(item.withdrawnCost)}</td>
                      <td>${item.withdrawnCount > 0 ? formatCurrency(item.withdrawnCost / item.withdrawnCount) : formatCurrency(0)}</td>
                    </tr>
                  `).join('')}
                ${sortByProvinceOrder(provinceCostsFormatted).filter(item => item.withdrawnCount > 0).length === 0 ? `
                  <tr>
                    <td colspan="4" class="empty-state">No withdrawn projects</td>
                  </tr>
                ` : ''}
                <tr style="font-weight: bold; background: #fffbeb;">
                  <td>Withdrawn Subtotal</td>
                  <td>${withdrawnProjects.length}</td>
                  <td>${formatCurrency(withdrawnCost)}</td>
                  <td>-</td>
                </tr>
              </table>
            </div>

            <!-- Terminated Projects Table -->
            <div class="table-section terminated">
              <h3>Terminated Projects</h3>
              <table>
                <tr>
                  <th>Province</th>
                  <th>Projects</th>
                  <th>Total Cost</th>
                  <th>Average Cost</th>
                </tr>
                ${sortByProvinceOrder(provinceCostsFormatted)
                  .filter(item => item.terminatedCount > 0)
                  .map((item) => `
                    <tr>
                      <td>${item.province}</td>
                      <td>${item.terminatedCount}</td>
                      <td>${formatCurrency(item.terminatedCost)}</td>
                      <td>${item.terminatedCount > 0 ? formatCurrency(item.terminatedCost / item.terminatedCount) : formatCurrency(0)}</td>
                    </tr>
                  `).join('')}
                ${sortByProvinceOrder(provinceCostsFormatted).filter(item => item.terminatedCount > 0).length === 0 ? `
                  <tr>
                    <td colspan="4" class="empty-state">No terminated projects</td>
                  </tr>
                ` : ''}
                <tr style="font-weight: bold; background: #fef2f2;">
                  <td>Terminated Subtotal</td>
                  <td>${terminatedProjects.length}</td>
                  <td>${formatCurrency(terminatedCost)}</td>
                  <td>-</td>
                </tr>
              </table>
            </div>
            
            <!-- Overall Total -->
            <div class="overall-total">
              <table>
                <tr>
                  <th>Overall Total</th>
                  <th>${projectsToUse.length} Projects</th>
                  <th>${formatCurrency(totalCost)}</th>
                  <th>${projectsToUse.length > 0 ? formatCurrency(totalCost / projectsToUse.length) : formatCurrency(0)}</th>
                </tr>
              </table>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>This report was automatically generated by the SETUP Information Management System (SIMS).</p>
          <p>&copy; ${new Date().getFullYear()} - All Rights Reserved | Page 2 of 2</p>
        </div>
      </body>
      </html>
    `;
    
    // Create a hidden iframe to load the content and trigger print
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(content);
    iframeDoc.close();
    
    // Use a single event listener with a flag to prevent double firing
    let printTriggered = false;
    
    const triggerPrint = () => {
      if (printTriggered) return;
      printTriggered = true;
      
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      
      // Clean up iframe after print dialog closes
      iframe.contentWindow.onafterprint = () => {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 100);
      };
      
      // Fallback cleanup in case onafterprint doesn't fire
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 60000); // Clean up after 1 minute max
    };
    
    // Try to wait for iframe to load, then print
    iframe.onload = () => {
      setTimeout(triggerPrint, 500);
    };
    
    // Fallback if onload doesn't fire
    setTimeout(triggerPrint, 1000);
  }, [filteredProjects, selectedYear]);

  // New function to open office selection modal
  const openOfficeSelection = useCallback(() => {
    const offices = getUniqueOffices();
    setAllOffices(offices);
    setSelectedOffices([...offices]); // Default select all
    setShowOfficeModal(true);
  }, [getUniqueOffices]);

  // Handle office selection toggle
  const toggleOfficeSelection = useCallback((office) => {
    setSelectedOffices(prev => {
      if (prev.includes(office)) {
        return prev.filter(o => o !== office);
      } else {
        return [...prev, office];
      }
    });
  }, []);

  // Handle select all
  const selectAllOffices = useCallback(() => {
    setSelectedOffices([...allOffices]);
  }, [allOffices]);

  // Handle clear all
  const clearAllOffices = useCallback(() => {
    setSelectedOffices([]);
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setShowOfficeModal(false);
  }, []);

  // Generate report with selected offices
  const generateReportWithOffices = useCallback(() => {
    const filteredProjectsByOffice = filterProjectsByOffices(filteredProjects, selectedOffices);
    downloadAnalyticsPDF(filteredProjectsByOffice);
    setShowOfficeModal(false);
  }, [filteredProjects, selectedOffices, filterProjectsByOffices, downloadAnalyticsPDF]);

  // Wrapper function for the original downloadAnalyticsPDF with modal
  const downloadAnalyticsPDFWithModal = useCallback(() => {
    const offices = getUniqueOffices();
    if (offices.length === 0) {
      downloadAnalyticsPDF(filteredProjects);
    } else {
      openOfficeSelection();
    }
  }, [getUniqueOffices, downloadAnalyticsPDF, filteredProjects, openOfficeSelection]);

  return { 
    downloadCSV, 
    downloadAnalyticsPDF: downloadAnalyticsPDFWithModal,
    showOfficeModal,
    selectedOffices,
    allOffices,
    toggleOfficeSelection,
    selectAllOffices,
    clearAllOffices,
    closeModal,
    generateReportWithOffices
  };
}