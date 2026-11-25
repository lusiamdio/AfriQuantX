import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from'@/components/ui/badge';
import { 
  FileText, Download, Play, RefreshCw, Filter, CheckCircle2, 
  Layers, Printer, ChevronLeft, ChevronRight, Search, BarChart3, 
  ShieldCheck, TrendingUp, Zap, Sliders, Eye, Sparkles, FileSpreadsheet,
  Globe, Activity, Award, Cloud, Send, Scale, X
} from 'lucide-react';
import { 
  AVAILABLE_REPORT_TEMPLATES, 
  ReportExecutionResult, 
  ReportService, 
  ReportTemplate,
  PDFExportOptions 
} from '../services/reportService';
import { generateInstitutionalPdf } from '../services/pdfExportService';
import { InstitutionalIntegrationsService } from '../services/institutionalIntegrationsService';

interface ReportViewerProps {
  initialTemplateId?: string;
  setActiveTab?: (tab: string) => void;
}

export function ReportViewer({ initialTemplateId, setActiveTab }: ReportViewerProps = {}) {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate>(() => {
    const prefId = initialTemplateId || (typeof window !== 'undefined' ? sessionStorage.getItem('aqx_preferred_report_template') : null);
    if (prefId) {
      const found = AVAILABLE_REPORT_TEMPLATES.find(t => t.id === prefId);
      if (found) return found;
    }
    return AVAILABLE_REPORT_TEMPLATES[0];
  });
  const [paramValues, setParamValues] = useState<Record<string, any>>({});
  const [format, setFormat] = useState<'pdf' | 'xlsx' | 'csv' | 'html'>('pdf');
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [reportResult, setReportResult] = useState<ReportExecutionResult | null>(null);
  const [activePage, setActivePage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle prop updates for template selection
  useEffect(() => {
    if (initialTemplateId) {
      const found = AVAILABLE_REPORT_TEMPLATES.find(t => t.id === initialTemplateId);
      if (found && found.id !== selectedTemplate.id) {
        setSelectedTemplate(found);
      }
    }
  }, [initialTemplateId]);
  
  // PDF Customization Options
  const [pdfOptions, setPdfOptions] = useState<PDFExportOptions>({
    orientation: 'portrait',
    colorTheme:'dark',
    includeExecutiveSummary: true,
    includeIntelligenceCommentary: true,
    includeAuditStamp: true,
    customSubtitle: 'Verified Quantitative Execution, Settlement Telemetry & Multi-Exchange Performance Audit',
  });
  const [showPdfOptions, setShowPdfOptions] = useState(false);

  useEffect(() => {
    // Initialize default parameter values for the selected template
    const defaults: Record<string, any> = {};
    selectedTemplate.parameters.forEach(p => {
      defaults[p.key] = p.defaultValue;
    });
    setParamValues(defaults);
    // Generate initial report
    handleRunReport(selectedTemplate.id, defaults, format);
  }, [selectedTemplate]);

  const handleRunReport = async (
    templateId = selectedTemplate.id, 
    params = paramValues, 
    fmt = format
  ) => {
    setLoading(true);
    try {
      const res = await ReportService.generateReport(templateId, params, fmt);
      setReportResult(res);
      setActivePage(1);
    } catch (err) {
      console.error('Failed to run report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (targetFormat?: 'pdf' | 'xlsx' | 'csv') => {
    if (!reportResult) return;
    
    if (targetFormat === 'pdf' || format === 'pdf') {
      setExportingPdf(true);
      try {
        const updatedResult = { ...reportResult, format: 'pdf' as const };
        ReportService.exportReportFile(updatedResult, pdfOptions);
      } finally {
        setTimeout(() => setExportingPdf(false), 500);
      }
    } else {
      const exportFmt = targetFormat || format;
      const updatedResult = { ...reportResult, format: exportFmt as any };
      ReportService.exportReportFile(updatedResult);
    }
  };

  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  const handlePreviewPdfInNewTab = () => {
    if (!reportResult) return;
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    const doc = generateInstitutionalPdf(reportResult, pdfOptions);
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    setPdfPreviewUrl(blobUrl);
  };

  const handleClosePdfPreview = () => {
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    setPdfPreviewUrl(null);
  };

  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [cloudSyncResult, setCloudSyncResult] = useState<any>(null);
  const [dispatchingAlert, setDispatchingAlert] = useState(false);
  const [alertDispatchResult, setAlertDispatchResult] = useState<any>(null);

  const handleCloudArchive = async (dest: 'google_drive' | 'aws_s3' | 'onedrive' = 'google_drive') => {
    if (!reportResult) return;
    setCloudSyncing(true);
    setCloudSyncResult(null);
    try {
      const res = await InstitutionalIntegrationsService.syncReportToCloud({
        destination: dest,
        documentTitle: reportResult.title || 'Financial Intelligence & Performance Audit',
        documentType: 'pdf',
        reportData: reportResult
      });
      setCloudSyncResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setCloudSyncing(false);
    }
  };

  const handleDispatchReportAlert = async (channel: 'telegram' | 'discord' | 'slack' = 'telegram') => {
    if (!reportResult) return;
    setDispatchingAlert(true);
    setAlertDispatchResult(null);
    try {
      const summaryText = reportResult.dataSummary 
        ? Object.entries(reportResult.dataSummary).map(([k, v]) => `${k}: ${v}`).join(' | ') 
        : 'Institutional audit compiled.';
      const res = await InstitutionalIntegrationsService.dispatchAlert({
        channel,
        alertType: 'AUDIT_DIGEST',
        title: `Institutional Audit Ready: ${reportResult.title}`,
        message:`${summaryText}. Generated at ${new Date().toLocaleTimeString()} with verified cryptographic stamp.`,
        priority: 'HIGH'
      });
      setAlertDispatchResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setDispatchingAlert(false);
    }
  };

  const filteredRows = reportResult?.rows.filter(row => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      row.id?.toLowerCase().includes(q) ||
      row.ticker?.toLowerCase().includes(q) ||
      row.assetName?.toLowerCase().includes(q) ||
      row.exchange?.toLowerCase().includes(q) ||
      row.status?.toLowerCase().includes(q)
    );
  }) || [];

  return (
    <div className="space-y-3 pb-5">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-black rounded-xl p-3.5 md:p-4 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none"/>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-white text-black flex items-center justify-center font-bold shrink-0 shadow-xl">
              <FileText className="w-7 h-7"/>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="outline" className="text-emerald-400 bg-emerald-500/10 font-mono text-[10px] uppercase">
                  AQEI Quantitative Engine
                </Badge>
                <Badge variant="outline" className="text-sky-400 bg-sky-500/10 font-mono text-[10px] uppercase">
                  Institutional PDF Export
                </Badge>
                {selectedTemplate.category === 'Tax & Regulatory' ? (
                  <Badge variant="outline" className="text-emerald-400 bg-emerald-500/15 font-mono text-[10px] uppercase flex items-center gap-1 font-bold">
                    <Scale className="w-3 h-3 text-emerald-400"/>
                    TaxBit Certified Audit Proof
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-400 bg-amber-500/10 font-mono text-[10px] uppercase">
                    Multi-Exchange Verified
                  </Badge>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Financial Intelligence & Performance Reporting</h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Export institutional-grade financial intelligence summaries, trading performance metrics, and multi-exchange settlement ledgers as clean, formatted PDF reports.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {setActiveTab && (
              <Button
                onClick={() => setActiveTab('tax-compliance')}
                variant="outline"
                className="bg-emerald-500/10 text-emerald-300 hover:text-white hover:bg-emerald-500/20 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg"
                title="Open dedicated Tax & Compliance Hub"
              >
                <Scale className="w-4 h-4 text-emerald-400"/>
                Tax & Compliance Hub →
              </Button>
            )}

            <Button
              onClick={() => setShowPdfOptions(!showPdfOptions)}
              variant="outline"
              className="bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl flex items-center gap-2 cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-zinc-400"/>
              PDF Options
            </Button>

            <Button
              onClick={() => handleCloudArchive('google_drive')}
              disabled={!reportResult || loading || cloudSyncing}
              variant="outline"
              className="bg-blue-500/10 text-blue-300 hover:text-white hover:bg-blue-500/20 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl flex items-center gap-2 cursor-pointer"
              title="Archive this report to Google Drive or AWS S3 data room"
            >
              <Cloud className={`w-4 h-4 text-blue-400 ${cloudSyncing ? 'animate-spin' : ''}`} />
              {cloudSyncing ? 'Archiving...' : 'Cloud Archive'}
            </Button>

            <Button
              onClick={() => handleDispatchReportAlert('telegram')}
              disabled={!reportResult || loading || dispatchingAlert}
              variant="outline"
              className="bg-purple-500/10 text-purple-300 hover:text-white hover:bg-purple-500/20 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl flex items-center gap-2 cursor-pointer"
              title="Dispatch report digest directly to Telegram/Discord channels"
            >
              <Send className={`w-4 h-4 text-purple-400 ${dispatchingAlert ?'animate-pulse' : ''}`} />
              {dispatchingAlert ? 'Dispatching...' : 'Dispatch Alert'}
            </Button>

            <Button
              onClick={handlePreviewPdfInNewTab}
              disabled={!reportResult || loading}
              variant="outline"
              className="bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl flex items-center gap-2 cursor-pointer"
              title="Preview formatted PDF in a new tab"
            >
              <Eye className="w-4 h-4 text-sky-400"/>
              Quick Preview
            </Button>

            <Button
              onClick={() => handleExport('pdf')}
              disabled={!reportResult || loading || exportingPdf}
              className="bg-white text-black hover:bg-zinc-200 font-extrabold text-xs uppercase tracking-wider py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer"
            >
              {exportingPdf ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4"/>
                  Export Clean PDF
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Integration Notification Banner */}
        {(cloudSyncResult || alertDispatchResult) && (
          <div className="mt-4 p-3.5 rounded-lg bg-black/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in">
            {cloudSyncResult && (
              <div className="flex items-center gap-2 text-blue-300">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0"/>
                <span>
                  Archived to <strong>{cloudSyncResult.destination}</strong> (ID: {cloudSyncResult.archiveId}). SHA-256 verified.
                </span>
              </div>
            )}
            {alertDispatchResult && (
              <div className="flex items-center gap-2 text-purple-300">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0"/>
                <span>
                  Dispatched to <strong>{alertDispatchResult.channel}</strong> ({alertDispatchResult.latencyMs}ms latency). Proof: {alertDispatchResult.deliveryProof.substring(0, 16)}...
                </span>
              </div>
            )}
            <button
              onClick={() => { setCloudSyncResult(null); setAlertDispatchResult(null); }}
              className="text-zinc-500 hover:text-white text-[11px] underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* PDF Customization Settings Drawer */}
        {showPdfOptions && (
          <div className="mt-6 pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <label className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider block">Page Orientation</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPdfOptions(opt => ({ ...opt, orientation: 'portrait' }))}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer bg-white/[0.03] ${ pdfOptions.orientation ==='portrait'?'bg-white text-black' : 'bg-black text-zinc-400 hover:text-white'}`}
                >
                  Portrait (A4)
                </button>
                <button
                  onClick={() => setPdfOptions(opt => ({ ...opt, orientation: 'landscape' }))}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer bg-white/[0.03] ${ pdfOptions.orientation ==='landscape'?'bg-white text-black' : 'bg-black text-zinc-400 hover:text-white'}`}
                >
                  Landscape
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider block">Executive KPI Strip</label>
              <button
                onClick={() => setPdfOptions(opt => ({ ...opt, includeExecutiveSummary: !opt.includeExecutiveSummary }))}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-between transition-all cursor-pointer bg-white/[0.03] ${ pdfOptions.includeExecutiveSummary ?'bg-emerald-500/10 text-emerald-400' : 'bg-black text-zinc-500'}`}
              >
                <span>Metric Scorecards</span>
                <span>{pdfOptions.includeExecutiveSummary ? 'ENABLED' : 'DISABLED'}</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider block">Intelligence Commentary</label>
              <button
                onClick={() => setPdfOptions(opt => ({ ...opt, includeIntelligenceCommentary: !opt.includeIntelligenceCommentary }))}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-between transition-all cursor-pointer bg-white/[0.03] ${ pdfOptions.includeIntelligenceCommentary ?'bg-sky-500/10 text-sky-400' : 'bg-black text-zinc-500'}`}
              >
                <span>AQEI Insights</span>
                <span>{pdfOptions.includeIntelligenceCommentary ? 'ENABLED' : 'DISABLED'}</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider block">Custom PDF Subtitle</label>
              <input
                type="text"
                value={pdfOptions.customSubtitle || ''}
                onChange={(e) => setPdfOptions(opt => ({ ...opt, customSubtitle: e.target.value }))}
                placeholder="Custom Header Subtitle..."
                className="w-full bg-black rounded-lg px-3 py-1.5 text-xs text-white outline-none font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Left Catalog & Parameter Controls / Right Live Report Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-start">
        {/* Template Selector & Parameter Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-neutral-950 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400"/>
                Report Templates Catalog
              </CardTitle>
              <CardDescription className="text-zinc-500 text-[11px]">
                Choose an institutional reporting template.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-3 space-y-2">
              {AVAILABLE_REPORT_TEMPLATES.map((tpl) => {
                const isSelected = tpl.id === selectedTemplate.id;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl)}
                    className={`w-full text-left p-3 rounded-lg transition-all cursor-pointer bg-white/[0.03] ${ isSelected ?'bg-white text-black shadow-xl font-bold' : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold truncate max-w-[150px] ${isSelected ?'text-black font-extrabold' : 'text-white'}`}>
                        {tpl.title}
                      </span>
                      <Badge 
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 font-mono uppercase ${ isSelected ?'text-black bg-black/5 font-extrabold' : 'text-zinc-400'}`}
                      >
                        {tpl.category}
                      </Badge>
                    </div>
                    <p className={`text-[10px] line-clamp-2 leading-relaxed ${isSelected ?'text-neutral-800' : 'text-zinc-500'}`}>
                      {tpl.description}
                    </p>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Parameter Tuning Controls */}
          <Card className="bg-neutral-950 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-400"/>
                Report Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              {selectedTemplate.parameters.map((p) => (
                <div key={p.key} className="space-y-1.5">
                  <label className="text-zinc-400 font-medium block text-[11px]">{p.label}</label>
                  {p.type === 'select' ? (
                    <select
                      value={paramValues[p.key] || p.defaultValue}
                      onChange={(e) => setParamValues({ ...paramValues, [p.key]: e.target.value })}
                      className="w-full bg-black rounded-xl px-3 py-2 text-white font-mono text-xs outline-none cursor-pointer"
                    >
                      {p.options?.map((opt) => (
                        <option key={opt} value={opt} className="bg-neutral-950">{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={p.type === 'number' ? 'number' : 'text'}
                      value={paramValues[p.key] || ''}
                      onChange={(e) => setParamValues({ ...paramValues, [p.key]: e.target.value })}
                      className="w-full bg-black rounded-xl px-3 py-2 text-white font-mono text-xs outline-none"
                    />
                  )}
                </div>
              ))}

              <div className="space-y-1.5 pt-2">
                <label className="text-zinc-400 font-medium block text-[11px]">Default Export Format</label>
                <div className="grid grid-cols-4 gap-1">
                  {(['pdf', 'xlsx', 'csv', 'html'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setFormat(fmt)}
                      className={`py-1.5 rounded-lg font-mono text-[10px] uppercase font-bold transition-all cursor-pointer bg-white/[0.03] ${ format === fmt ?'bg-white text-black' : 'bg-black text-zinc-400 hover:text-white'}`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => handleRunReport()}
                disabled={loading}
                className="w-full bg-white text-black hover:bg-zinc-200 font-extrabold text-xs uppercase tracking-wider py-2.5 rounded-xl flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                Execute Pipeline
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Report Preview Canvas */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="bg-neutral-950 shadow-2xl overflow-hidden min-h-[650px] flex flex-col justify-between">
            {/* Header bar */}
            <div className="p-4 bg-black/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-bold text-base flex items-center gap-2 flex-wrap">
                  {selectedTemplate.title}
                  {reportResult && (
                    <Badge variant="outline" className="text-emerald-400 bg-emerald-500/10 font-mono text-[10px]">
                      {reportResult.reportId}
                    </Badge>
                  )}
                </h3>
                {reportResult && (
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    Generated on {reportResult.generatedAt} | {reportResult.totalRecords} Settled Records
                  </p>
                )}
              </div>

              {/* Search filter in preview & Quick PDF Export */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
                  <input
                    type="text"
                    placeholder="Filter audit records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-600 outline-none"
                  />
                </div>

                <Button
                  onClick={() => handleExport('pdf')}
                  disabled={!reportResult || loading || exportingPdf}
                  size="sm"
                  className="bg-white text-black hover:bg-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer"
                  title="Export this report to PDF"
                >
                  <Download className="w-3.5 h-3.5"/>
                  PDF
                </Button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-3.5 flex-1 space-y-3">
              {loading ? (
                <div className="h-96 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                  <p className="text-xs font-mono text-zinc-400">Compiling financial intelligence & trade telemetry...</p>
                </div>
              ) : reportResult ? (
                <>
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                    <div className="bg-neutral-900/60 rounded-lg p-4">
                      <span className="text-[10px] text-zinc-500 uppercase font-sans font-bold block">Total Volume / AUM</span>
                      <span className="text-white text-base font-bold mt-1 block">{reportResult.dataSummary.totalVolumeUsd}</span>
                    </div>

                    <div className="bg-neutral-900/60 rounded-lg p-4">
                      <span className="text-[10px] text-zinc-500 uppercase font-sans font-bold block">
                        {reportResult.dataSummary.winRate ? 'Win Rate / Profit Factor' : 'Audit Verification'}
                      </span>
                      <span className="text-emerald-400 text-xs font-bold mt-1 block flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5"/>
                        {reportResult.dataSummary.winRate ?`${reportResult.dataSummary.winRate} (${reportResult.dataSummary.profitFactor})`: reportResult.dataSummary.auditStatus}
                      </span>
                    </div>

                    <div className="bg-neutral-900/60 rounded-lg p-4">
                      <span className="text-[10px] text-zinc-500 uppercase font-sans font-bold block">
                        {reportResult.dataSummary.sharpeRatio ? 'Sharpe Ratio' : 'Settlement Score'}
                      </span>
                      <span className="text-sky-400 text-xs font-bold mt-1 block">
                        {reportResult.dataSummary.sharpeRatio ? `${reportResult.dataSummary.sharpeRatio} (Optimal)` : reportResult.dataSummary.complianceScore}
                      </span>
                    </div>

                    <div className="bg-neutral-900/60 rounded-lg p-4">
                      <span className="text-[10px] text-zinc-500 uppercase font-sans font-bold block">Target Venue</span>
                      <span className="text-amber-400 text-xs font-bold mt-1 block truncate">{reportResult.dataSummary.primaryExchange}</span>
                    </div>
                  </div>

                  {/* Financial Intelligence & Performance Commentary */}
                  {reportResult.commentary && (
                    <div className="bg-neutral-900/40 rounded-lg p-4 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-emerald-400"/>
                        Quantitative Intelligence & Alpha Telemetry
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {reportResult.commentary}
                      </p>
                    </div>
                  )}

                  {/* Data Table */}
                  <div className="overflow-x-auto rounded-lg bg-white/[0.03]">
                    <table className="w-full text-left font-mono text-xs">
                      <thead className="bg-white/5 text-zinc-400 text-[10px] uppercase tracking-wider">
                        <tr>
                          <th className="px-2 py-1.5">{selectedTemplate.category ==='Tax & Regulatory'?'Form / Ref ID' : 'Audit Ref'}</th>
                          <th className="px-2 py-1.5">{selectedTemplate.category ==='Tax & Regulatory'?'Sale Date' : 'Timestamp'}</th>
                          <th className="px-2 py-1.5">Exchange</th>
                          <th className="px-2 py-1.5">Ticker / Asset</th>
                          <th className="px-2 py-1.5">{selectedTemplate.category ==='Tax & Regulatory'?'Tax Term' : 'Side'}</th>
                          <th className="px-2 py-1.5 text-right">{selectedTemplate.category ==='Tax & Regulatory'?'Proceeds (USD)' : 'Volume'}</th>
                          <th className="px-2 py-1.5 text-center">{selectedTemplate.category ==='Tax & Regulatory'?'Basis & Gain/Loss' : 'Latency / Slip'}</th>
                          <th className="px-2 py-1.5">{selectedTemplate.category ==='Tax & Regulatory'?'TaxBit Verification' : 'Status'}</th>
                        </tr>
                      </thead>
                      <tbody className="">
                        {filteredRows.map((row) => (
                          <tr key={row.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-2 py-1.5 text-sky-400 font-bold">{row.id}</td>
                            <td className="px-2 py-1.5 text-zinc-400 text-[11px]">{row.timestamp}</td>
                            <td className="px-2 py-1.5 text-white">{row.exchange}</td>
                            <td className="px-2 py-1.5">
                              <span className="text-white font-bold block">{row.ticker}</span>
                              {row.assetName && <span className="text-[10px] text-zinc-500 block">{row.assetName}</span>}
                            </td>
                            <td className="px-2 py-1.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ row.type ==='LONG_TERM'?'bg-blue-500/20 text-blue-400 ': row.type ==='SHORT_TERM'?'bg-amber-500/20 text-amber-400 ': row.type ==='BUY'?'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                {row.type}
                              </span>
                            </td>
                            <td className="px-2 py-1.5 text-right text-white font-bold">{row.volumeUsd}</td>
                            <td className="px-2 py-1.5 text-center">
                              <span className="text-zinc-300 block">{row.executionTimeMs}</span>
                              {row.slippageBps && (
                                <span className={`text-[10px] font-bold block ${ row.slippageBps.startsWith('+') ?'text-emerald-400' : 'text-rose-400'}`}>
                                  {row.slippageBps}
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-1.5">
                              <span className="text-emerald-400 text-[10px] flex items-center gap-1 font-mono font-bold">
                                <ShieldCheck className="w-3.5 h-3.5 shrink-0"/>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </div>

            {/* Footer Pagination & Audit Hash */}
            <div className="p-4 bg-black/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-3">
                <span>Page {activePage} of {reportResult?.pageCount || 1}</span>
                {reportResult?.auditHash && (
                  <span className="hidden sm:inline text-[10px] text-zinc-500">
                    CSD Verification Hash: {reportResult.auditHash}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activePage <= 1}
                  onClick={() => setActivePage(p => p - 1)}
                  className="text-white hover:bg-white/10 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4"/>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!reportResult || activePage >= reportResult.pageCount}
                  onClick={() => setActivePage(p => p + 1)}
                  className="text-white hover:bg-white/10 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4"/>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {pdfPreviewUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-950 rounded-lg w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3.5 bg-white/[0.03]">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Eye className="w-4 h-4 text-sky-400"/>
                PDF Report Preview — {reportResult?.title || 'Institutional Report'}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleExport('pdf')}
                  className="bg-white text-black hover:bg-zinc-200 text-xs font-bold"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5"/>
                  Download PDF
                </Button>
                <button
                  type="button"
                  onClick={handleClosePdfPreview}
                  aria-label="Close PDF preview"
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4"/>
                </button>
              </div>
            </div>
            <iframe
              src={pdfPreviewUrl}
              title="PDF Report Preview"
              className="w-full flex-1 bg-neutral-900"
            />
          </div>
        </div>
      )}
    </div>
  );
}
