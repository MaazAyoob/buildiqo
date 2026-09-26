import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  RefreshCw, 
  Download, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Layers, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Building2,
  FileText,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { INDIAN_STATES } from '../data/states';
import { apiRequest } from '../utils/apiClient';

export function CommercialBOQPage({ setRoute }) {
  // Page Workflow State: 'upload' | 'parsing' | 'summary' | 'editor'
  const [viewState, setViewState] = useState('upload');
  const [parsingStep, setParsingStep] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Commercial BOQ Data Model
  const [boqData, setBoqData] = useState(null);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNeedsReview, setFilterNeedsReview] = useState(false);
  const [materialPanelOpen, setMaterialPanelOpen] = useState(true);

  // Price Search Engine State (Phase 1.5 Commercial Upgrade)
  const [priceSearchModalOpen, setPriceSearchModalOpen] = useState(false);
  const [priceSearchQuery, setPriceSearchQuery] = useState('');
  const [priceSearchState, setPriceSearchState] = useState('Karnataka');
  const [priceSearchCategory, setPriceSearchCategory] = useState('ALL');
  const [priceSearchResults, setPriceSearchResults] = useState([]);
  const [isSearchingPrices, setIsSearchingPrices] = useState(false);

  const fileInputRef = useRef(null);

  // Parsing Progress Simulation
  const parsingSteps = [
    'Validating Excel binary structure...',
    'Inspecting worksheets & identifying column headers...',
    'Extracting sections, item rows & preserving formula metadata...',
    'Classifying direct materials vs compound work schedules...',
    'Attaching authoritative state pricing benchmarks...'
  ];

  // Helper: Format Currency (INR)
  const formatINR = (val) => {
    const num = Number(val) || 0;
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Helper: Recalculate local BOQ state deterministically
  const recalculateLocalBOQ = (data) => {
    let boqSubtotal = 0;
    const summaryBreakdown = [];

    const updatedSheets = data.sheets.map(sheet => {
      if (sheet.isSummarySheet) return sheet;

      let sheetSubtotal = 0;
      const updatedSections = sheet.sections.map(sec => {
        let secSubtotal = 0;
        const updatedRows = sec.rows.map(row => {
          let qty = Number(row.quantity) || 0;
          if (row.quantityBasis === 'siteQuantity' && row.siteQuantity !== null && row.siteQuantity !== undefined) {
            qty = Number(row.siteQuantity) || 0;
          } else if (row.quantityBasis === 'designQuantity' && row.designQuantity !== null && row.designQuantity !== undefined) {
            qty = Number(row.designQuantity) || 0;
          }
          const rate = Number(row.currentRate) || 0;
          const amt = Math.round(qty * rate * 100) / 100;
          secSubtotal = Math.round((secSubtotal + amt) * 100) / 100;
          return { ...row, amount: amt };
        });

        summaryBreakdown.push({
          sheetName: sheet.name,
          sectionCode: sec.code || '',
          sectionName: sec.name,
          subtotal: secSubtotal
        });

        sheetSubtotal = Math.round((sheetSubtotal + secSubtotal) * 100) / 100;
        return { ...sec, subtotal: secSubtotal, rows: updatedRows };
      });

      boqSubtotal = Math.round((boqSubtotal + sheetSubtotal) * 100) / 100;
      return { ...sheet, subtotal: sheetSubtotal, sections: updatedSections };
    });

    const gstRate = data.gstRate !== undefined ? Number(data.gstRate) : 18;
    const gstAmount = Math.round(boqSubtotal * (gstRate / 100) * 100) / 100;
    const grandTotal = Math.round((boqSubtotal + gstAmount) * 100) / 100;

    return {
      ...data,
      sheets: updatedSheets,
      totals: {
        subtotal: boqSubtotal,
        gstRate,
        gstAmount,
        grandTotal,
        summaryBreakdown
      }
    };
  };

  // Upload handler
  const handleFileUpload = async (file) => {
    if (!file) return;
    setIsUploading(true);
    setErrorMsg('');
    setViewState('parsing');
    setParsingStep(0);

    const stepTimer = setInterval(() => {
      setParsingStep(prev => (prev < parsingSteps.length - 1 ? prev + 1 : prev));
    }, 600);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pricingState', boqData?.pricingState || 'Karnataka');
      formData.append('gstRate', '18');

      const res = await apiRequest('/api/commercial-boq/upload', {
        method: 'POST',
        body: formData
      });

      clearInterval(stepTimer);
      setBoqData(res.data);
      // Auto transition to editor after showing summary
      setViewState('summary');
    } catch (err) {
      clearInterval(stepTimer);
      setErrorMsg(err.message || 'Failed to parse Excel workbook.');
      setViewState('upload');
    } finally {
      setIsUploading(false);
    }
  };

  // Load sample reference workbook (TWC Kasthuri Nagar)
  const handleLoadSampleBOQ = async () => {
    setIsUploading(true);
    setErrorMsg('');
    setViewState('parsing');
    setParsingStep(0);

    const stepTimer = setInterval(() => {
      setParsingStep(prev => (prev < parsingSteps.length - 1 ? prev + 1 : prev));
    }, 500);

    try {
      const fixtureRes = await apiRequest('/api/commercial-boq/sample', {
        method: 'POST'
      });

      clearInterval(stepTimer);
      if (fixtureRes?.data) {
        setBoqData(fixtureRes.data);
        setViewState('summary');
      } else {
        setViewState('upload');
        if (fileInputRef.current) fileInputRef.current.click();
      }
    } catch (err) {
      clearInterval(stepTimer);
      setErrorMsg('Please select an Excel file from your computer.');
      setViewState('upload');
    } finally {
      setIsUploading(false);
    }
  };

  // State Change Handler
  const handleStateChange = async (newState) => {
    if (!boqData) return;
    try {
      setIsSaving(true);
      // Refresh benchmarks from pricing service
      const res = await apiRequest('/api/pricing/current?state=' + encodeURIComponent(newState));
      const ratesMap = res.data?.rates || {};

      // Enrich rows with new state benchmarks without changing currentRate
      const updated = {
        ...boqData,
        pricingState: newState,
        pricingScope: res.data?.pricingScope || 'STATE',
        pricingSnapshot: {
          stateName: newState,
          rates: ratesMap
        },
        sheets: boqData.sheets.map(sheet => ({
          ...sheet,
          sections: sheet.sections.map(sec => ({
            ...sec,
            rows: sec.rows.map(row => {
              if (row.materialCode && ratesMap[row.materialCode]) {
                const m = ratesMap[row.materialCode];
                return {
                  ...row,
                  latestMaterialRate: m.unitRate || m.rate,
                  materialRateSource: m.pricingScope === 'NATIONAL' ? 'NATIONAL' : 'STATE',
                  materialPricingScope: m.pricingScope
                };
              }
              return row;
            })
          }))
        }))
      };

      setBoqData(recalculateLocalBOQ(updated));
      setSaveSuccessMsg(`Pricing location updated to ${newState}. Live benchmarks refreshed.`);
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('Failed to update state pricing: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Refresh Benchmarks
  const handleRefreshBenchmarks = async () => {
    if (!boqData) return;
    await handleStateChange(boqData.pricingState || 'Karnataka');
  };

  // Row Edit Handlers
  const handleCellEdit = (sheetIndex, sectionIndex, rowIndex, field, value) => {
    const updated = { ...boqData };
    const row = updated.sheets[sheetIndex].sections[sectionIndex].rows[rowIndex];
    
    if (field === 'currentRate') {
      const numVal = parseFloat(value) || 0;
      row.currentRate = numVal;
      row.rateSource = 'MANUAL'; // Explicit manual audit
    } else if (field === 'quantity') {
      row.quantity = parseFloat(value) || 0;
    } else if (field === 'siteQuantity') {
      row.siteQuantity = parseFloat(value) || 0;
    } else if (field === 'designQuantity') {
      row.designQuantity = parseFloat(value) || 0;
    } else if (field === 'quantityBasis') {
      row.quantityBasis = value;
    } else {
      row[field] = value;
    }

    setBoqData(recalculateLocalBOQ(updated));
  };

  // Apply Benchmark Rate to Row (Strict Compatibility Guard)
  const handleApplyRate = (sheetIndex, sectionIndex, rowIndex) => {
    const updated = { ...boqData };
    const row = updated.sheets[sheetIndex].sections[sectionIndex].rows[rowIndex];

    if (row.compatibilityStatus !== 'COMPATIBLE') {
      setErrorMsg(`Cannot apply benchmark: "${row.description}" is a compound work item. Commercial rates must be edited manually.`);
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    if (!row.latestMaterialRate) {
      setErrorMsg(`No benchmark rate available for ${row.materialName || 'this item'}.`);
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    const prevRate = row.currentRate;
    row.currentRate = row.latestMaterialRate;
    row.rateSource = row.materialRateSource || 'STATE';

    if (!row.rateHistory) row.rateHistory = [];
    row.rateHistory.push({
      originalRate: prevRate,
      updatedRate: row.latestMaterialRate,
      rateSource: row.rateSource,
      changedAt: new Date().toISOString(),
      reason: 'Applied approved Buildiqo benchmark'
    });

    setBoqData(recalculateLocalBOQ(updated));
    setSaveSuccessMsg(`Applied ${row.materialRateSource || 'STATE'} benchmark (₹${row.latestMaterialRate}) to "${row.description.slice(0, 25)}..."`);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // Add Custom Row to Current Section
  const handleAddRow = (sheetIndex, sectionIndex) => {
    const updated = { ...boqData };
    const targetSection = updated.sheets[sheetIndex].sections[sectionIndex];
    const newRowId = `custom_${Date.now()}`;

    const newRow = {
      id: newRowId,
      itemNo: `${targetSection.rows.length + 1}`,
      description: 'New custom BOQ item',
      specification: '',
      make: '',
      unit: 'Nos',
      quantity: 1,
      designQuantity: null,
      siteQuantity: null,
      quantityBasis: 'quantity',
      originalRate: 0,
      currentRate: 0,
      amount: 0,
      rateSource: 'MANUAL',
      comments: '',
      materialCode: null,
      materialName: '',
      compatibilityStatus: 'INCOMPATIBLE',
      classificationStatus: 'UNMATCHED',
      latestMaterialRate: null
    };

    targetSection.rows.push(newRow);
    setBoqData(recalculateLocalBOQ(updated));
  };

  // Delete Row
  const handleDeleteRow = (sheetIndex, sectionIndex, rowIndex) => {
    const updated = { ...boqData };
    updated.sheets[sheetIndex].sections[sectionIndex].rows.splice(rowIndex, 1);
    setBoqData(recalculateLocalBOQ(updated));
  };

  // Save BOQ to backend (Supports drafts and unsaved workbooks)
  const handleSaveBOQ = async () => {
    if (!boqData) return;
    setIsSaving(true);
    setErrorMsg('');
    try {
      const res = await apiRequest('/api/commercial-boq/save', {
        method: 'POST',
        body: JSON.stringify(boqData)
      });
      if (res?.data?._id) {
        setBoqData(prev => ({ ...prev, _id: res.data._id }));
      }
      setSaveSuccessMsg('Commercial BOQ successfully saved.');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save BOQ.');
    } finally {
      setIsSaving(false);
    }
  };

  // Export to Excel (POST with payload ensures in-memory edits and drafts download valid .xlsx files)
  const handleExportExcel = async () => {
    if (!boqData) return;
    setIsExporting(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('buildiqo_token');
      const response = await fetch('/api/commercial-boq/export/excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ boqData })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to generate Excel export.');
      }

      const blob = await response.blob();
      const cleanName = (boqData.fileName || 'Commercial_BOQ').replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanName}_Buildiqo_Edited.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setSaveSuccessMsg('Excel BOQ downloaded successfully.');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to download Excel export.');
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PDF (POST with payload ensures in-memory edits and drafts download valid .pdf files)
  const handleExportPDF = async () => {
    if (!boqData) return;
    setIsExporting(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('buildiqo_token');
      const response = await fetch('/api/commercial-boq/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ boqData })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to generate PDF report.');
      }

      const blob = await response.blob();
      const cleanName = (boqData.fileName || 'Commercial_BOQ').replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanName}_Buildiqo_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setSaveSuccessMsg('PDF Report downloaded successfully.');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to download PDF export.');
    } finally {
      setIsExporting(false);
    }
  };

  // Price Search Engine Handlers
  const handleSearchPrices = async (q, stateOverride, catOverride) => {
    setIsSearchingPrices(true);
    try {
      const stateToUse = stateOverride || priceSearchState || boqData?.pricingState || 'Karnataka';
      const catToUse = catOverride !== undefined ? catOverride : priceSearchCategory;
      const queryStr = q !== undefined ? q : priceSearchQuery;
      
      const url = `/api/pricing/search?q=${encodeURIComponent(queryStr || '')}&state=${encodeURIComponent(stateToUse)}&category=${encodeURIComponent(catToUse)}`;
      const res = await apiRequest(url);
      if (res?.success && Array.isArray(res.data)) {
        setPriceSearchResults(res.data);
      }
    } catch (e) {
      console.warn('Failed to search prices:', e);
    } finally {
      setIsSearchingPrices(false);
    }
  };

  const handleInsertSearchedMaterial = (mat) => {
    if (!boqData?.sheets?.[activeSheetIndex]) return;
    const updated = { ...boqData };
    const currentSheet = updated.sheets[activeSheetIndex];
    if (!currentSheet.sections || currentSheet.sections.length === 0) {
      currentSheet.sections = [{ id: 'sec_1', name: 'General Works', rows: [] }];
    }
    const targetSection = currentSheet.sections[0];
    const newRowId = `item_search_${Date.now()}`;
    const newRow = {
      id: newRowId,
      itemNo: `${targetSection.rows.length + 1}`,
      description: `${mat.name} (${mat.description || mat.category})`,
      specification: `Benchmark rate verified via ${mat.pricingSource || 'Buildiqo'}`,
      make: mat.name,
      unit: mat.unit || 'Nos',
      quantity: 1,
      designQuantity: 1,
      siteQuantity: 1,
      quantityBasis: 'quantity',
      originalRate: mat.unitRate,
      currentRate: mat.unitRate,
      amount: mat.unitRate,
      rateSource: mat.pricingScope || 'STATE',
      comments: `Added from Price Search Engine (${mat.pricingSource})`,
      materialCode: mat.materialCode,
      materialName: mat.name,
      compatibilityStatus: 'COMPATIBLE',
      classificationStatus: 'MATCHED_DIRECT',
      latestMaterialRate: mat.unitRate
    };
    targetSection.rows.push(newRow);
    setBoqData(recalculateLocalBOQ(updated));
    setSaveSuccessMsg(`Inserted "${mat.name}" (₹${mat.unitRate}/${mat.unit}) into ${currentSheet.name}`);
    setTimeout(() => setSaveSuccessMsg(''), 3500);
  };

  // Material Matches Summary calculation
  const materialMatchesSummary = useMemo(() => {
    if (!boqData?.sheets) return [];
    const matMap = {};

    for (const sheet of boqData.sheets) {
      if (sheet.isSummarySheet) continue;
      for (const sec of sheet.sections) {
        for (const row of sec.rows) {
          if (row.materialCode) {
            if (!matMap[row.materialCode]) {
              matMap[row.materialCode] = {
                code: row.materialCode,
                name: row.materialName,
                category: row.materialCategory,
                latestRate: row.latestMaterialRate,
                unit: row.latestMaterialRateUnit,
                source: row.materialRateSource,
                compatibleCount: 0,
                referenceOnlyCount: 0
              };
            }
            if (row.compatibilityStatus === 'COMPATIBLE') {
              matMap[row.materialCode].compatibleCount++;
            } else {
              matMap[row.materialCode].referenceOnlyCount++;
            }
          }
        }
      }
    }

    return Object.values(matMap);
  }, [boqData]);

  // Current active sheet
  const activeSheet = boqData?.sheets ? boqData.sheets[activeSheetIndex] : null;

  return (
    <div className="space-y-6 pb-20">
      
      {/* ================= TOP HEADER BANNER ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Commercial BOQ Workspace
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                  Live QS Engine
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Multi-discipline Excel import, material rate intelligence & live contract editor.
              </p>
            </div>
          </div>

          {/* Pricing State Authority & File Info */}
          {boqData && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-slate-500 font-semibold">Pricing State:</span>
                <select
                  value={boqData.pricingState || 'Karnataka'}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
                >
                  {INDIAN_STATES.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-slate-700 font-medium truncate max-w-[150px] sm:max-w-[200px]" title={boqData.fileName}>
                  {boqData.fileName || 'Uploaded BOQ'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Alerts & Notifications */}
        {errorMsg && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {saveSuccessMsg && (
          <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* ================= STEP 1: UPLOAD DROPZONE ================= */}
      {viewState === 'upload' && (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 hover:border-blue-400 p-8 sm:p-14 text-center transition-all">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileUpload(e.target.files[0])}
            accept=".xlsx,.xls"
            className="hidden"
          />

          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
              <Upload className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Upload Commercial BOQ Excel</h3>
              <p className="text-xs text-slate-500 mt-1">
                Supports multi-sheet workbooks with varying header structures (Summary, Civil, Plumbing, Electrical).
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Select XLSX File</span>
              </button>

              <button
                onClick={handleLoadSampleBOQ}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Load TWC Kasthuri Nagar BOQ</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
              <p>• Flexible header detection: SR. NO, DESCRIPTION, UNIT, QTY, DESIGN/SITE QTY, RATE, AMOUNT</p>
              <p>• Multi-page parsing without formula evaluation or raw material rate corruption</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 2: PARSING PROGRESS ================= */}
      {viewState === 'parsing' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto animate-pulse">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-900">Parsing Commercial BOQ</h3>
            <p className="text-xs text-slate-500 mt-1">
              {parsingSteps[parsingStep] || 'Analyzing contract rows...'}
            </p>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${((parsingStep + 1) / parsingSteps.length) * 100}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-400">
            Applying real-world column normalization and Indian state rate mapping.
          </p>
        </div>
      )}

      {/* ================= STEP 3: PRE-EDITOR SUMMARY ================= */}
      {viewState === 'summary' && boqData && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 max-w-2xl mx-auto shadow-sm">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">BOQ Import Complete</h3>
              <p className="text-xs text-slate-500">
                File: {boqData.fileName} • Pricing State: {boqData.pricingState}
              </p>
            </div>
          </div>

          {/* Detection Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl text-center">
              <span className="block text-xl font-black text-slate-900">{boqData.sheets.length}</span>
              <span className="text-[11px] text-slate-500 font-semibold">Sheets Detected</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl text-center">
              <span className="block text-xl font-black text-slate-900">{boqData.stats?.totalSections || 0}</span>
              <span className="text-[11px] text-slate-500 font-semibold">Trade Sections</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl text-center">
              <span className="block text-xl font-black text-slate-900">{boqData.stats?.totalRows || 0}</span>
              <span className="text-[11px] text-slate-500 font-semibold">Contract Items</span>
            </div>
            <div className="bg-blue-50 border border-blue-200/80 p-3.5 rounded-xl text-center">
              <span className="block text-xl font-black text-blue-700">{materialMatchesSummary.length}</span>
              <span className="text-[11px] text-blue-600 font-semibold">Material Matches</span>
            </div>
          </div>

          {/* Architectural Separation Notice */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
            <div className="flex items-center space-x-2 font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Commercial Separation Guaranteed</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Imported commercial rates represent full contractor trade rates (e.g. RCC lintels including labour, shuttering, concrete). 
              Raw material benchmarks (Cement, Steel) are attached for reference intelligence and will never overwrite commercial rates automatically.
            </p>
          </div>

          {/* Open Editor Button */}
          <button
            onClick={() => setViewState('editor')}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
          >
            <span>Open BOQ Editor</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= STEP 4: MAIN SAME-PAGE BOQ EDITOR ================= */}
      {viewState === 'editor' && boqData && (
        <div className="space-y-6">

          {/* Action Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleRefreshBenchmarks}
                disabled={isSaving}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
                title="Refresh latest state material prices without modifying contract rates"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
                <span>Refresh Benchmarks</span>
              </button>

              <button
                onClick={() => handleAddRow(activeSheetIndex, 0)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>

              <button
                onClick={() => setMaterialPanelOpen(!materialPanelOpen)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 ${
                  materialPanelOpen ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Material Intelligence ({materialMatchesSummary.length})</span>
              </button>

              <button
                onClick={() => {
                  setPriceSearchModalOpen(true);
                  handleSearchPrices(priceSearchQuery, boqData?.pricingState || 'Karnataka', priceSearchCategory);
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
                title="Search live material prices across Indian states and insert into BOQ"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Price Search Engine</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportExcel}
                disabled={isExporting}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>

              <button
                onClick={handleSaveBOQ}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save BOQ'}</span>
              </button>
            </div>
          </div>

          {/* ================= MATERIAL INTELLIGENCE PANEL ================= */}
          {materialPanelOpen && materialMatchesSummary.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50/70 via-slate-50 to-indigo-50/50 rounded-2xl border border-blue-200/80 p-5 shadow-xs transition-all">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Material Benchmark Intelligence ({boqData.pricingState} State Authority)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 italic">
                  Raw material benchmarks are displayed for market awareness. Compound work rates remain independent.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {materialMatchesSummary.map(m => (
                  <div key={m.code} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate" title={m.name}>{m.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        m.source === 'STATE' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {m.source || 'State'}
                      </span>
                    </div>

                    <div className="flex items-baseline space-x-1">
                      <span className="text-base font-black text-slate-900">
                        {m.latestRate ? formatINR(m.latestRate) : 'Unavailable'}
                      </span>
                      <span className="text-[10px] text-slate-500">/ {m.unit || 'unit'}</span>
                    </div>

                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                      <span>{m.compatibleCount} Direct Supply</span>
                      <span>{m.referenceOnlyCount} Reference Only</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= SHEET TABS & SEARCH ================= */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {boqData.sheets.map((s, idx) => (
                <button
                  key={s.name}
                  onClick={() => setActiveSheetIndex(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    activeSheetIndex === idx
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{s.name}</span>
                  <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[9px] ${
                    activeSheetIndex === idx ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {s.isSummarySheet ? 'Summary' : s.sections.reduce((a, b) => a + b.rows.length, 0)}
                  </span>
                </button>
              ))}
            </div>

            {/* Filter & Search Bar */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 sm:w-56"
                />
              </div>

              <button
                onClick={() => setFilterNeedsReview(!filterNeedsReview)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1 ${
                  filterNeedsReview 
                    ? 'bg-amber-100 border-amber-300 text-amber-900' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Needs Review</span>
              </button>
            </div>
          </div>

          {/* ================= TAB 1: SUMMARY SHEET VIEW ================= */}
          {activeSheet?.isSummarySheet && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-black text-slate-900">Commercial Abstract Summary</h2>
                  <p className="text-xs text-slate-500">
                    Deterministic compilation of all trade disciplines and section subtotals.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-700">Contract GST Rate:</span>
                  <select
                    value={boqData.gstRate !== undefined ? boqData.gstRate : 18}
                    onChange={(e) => {
                      const updated = { ...boqData, gstRate: Number(e.target.value) };
                      setBoqData(recalculateLocalBOQ(updated));
                    }}
                    className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 focus:outline-none"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18% (Standard)</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
              </div>

              {/* Summary Schedule Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <th className="py-2.5 px-4 w-12 text-center">#</th>
                      <th className="py-2.5 px-4">Discipline</th>
                      <th className="py-2.5 px-4">Trade Section</th>
                      <th className="py-2.5 px-4 text-right">Subtotal (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {boqData.totals?.summaryBreakdown?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-4 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{item.sheetName}</td>
                        <td className="py-2.5 px-4">{item.sectionCode ? item.sectionCode + ' ' : ''}{item.sectionName}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">{formatINR(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Bottom Totals */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-2 max-w-sm ml-auto">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>BOQ Net Subtotal:</span>
                  <span className="font-mono font-bold text-slate-900">{formatINR(boqData.totals?.subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>GST ({boqData.totals?.gstRate || 18}%):</span>
                  <span className="font-mono font-bold text-slate-900">{formatINR(boqData.totals?.gstAmount)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-blue-900">
                  <span>Grand Total:</span>
                  <span className="font-mono">{formatINR(boqData.totals?.grandTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: ITEMIZED DISCIPLINE SHEETS ================= */}
          {!activeSheet?.isSummarySheet && activeSheet && (
            <div className="space-y-6">
              {activeSheet.sections.map((section, secIdx) => {
                const isCollapsed = collapsedSections[`${activeSheetIndex}_${secIdx}`];
                const filteredRows = section.rows.filter(r => {
                  if (filterNeedsReview && r.classificationStatus !== 'NEEDS_REVIEW') return false;
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  return (
                    r.itemNo?.toLowerCase().includes(query) ||
                    r.description?.toLowerCase().includes(query) ||
                    r.specification?.toLowerCase().includes(query) ||
                    r.materialName?.toLowerCase().includes(query)
                  );
                });

                if (filteredRows.length === 0 && (searchQuery || filterNeedsReview)) return null;

                return (
                  <div key={section.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    {/* Section Header */}
                    <div 
                      onClick={() => setCollapsedSections(prev => ({ ...prev, [`${activeSheetIndex}_${secIdx}`]: !isCollapsed }))}
                      className="bg-slate-50/80 hover:bg-slate-100/70 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-2.5">
                        {isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        <span className="font-mono text-xs font-bold text-blue-700">{section.code || '•'}</span>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                          {section.name}
                        </h3>
                        <span className="text-[11px] text-slate-400 font-normal">
                          ({section.rows.length} items)
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-bold text-slate-900 font-mono">
                          Subtotal: {formatINR(section.subtotal)}
                        </span>
                      </div>
                    </div>

                    {/* Section Table */}
                    {!isCollapsed && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-100/70 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                              <th className="py-2.5 px-3 w-14 text-center">Item</th>
                              <th className="py-2.5 px-3 min-w-[220px]">Description</th>
                              <th className="py-2.5 px-3 min-w-[150px]">Specification / Make</th>
                              <th className="py-2.5 px-3 w-16 text-center">Unit</th>
                              <th className="py-2.5 px-3 min-w-[120px] text-center">
                                {activeSheet.hasDesignSiteQty ? 'Quantity Basis' : 'Quantity'}
                              </th>
                              <th className="py-2.5 px-3 min-w-[150px]">Commercial Rate</th>
                              <th className="py-2.5 px-3 min-w-[140px]">Material Intelligence</th>
                              <th className="py-2.5 px-3 w-28 text-right">Amount</th>
                              <th className="py-2.5 px-2 w-10 text-center"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {filteredRows.map((row, rowIdx) => {
                              const isCompatible = row.compatibilityStatus === 'COMPATIBLE';
                              const isReferenceOnly = row.compatibilityStatus === 'REFERENCE_ONLY';

                              return (
                                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                                  
                                  {/* Item No */}
                                  <td className="py-2 px-3 text-center text-slate-400 font-mono">
                                    <input
                                      type="text"
                                      value={row.itemNo || ''}
                                      onChange={(e) => handleCellEdit(activeSheetIndex, secIdx, rowIdx, 'itemNo', e.target.value)}
                                      className="w-12 bg-transparent text-center font-mono text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 rounded"
                                    />
                                  </td>

                                  {/* Description */}
                                  <td className="py-2 px-3">
                                    <textarea
                                      rows={2}
                                      value={row.description || ''}
                                      onChange={(e) => handleCellEdit(activeSheetIndex, secIdx, rowIdx, 'description', e.target.value)}
                                      className="w-full bg-transparent text-xs text-slate-900 font-medium focus:bg-white focus:ring-1 focus:ring-blue-500 rounded p-1 resize-none leading-tight"
                                    />
                                  </td>

                                  {/* Specification */}
                                  <td className="py-2 px-3">
                                    <input
                                      type="text"
                                      value={row.specification || ''}
                                      onChange={(e) => handleCellEdit(activeSheetIndex, secIdx, rowIdx, 'specification', e.target.value)}
                                      className="w-full bg-transparent text-xs text-slate-600 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded p-1"
                                      placeholder="—"
                                    />
                                  </td>

                                  {/* Unit */}
                                  <td className="py-2 px-3 text-center">
                                    <input
                                      type="text"
                                      value={row.unit || ''}
                                      onChange={(e) => handleCellEdit(activeSheetIndex, secIdx, rowIdx, 'unit', e.target.value)}
                                      className="w-14 bg-transparent text-center text-xs font-mono text-slate-600 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded"
                                    />
                                  </td>

                                  {/* Quantity / Quantity Basis (for Electrical) */}
                                  <td className="py-2 px-3 text-center">
                                    {activeSheet.hasDesignSiteQty ? (
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-center space-x-1">
                                          <select
                                            value={row.quantityBasis || 'siteQuantity'}
                                            onChange={(e) => handleCellEdit(activeSheetIndex, secIdx, rowIdx, 'quantityBasis', e.target.value)}
                                            className="text-[10px] bg-slate-100 font-bold text-slate-800 rounded px-1.5 py-0.5 border border-slate-200"
                                          >
                                            <option value="siteQuantity">Site Qty</option>
                                            <option value="designQuantity">Design Qty</option>
                                          </select>
                                        </div>
                                        <input
                                          type="number"
                                          value={row.quantityBasis === 'designQuantity' ? (row.designQuantity ?? 0) : (row.siteQuantity ?? row.quantity ?? 0)}
                                          onChange={(e) => {
                                            const field = row.quantityBasis === 'designQuantity' ? 'designQuantity' : 'siteQuantity';
                                            handleCellEdit(activeSheetIndex, secIdx, rowIdx, field, e.target.value);
                                          }}
                                          className="w-20 bg-slate-50 border border-slate-200 text-center text-xs font-mono font-bold text-slate-900 rounded py-0.5"
                                        />
                                      </div>
                                    ) : (
                                      <input
                                        type="number"
                                        value={row.quantity ?? 0}
                                        onChange={(e) => handleCellEdit(activeSheetIndex, secIdx, rowIdx, 'quantity', e.target.value)}
                                        className="w-20 bg-slate-50 border border-slate-200 text-center text-xs font-mono font-bold text-slate-900 rounded py-0.5"
                                      />
                                    )}
                                  </td>

                                  {/* Commercial Rate */}
                                  <td className="py-2 px-3">
                                    <div className="space-y-1">
                                      <div className="flex items-center space-x-1.5">
                                        <span className="text-slate-400 text-[10px]">₹</span>
                                        <input
                                          type="number"
                                          value={row.currentRate ?? 0}
                                          onChange={(e) => handleCellEdit(activeSheetIndex, secIdx, rowIdx, 'currentRate', e.target.value)}
                                          className="w-24 bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 rounded px-2 py-0.5 focus:bg-white focus:ring-1 focus:ring-blue-500"
                                        />
                                      </div>

                                      <div className="flex items-center space-x-1">
                                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                          row.rateSource === 'STATE' ? 'bg-emerald-100 text-emerald-800' :
                                          row.rateSource === 'NATIONAL' ? 'bg-blue-100 text-blue-800' :
                                          row.rateSource === 'MANUAL' ? 'bg-amber-100 text-amber-800' :
                                          'bg-slate-100 text-slate-600'
                                        }`}>
                                          {row.rateSource || 'ORIGINAL'}
                                        </span>
                                        {row.originalRate !== row.currentRate && (
                                          <span className="text-[9px] text-slate-400 line-through">
                                            ₹{row.originalRate}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  {/* Material Intelligence Layer */}
                                  <td className="py-2 px-3">
                                    {row.materialCode ? (
                                      <div className="space-y-1">
                                        <div className="flex items-center space-x-1 text-[11px] font-bold text-slate-800">
                                          <span className="truncate max-w-[100px]" title={row.materialName}>
                                            {row.materialName || row.materialCategory}
                                          </span>
                                          <span className="text-slate-500 font-mono font-normal">
                                            {row.latestMaterialRate ? `₹${row.latestMaterialRate}` : '—'}
                                          </span>
                                        </div>

                                        {isCompatible && (
                                          <button
                                            onClick={() => handleApplyRate(activeSheetIndex, secIdx, rowIdx)}
                                            className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded border border-blue-200 transition-colors flex items-center space-x-1"
                                          >
                                            <span>Apply ₹{row.latestMaterialRate}</span>
                                          </button>
                                        )}

                                        {isReferenceOnly && (
                                          <span 
                                            className="inline-block px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 text-slate-600 cursor-help"
                                            title="Compound work rate (RCC/masonry/finish). Direct material application blocked to preserve trade schedule integrity."
                                          >
                                            Reference Only
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-[11px] text-slate-400 italic">No match</span>
                                    )}
                                  </td>

                                  {/* Line Amount */}
                                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                                    {formatINR(row.amount)}
                                  </td>

                                  {/* Actions */}
                                  <td className="py-2 px-2 text-center">
                                    <button
                                      onClick={() => handleDeleteRow(activeSheetIndex, secIdx, rowIdx)}
                                      className="text-slate-300 hover:text-rose-600 p-1 transition-colors"
                                      title="Delete item"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>

                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ================= PRICE SEARCH ENGINE MODAL ================= */}
      {priceSearchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-extrabold text-white">Commercial Price Search Engine</h3>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 text-[10px] font-mono font-bold uppercase border border-cyan-400/30">
                      Live State Rates
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Search authoritative Indian regional material rates & insert directly into active BOQ work schedules.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPriceSearchModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Search Controls Bar */}
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Physical entry search input */}
                <div className="sm:col-span-2 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={priceSearchQuery}
                    onChange={(e) => {
                      setPriceSearchQuery(e.target.value);
                      handleSearchPrices(e.target.value, priceSearchState, priceSearchCategory);
                    }}
                    placeholder="Search any material, grade, brand (e.g. UltraTech, Fe 550D, M-Sand, AAC Block...)"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 shadow-2xs"
                    autoFocus
                  />
                </div>

                {/* State selector */}
                <div>
                  <select
                    value={priceSearchState}
                    onChange={(e) => {
                      setPriceSearchState(e.target.value);
                      handleSearchPrices(priceSearchQuery, e.target.value, priceSearchCategory);
                    }}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  >
                    {INDIAN_STATES.map(st => (
                      <option key={st.id} value={st.name}>{st.name} ({st.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px]">
                {['ALL', 'STEEL', 'CEMENT', 'AGGREGATE', 'MASONRY', 'FLOORING', 'ELECTRICAL', 'PLUMBING', 'PAINTING'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setPriceSearchCategory(cat);
                      handleSearchPrices(priceSearchQuery, priceSearchState, cat);
                    }}
                    className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-colors ${
                      priceSearchCategory === cat
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 divide-y divide-slate-100">
              {isSearchingPrices && (
                <div className="py-12 text-center text-slate-400 flex items-center justify-center space-x-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="text-xs font-semibold">Searching state pricing database...</span>
                </div>
              )}

              {!isSearchingPrices && priceSearchResults.length === 0 && (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Search className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">No material pricing matched "{priceSearchQuery}" in {priceSearchState}.</p>
                  <p className="text-[11px] text-slate-400">Try searching a broader keyword (e.g. "steel", "cement", "tile", "block", "pipe").</p>
                </div>
              )}

              {!isSearchingPrices && priceSearchResults.map((mat) => (
                <div key={mat.materialCode} className="pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-3 rounded-xl transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">{mat.name}</span>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                        {mat.materialCode}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                        mat.pricingScope === 'STATE' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {mat.pricingScope || 'State'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {mat.description || `${mat.category} specification`} • Authority: <span className="font-medium text-slate-700">{mat.pricingSource}</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right">
                      <span className="font-mono tabular-nums text-sm sm:text-base font-extrabold text-slate-900 block">
                        ₹{Number(mat.unitRate).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400">per {mat.unit}</span>
                    </div>

                    <button
                      onClick={() => handleInsertSearchedMaterial(mat)}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-slate-900 text-white text-[11px] font-bold shadow-2xs transition-all flex items-center space-x-1 active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Insert as Row</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
              <span>
                💡 <strong>Commercial Notice:</strong> Benchmarks are provided for rate intelligence. Direct physical entry and custom rates in the spreadsheet remain fully editable.
              </span>
              <button
                onClick={() => setPriceSearchModalOpen(false)}
                className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 text-xs font-bold"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default CommercialBOQPage;
