import { useState, useEffect, useMemo, useRef } from 'react';
import {
    Box,
    Typography,
    List,
    ListItemButton,
    ListItemText,
    Chip,
    Button,
    CircularProgress,
    IconButton,
    ListItemIcon,
    InputAdornment,
    TextField,
    Tooltip,
    Collapse,
    Menu,
    MenuItem
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2canvas from 'html2canvas';
import { fetchCommodityReports, fetchReportContent, generateCommodityReport,  } from '../api';
import type{ReportSummary} from '../api';

export default function CommoditiesPage() {
    const [reports, setReports] = useState<ReportSummary[]>([]);
    const [selectedReport, setSelectedReport] = useState<ReportSummary | null>(null);
    const [reportContent, setReportContent] = useState<string>('');
    const [loadingContent, setLoadingContent] = useState<boolean>(false);
    const [generating, setGenerating] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [exporting, setExporting] = useState<boolean>(false);
    
    // Grouping state
    const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        try {
            const commodityReports = await fetchCommodityReports();
            setReports(commodityReports);
            
            // Auto expand newest date
            if (commodityReports.length > 0) {
                const newestDate = commodityReports[0].date;
                setExpandedDates(new Set([newestDate]));
                
                if (!selectedReport) {
                    handleSelectReport(commodityReports[0]);
                }
            }
        } catch (error) {
            console.error("Failed to load reports", error);
        }
    };

    const handleSelectReport = async (report: ReportSummary) => {
        setSelectedReport(report);
        setLoadingContent(true);
        try {
            const content = await fetchReportContent(report.filename);
            setReportContent(content);
        } catch (error) {
            console.error("Failed to load content", error);
        } finally {
            setLoadingContent(false);
        }
    };

    const handleGenerate = async (asset: 'gold' | 'silver') => {
        setGenerating(true);
        try {
            await generateCommodityReport(asset);
            await loadReports(); // Reload list
        } catch (error) {
            console.error("Analysis failed", error);
            alert("Analysis failed. See console.");
        } finally {
            setGenerating(false);
        }
    };

    const handleExportImage = async () => {
        if (!reportRef.current || !selectedReport) return;
        setExporting(true);
        try {
            const canvas = await html2canvas(reportRef.current, { scale: 2 });
            const link = document.createElement('a');
            link.download = `Commodity_${selectedReport.fund_name}_${selectedReport.date}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } finally {
            setExporting(false);
        }
    };

    const toggleDate = (date: string) => {
        const newSet = new Set(expandedDates);
        if (newSet.has(date)) newSet.delete(date);
        else newSet.add(date);
        setExpandedDates(newSet);
    };

    // Grouping Logic
    const groupedReports = useMemo(() => {
        const filtered = reports.filter(r => 
            r.fund_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
            r.date.includes(searchQuery)
        );
        
        const groups: Record<string, ReportSummary[]> = {};
        filtered.forEach(r => {
            if (!groups[r.date]) groups[r.date] = [];
            groups[r.date].push(r);
        });
        
        // Sort dates descending
        return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(date => ({
            date,
            items: groups[date].sort((a, b) => (a.fund_code === 'gold' ? -1 : 1)) // Gold first
        }));
    }, [reports, searchQuery]);

    // Menu for Generate
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);
    const handleClickMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    return (
        <div className="flex h-screen bg-background overflow-hidden text-slate-700">
            {/* Sidebar */}
            <div className="w-[320px] border-r border-slate-200 bg-white flex flex-col z-10">
                <div className="p-4 border-b border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                        <Typography variant="h6" className="font-bold text-amber-700 flex items-center gap-2">
                            <MonetizationOnIcon /> Commodities
                        </Typography>
                        <div className="flex gap-1">
                             <Tooltip title="New Analysis">
                                <IconButton 
                                    size="small" 
                                    onClick={handleClickMenu} 
                                    disabled={generating}
                                    className="text-amber-600 bg-amber-50 hover:bg-amber-100"
                                >
                                    {generating ? <CircularProgress size={20} /> : <AutoAwesomeIcon fontSize="small"/>}
                                </IconButton>
                            </Tooltip>
                            <Menu
                                anchorEl={anchorEl}
                                open={openMenu}
                                onClose={handleCloseMenu}
                            >
                                <MenuItem onClick={() => { handleGenerate('gold'); handleCloseMenu(); }}>Analyze Gold</MenuItem>
                                <MenuItem onClick={() => { handleGenerate('silver'); handleCloseMenu(); }}>Analyze Silver</MenuItem>
                            </Menu>
                            <IconButton size="small" onClick={loadReports}><RefreshIcon /></IconButton>
                        </div>
                    </div>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search reports..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" className="text-slate-400"/></InputAdornment>,
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f8fafc' } }}
                    />
                </div>

                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    <List disablePadding>
                        {groupedReports.map((group) => (
                            <Box key={group.date}>
                                <ListItemButton onClick={() => toggleDate(group.date)} className="bg-slate-50 py-2 border-b border-slate-100 hover:bg-slate-100">
                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                        <CalendarTodayIcon fontSize="small" sx={{ fontSize: 16, color: '#64748b' }} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={group.date}
                                        primaryTypographyProps={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155', fontFamily: 'monospace' }}
                                    />
                                    {expandedDates.has(group.date) ? <ExpandLess fontSize="small" sx={{ color: '#94a3b8' }} /> : <ExpandMore fontSize="small" sx={{ color: '#94a3b8' }} />}
                                </ListItemButton>
                                
                                <Collapse in={expandedDates.has(group.date)} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding>
                                        {group.items.map(report => (
                                            <ListItemButton
                                                key={report.filename}
                                                selected={selectedReport?.filename === report.filename}
                                                onClick={() => handleSelectReport(report)}
                                                sx={{ 
                                                    pl: 4,
                                                    borderLeft: selectedReport?.filename === report.filename ? '4px solid #b45309' : '4px solid transparent',
                                                    bgcolor: selectedReport?.filename === report.filename ? '#fffbeb' : 'transparent'
                                                }}
                                                className="hover:bg-amber-50"
                                            >
                                                <ListItemIcon sx={{ minWidth: 36 }}>
                                                    {report.fund_code === 'gold' ? (
                                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-100 to-amber-200 text-amber-800 flex items-center justify-center font-bold text-xs shadow-sm border border-amber-200">Au</div>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs shadow-sm border border-slate-300">Ag</div>
                                                    )}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={report.fund_name}
                                                    secondary={report.fund_code === 'gold' ? 'Spot Gold' : 'Spot Silver'}
                                                    primaryTypographyProps={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}
                                                    secondaryTypographyProps={{ fontSize: '0.75rem', color: '#64748b' }}
                                                />
                                            </ListItemButton>
                                        ))}
                                    </List>
                                </Collapse>
                            </Box>
                        ))}
                    </List>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
                {selectedReport && (
                    <div className="p-3 border-b border-slate-200 bg-white flex justify-end">
                         <Tooltip title="Export as Image">
                            <Button 
                                variant="outlined" 
                                size="small" 
                                startIcon={exporting ? <CircularProgress size={16} /> : <DownloadIcon />} 
                                onClick={handleExportImage}
                                disabled={exporting || loadingContent}
                                sx={{ color: '#b45309', borderColor: '#d97706', '&:hover': { bgcolor: '#fffbeb', borderColor: '#b45309'} }}
                            >
                                {exporting ? 'Processing...' : 'Export View'}
                            </Button>
                        </Tooltip>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                    {selectedReport ? (
                        <div ref={reportRef} className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm min-h-[80vh] flex flex-col">
                            <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-amber-50 via-white to-white rounded-t-xl">
                                <div className="flex justify-between items-start mb-4">
                                     <div>
                                        <Typography variant="overline" className="text-amber-600 font-bold tracking-[0.2em] block mb-2">
                                            COMMODITY INTELLIGENCE
                                        </Typography>
                                        <Typography variant="h3" className="font-extrabold text-slate-900 tracking-tight">
                                            {selectedReport.fund_name}
                                        </Typography>
                                     </div>
                                     <Chip 
                                        label={selectedReport.date} 
                                        icon={<CalendarTodayIcon style={{fontSize: 14}}/>}
                                        className="bg-white border border-slate-200 text-slate-500 font-mono"
                                        size="small"
                                     />
                                </div>
                                <div className="flex gap-2">
                                    <Chip 
                                        label="AI DEEP DIVE" 
                                        size="small" 
                                        className="bg-amber-100 text-amber-800 font-bold text-xs" 
                                    />
                                    <Chip 
                                        label={selectedReport.fund_code === 'gold' ? "XAU/USD" : "XAG/USD"} 
                                        size="small" 
                                        variant="outlined"
                                        className="text-slate-500 border-slate-300 text-xs font-mono" 
                                    />
                                </div>
                            </div>
                            
                            <div className="p-10 md:p-12 flex-1 markdown-body bg-white">
                                {loadingContent ? (
                                    <div className="flex justify-center p-20"><CircularProgress size={40} className="text-amber-600"/></div>
                                ) : (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {reportContent}
                                    </ReactMarkdown>
                                )}
                            </div>
                            
                            <div className="p-6 bg-slate-50 border-t border-slate-100 text-center rounded-b-xl">
                                <Typography variant="caption" className="text-slate-400 font-mono text-[10px] tracking-widest uppercase">
                                    Generated by EastMoney Pro AI • Confidential • {new Date().getFullYear()}
                                </Typography>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                <MonetizationOnIcon sx={{ fontSize: 48, color: '#cbd5e1' }} />
                            </div>
                            <Typography variant="h6" className="text-slate-500 font-medium">No Report Selected</Typography>
                            <Typography variant="body2" className="text-slate-400 mt-2">Select a report from the list or generate a new analysis.</Typography>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}