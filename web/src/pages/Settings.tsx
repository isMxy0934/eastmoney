import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Typography, 
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  InputAdornment,
  MenuItem,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import KeyIcon from '@mui/icons-material/Key';
import PsychologyIcon from '@mui/icons-material/Psychology';
import LanguageIcon from '@mui/icons-material/Language';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { fetchSettings, saveSettings } from '../api';
import type { SettingsData } from '../api';

export default function SettingsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    llm_provider: 'gemini',
    gemini_api_key_masked: '',
    openai_api_key_masked: '',
    tavily_api_key_masked: ''
  });
  
  // Inputs
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [tavilyKey, setTavilyKey] = useState('');
  
  const [toast, setToast] = useState<{open: boolean, message: string, severity: 'success'|'error'}>({
    open: false, message: '', severity: 'success'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await fetchSettings();
      setSettings(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
        await saveSettings({
            llm_provider: settings.llm_provider,
            gemini_api_key: geminiKey || undefined,
            openai_api_key: openaiKey || undefined,
            tavily_api_key: tavilyKey || undefined
        });
        setToast({ open: true, message: t('settings.messages.success'), severity: 'success' });
        setGeminiKey('');
        setOpenaiKey('');
        setTavilyKey('');
        await loadSettings();
    } catch (error) {
        setToast({ open: true, message: t('settings.messages.fail'), severity: 'error' });
    } finally {
        setSaving(false);
    }
  };

  if (loading) return (
      <div className="h-[80vh] flex justify-center items-center">
          <CircularProgress />
      </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      {/* Header */}
      <div className="mb-10">
        <Typography variant="h4" align="center" className="text-slate-900 font-extrabold tracking-tight mb-2">
            {t('settings.title')}
        </Typography>
        <Typography variant="body1" align="center" className="text-slate-500 max-w-xl mx-auto">
            {t('settings.subtitle')}
        </Typography>
      </div>

      <div className="space-y-6">
        {/* LLM Engine Section */}
        <Card variant="outlined" className="bg-white border-slate-200 overflow-visible shadow-sm">
            <CardHeader 
                avatar={
                    <div className="bg-blue-50 p-2 rounded-lg text-primary-DEFAULT">
                        <PsychologyIcon fontSize="large" />
                    </div>
                }
                title={<Typography variant="h6" className="text-slate-900 font-bold">{t('settings.llm.title')}</Typography>}
                subheader={<span className="text-slate-500">{t('settings.llm.subtitle')}</span>}
                className="pb-0"
            />
            <CardContent className="p-6 md:p-8">
                <div className="grid grid-cols-1 gap-6">
                    <div>
                         <TextField 
                            fullWidth 
                            label={t('settings.llm.provider')}
                            value={settings.llm_provider}
                            onChange={(e) => setSettings({...settings, llm_provider: e.target.value})}
                            select 
                            variant="outlined"
                            helperText={t('settings.llm.provider_help')}
                            sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#ffffff' } }}
                        >
                            <MenuItem value="gemini">Google Gemini (Recommended)</MenuItem>
                            <MenuItem value="openai">OpenAI (GPT-4)</MenuItem>
                        </TextField>
                    </div>
                    
                    <div>
                        <Divider className="border-slate-200 mb-2">
                            <Chip label={t('settings.llm.credentials')} size="small" className="bg-slate-100 text-slate-500 font-mono text-xs uppercase tracking-wider" />
                        </Divider>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TextField 
                            fullWidth 
                            label={t('settings.llm.gemini_key')}
                            type="password" 
                            placeholder={settings.gemini_api_key_masked || "Enter AIza..."}
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            helperText={settings.gemini_api_key_masked ? "Key is configured" : "Required for Gemini provider"}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><KeyIcon className="text-slate-400" fontSize="small"/></InputAdornment>,
                                endAdornment: settings.gemini_api_key_masked && !geminiKey && (
                                    <InputAdornment position="end"><CheckCircleIcon color="success" fontSize="small"/></InputAdornment>
                                )
                            }}
                            disabled={settings.llm_provider !== 'gemini' && !geminiKey}
                        />
                         <TextField 
                            fullWidth 
                            label={t('settings.llm.openai_key')}
                            type="password" 
                            placeholder={settings.openai_api_key_masked || "Enter sk-..."}
                            value={openaiKey}
                            onChange={(e) => setOpenaiKey(e.target.value)}
                            helperText={settings.openai_api_key_masked ? "Key is configured" : "Required for OpenAI provider"}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><KeyIcon className="text-slate-400" fontSize="small"/></InputAdornment>,
                                endAdornment: settings.openai_api_key_masked && !openaiKey && (
                                    <InputAdornment position="end"><CheckCircleIcon color="success" fontSize="small"/></InputAdornment>
                                )
                            }}
                            disabled={settings.llm_provider !== 'openai' && !openaiKey}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Data Sources Section */}
        <Card variant="outlined" className="bg-white border-slate-200 shadow-sm">
            <CardHeader 
                avatar={
                    <div className="bg-teal-50 p-2 rounded-lg text-secondary-main">
                        <LanguageIcon fontSize="large" />
                    </div>
                }
                title={<Typography variant="h6" className="text-slate-900 font-bold">{t('settings.data.title')}</Typography>}
                subheader={<span className="text-slate-500">{t('settings.data.subtitle')}</span>}
                className="pb-0"
            />
            <CardContent className="p-6 md:p-8">
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <Alert severity="info" icon={<InfoOutlinedIcon />} className="bg-blue-50 text-blue-800 border border-blue-100 mb-6">
                            {t('settings.data.tavily_info')}
                        </Alert>
                        <TextField 
                            fullWidth 
                            label={t('settings.data.tavily_key')}
                            type="password"
                            placeholder={settings.tavily_api_key_masked || "Enter tvly-..."}
                            value={tavilyKey}
                            onChange={(e) => setTavilyKey(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><KeyIcon className="text-slate-400" fontSize="small"/></InputAdornment>,
                                endAdornment: settings.tavily_api_key_masked && !tavilyKey && (
                                    <InputAdornment position="end"><CheckCircleIcon color="success" fontSize="small"/></InputAdornment>
                                )
                            }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Action Area */}
        <div className="flex justify-center pt-8">
             <Button 
                variant="contained" 
                size="large"
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />} 
                onClick={handleSave}
                disabled={saving}
                className="px-10 py-3 rounded-lg text-lg font-bold bg-primary hover:bg-primary-dark shadow-lg shadow-blue-500/20"
            >
                {saving ? t('settings.saving') : t('settings.save')}
            </Button>
        </div>
      </div>

      <Snackbar 
        open={toast.open} 
        autoHideDuration={4000} 
        onClose={() => setToast({...toast, open: false})}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} sx={{ width: '100%', borderRadius: 2 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </div>
  );
}