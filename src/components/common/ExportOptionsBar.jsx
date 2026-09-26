import React, { useState } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  Compass, 
  MessageCircle, 
  Check, 
  Download,
  Share2,
  Printer
} from 'lucide-react';
import { 
  downloadExcelBOQ, 
  downloadCAD_DXF, 
  shareOnWhatsApp, 
  exportToPDF 
} from '../../utils/exportUtils';
import { useEstimateStore } from '../../store/useEstimateStore';

export function ExportOptionsBar({ state, estimation, className = '' }) {
  const { captureCustomerLead, currentUser } = useEstimateStore();
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  const handlePDF = () => {
    setDownloadingFormat('pdf');
    exportToPDF(state, estimation, captureCustomerLead, currentUser);
    setTimeout(() => setDownloadingFormat(null), 2000);
  };

  const handleExcel = () => {
    setDownloadingFormat('excel');
    try {
      if (captureCustomerLead) {
        captureCustomerLead({
          name: currentUser?.name || (state.projectName || 'Homeowner') + ' Customer',
          email: currentUser?.email || 'customer@buildiqo.ai',
          phone: currentUser?.phone || '+91 98765 43210',
          notes: 'Customer downloaded Excel BOQ spreadsheet.'
        });
      }
    } catch (e) {}
    downloadExcelBOQ(state, estimation);
    setTimeout(() => setDownloadingFormat(null), 2000);
  };

  const handleDXF = () => {
    setDownloadingFormat('dxf');
    try {
      if (captureCustomerLead) {
        captureCustomerLead({
          name: currentUser?.name || (state.projectName || 'Homeowner') + ' Customer',
          email: currentUser?.email || 'customer@buildiqo.ai',
          phone: currentUser?.phone || '+91 98765 43210',
          notes: 'Customer downloaded AutoCAD DXF architectural floor plan.'
        });
      }
    } catch (e) {}
    downloadCAD_DXF(state, estimation);
    setTimeout(() => setDownloadingFormat(null), 2000);
  };

  const handleWhatsApp = () => {
    shareOnWhatsApp(state, estimation);
  };

  return (
    <div className={`w-full no-print ${className}`}>
      {/* 3 Export Buttons Grid (PDF, Excel, WhatsApp) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        
        {/* 1. PDF Button (Red outline, white background, red text) */}
        <button
          type="button"
          onClick={handlePDF}
          className="w-full py-3 sm:py-3.5 px-4 rounded-2xl border-2 border-red-500 bg-white hover:bg-red-50/70 text-red-600 font-extrabold text-sm sm:text-base flex items-center justify-center space-x-2.5 shadow-xs hover:shadow transition-all group"
          title="Download or Print full formal PDF report"
        >
          {/* Custom styled File Icon */}
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 fill-red-500" viewBox="0 0 24 24">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
          </div>
          <span>{downloadingFormat === 'pdf' ? 'Preparing...' : 'PDF'}</span>
        </button>

        {/* 2. Excel Button (Dark green outline, white background, green text) */}
        <button
          type="button"
          onClick={handleExcel}
          className="w-full py-3 sm:py-3.5 px-4 rounded-2xl border-2 border-emerald-700 bg-white hover:bg-emerald-50/70 text-emerald-800 font-extrabold text-sm sm:text-base flex items-center justify-center space-x-2.5 shadow-xs hover:shadow transition-all group"
          title="Download Excel / CSV itemized BOQ & material schedule"
        >
          {/* Multi-colored Bar Chart / Excel Icon */}
          <div className="flex items-end space-x-0.5 h-4 w-4 shrink-0 justify-center">
            <span className="w-1 bg-blue-500 h-2 rounded-2xs" />
            <span className="w-1 bg-red-500 h-3.5 rounded-2xs" />
            <span className="w-1 bg-emerald-600 h-4 rounded-2xs" />
          </div>
          <span>{downloadingFormat === 'excel' ? 'Exporting...' : 'Excel'}</span>
        </button>

        {/* 3. WhatsApp Button (Solid vibrant green background, white text) */}
        <button
          type="button"
          onClick={handleWhatsApp}
          className="w-full py-3 sm:py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm sm:text-base flex items-center justify-center space-x-2.5 shadow-md hover:shadow-lg transition-all"
          title="Share quotation & summary on WhatsApp"
        >
          {/* WhatsApp Icon */}
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.79 14.07c-.24.68-1.2 1.25-1.74 1.31-.49.06-1.12.08-1.81-.14-.42-.14-.97-.32-1.68-.62-2.99-1.29-4.94-4.32-5.09-4.52-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.45.27-.29.6-.36.8-.36.2 0 .4 0 .58.01.19.01.44-.07.68.51.25.59.85 2.07.92 2.22.08.15.13.33.03.53-.1.2-.15.33-.3.51-.15.18-.32.4-.46.54-.15.15-.31.31-.13.62.18.31.8 1.32 1.72 2.14 1.18 1.05 2.17 1.38 2.48 1.53.31.15.49.13.67-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.71-.15.29.11 1.84.87 2.16 1.03.32.16.53.24.61.37.08.13.08.76-.16 1.44z"/>
            </svg>
          </div>
          <span>WhatsApp</span>
        </button>

      </div>
    </div>
  );
}

export default ExportOptionsBar;
