import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  LayoutDashboard, Users, Wallet, TrendingUp, Image as ImageIcon, 
  ShieldAlert, Bell, Settings, Search, Sparkles, LogOut, 
  ChevronRight, ArrowUpRight, ArrowDownRight, Activity,
  AlertTriangle, CheckCircle2, MoreVertical, Filter, Download,
  Plus, Eye, Ban, FileText, RefreshCw, AlertCircle, BrainCircuit
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { cn } from '../lib/utils';

interface AdminPanelProps {
  onExit: () => void;
}

const adminNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'wallets', label: 'Wallets & Tx', icon: Wallet },
  { id: 'investments', label: 'Investments', icon: TrendingUp },
  { id: 'nft', label: 'NFT & Crypto', icon: ImageIcon },
  { id: 'compliance', label: 'Compliance', icon: ShieldAlert },
  { id: 'content', label: 'Content', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'ai-insights', label: 'AI Insights', icon: Sparkles },
];

const performanceData = [
  { time: '00:00', volume: 1200, users: 450, gmv: 45000 },
  { time: '04:00', volume: 1900, users: 520, gmv: 52000 },
  { time: '08:00', volume: 3500, users: 1100, gmv: 125000 },
  { time: '12:00', volume: 5200, users: 2800, gmv: 280000 },
  { time: '16:00', volume: 4800, users: 2400, gmv: 245000 },
  { time: '20:00', volume: 2100, users: 850, gmv: 85000 },
];

const recentTransactions = [
  { id:'TX-9821', time:'2 mins ago', user:'sarah.o@example.com', asset:'USDC', amount:'+$50,000', status:'Completed', risk:'Low'},
  { id:'TX-9820', time:'15 mins ago', user:'mike.c@example.com', asset:'ETH', amount:'-$12,400', status:'Pending', risk:'Medium'},
  { id:'TX-9819', time:'1 hour ago', user:'investor99@mail.com', asset:'Naspers Equity', amount:'+$150,000', status:'Flagged', risk:'High'},
  { id:'TX-9818', time:'2 hours ago', user:'david.n@example.com', asset:'BTC', amount:'+$8,200', status:'Completed', risk:'Low'},
];

const mockUsers = [
  { id: '1', name: 'Alex Thompson', email: 'alex.t@example.com', kyc: 'Verified', balance: '$145,200.00', risk: 'Low', lastActive: '2 mins ago', role: 'Investor' },
  { id: '2', name: 'Sarah Chen', email: 'schen@example.com', kyc: 'Pending', balance: '$12,450.00', risk: 'Medium', lastActive: '1 hr ago', role: 'Trader' },
  { id: '3', name: 'Michael Ross', email: 'mross@example.com', kyc: 'Verified', balance: '$2,450,000.00', risk: 'Low', lastActive: '5 mins ago', role: 'Institution' },
  { id: '4', name: 'Emma Wilson', email: 'emma.w@example.com', kyc: 'Rejected', balance: '$0.00', risk: 'High', lastActive: '2 days ago', role: 'Investor' },
  { id: '5', name: 'David Kim', email: 'dkim@example.com', kyc: 'Verified', balance: '$84,300.00', risk: 'Low', lastActive: 'Just now', role: 'Trader' },
];

const mockAIInsights = [
  { id: 'AI-001', type: 'Warning', title: 'Liquidity Warning', description: 'USDC Pool liquidity is dropping rapidly. Consider adjusting yield to attract deposits.', impact: 'High', time: '10 mins ago' },
  { id: 'AI-002', type: 'Alert', title: 'Trading Anomaly', description: 'Unusual trading volume detected on AgriFarm Plot A. Potential market manipulation.', impact: 'Critical', time: '1 hour ago' },
  { id: 'AI-003', type: 'Insight', title: 'Investment Trend', description: 'Renewable energy assets are seeing a 25% increase in interest this week.', impact: 'Medium', time: '5 hours ago' },
  { id: 'AI-004', type: 'Insight', title: 'User Behavior', description: 'New users from the recent marketing campaign are showing a high drop-off rate at the KYC step.', impact: 'Medium', time: '1 day ago' },
];

const mockWallets = [
  { id:'W-1001', user:'Alex Thompson', type:'Fiat', balance:'$145,200.00', status:'Active', lastActivity:'2 mins ago'},
  { id:'W-1002', user:'Sarah Chen', type:'Crypto', balance:'12.5 ETH', status:'Active', lastActivity:'1 hr ago'},
  { id:'W-1003', user:'Michael Ross', type:'Equity', balance:'5,000 Shares', status:'Active', lastActivity:'5 mins ago'},
  { id:'W-1004', user:'Emma Wilson', type:'Fiat', balance:'$0.00', status:'Suspended', lastActivity:'2 days ago'},
];

const mockCompliance = [
  { id:'KYC-501', user:'Alex Thompson', type:'Level 2', status:'Approved', submitted:'2 days ago', risk:'Low'},
  { id:'KYC-502', user:'Sarah Chen', type:'Level 1', status:'Pending', submitted:'1 hr ago', risk:'Medium'},
  { id:'KYC-503', user:'Michael Ross', type:'Corporate', status:'Approved', submitted:'1 week ago', risk:'Low'},
  { id:'KYC-504', user:'Emma Wilson', type:'Level 2', status:'Rejected', submitted:'2 days ago', risk:'High'},
];

const mockInvestments = [
  { id:'INV-201', name:'Naspers', type:'Equity', raised:'$1.2M', target:'$2M', investors: 145, status:'Active'},
  { id:'INV-202', name:'SolarGrid Pro', type:'Debt', raised:'$500K', target:'$500K', investors: 82, status:'Closed'},
  { id:'INV-203', name:'TechHub Lagos', type:'Real Estate', raised:'$2.5M', target:'$5M', investors: 310, status:'Active'},
  { id:'INV-204', name:'Financials AI', type:'Equity', raised:'$0', target:'$1M', investors: 0, status:'Pending'},
];

const mockNFTs = [
  { id:'NFT-301', name:'AgriFarm Plot A', collection:'Real Estate', owner:'Alex Thompson', value:'$25,000', status:'Listed'},
  { id:'NFT-302', name:'Solar Panel 12B', collection:'Energy', owner:'Sarah Chen', value:'$1,200', status:'Held'},
  { id:'NFT-303', name:'TechHub Share #45', collection:'Equity', owner:'Michael Ross', value:'$5,000', status:'Listed'},
  { id:'NFT-304', name:'Carbon Credit 2025', collection:'Commodity', owner:'Emma Wilson', value:'$500', status:'Held'},
];

const mockContent = [
  { id:'POST-401', title:'Q3 Platform Update', type:'Announcement', author:'Admin', date:'Oct 15, 2025', status:'Published'},
  { id:'POST-402', title:'New Investment Opportunity: SolarGrid', type:'Notification', author:'System', date:'Oct 12, 2025', status:'Published'},
  { id:'POST-403', title:'Maintenance Scheduled', type:'Alert', author:'Admin', date:'Oct 20, 2025', status:'Draft'},
  { id:'POST-404', title:'Market Analysis Report', type:'Article', author:'AI Advisor', date:'Oct 10, 2025', status:'Published'},
];

const mockAuditLogs = [
  { id: 'LOG-601', action: 'User Suspended', admin: 'superadmin@nxg.com', target: 'Emma Wilson', time: '2 days ago', ip: '192.168.1.1' },
  { id: 'LOG-602', action: 'Investment Approved', admin: 'investments@nxg.com', target: 'Naspers', time: '1 week ago', ip: '192.168.1.2' },
  { id: 'LOG-603', action: 'System Settings Updated', admin: 'superadmin@nxg.com', target: 'Fee Structure', time: '2 weeks ago', ip: '192.168.1.1' },
  { id: 'LOG-604', action: 'KYC Rejected', admin: 'compliance@nxg.com', target: 'Emma Wilson', time: '2 days ago', ip: '192.168.1.3' },
];

const KpiCard = ({ title, value, delta, sparklineData }: any) => (
  <div className="bg-[#121826] rounded-lg p-3 flex flex-col justify-between relative overflow-hidden group">
    <div className="flex justify-between items-start mb-4">
      <div className="text-sm text-zinc-400 font-medium">{title}</div>
      <div className={cn("text-sm font-semibold flex items-center gap-1", delta > 0 ?"text-emerald-400" : "text-rose-400")}>
        {delta > 0 ? <ArrowUpRight className="w-4 h-4"/> : <ArrowDownRight className="w-4 h-4"/>}
        {Math.abs(delta)}%
      </div>
    </div>
    <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
    
    <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30 group-hover:opacity-60 transition-opacity">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={sparklineData}>
          <defs>
            <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={delta > 0 ?'#10B981' : '#F43F5E'} stopOpacity={0.4} />
              <stop offset="100%" stopColor={delta > 0 ?'#10B981' : '#F43F5E'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke={delta > 0 ? '#10B981' : '#F43F5E'} fill={`url(#grad-${title})`} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export function AdminPanel({ onExit }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveUsers, setLiveUsers] = useState<any[]>([]);
  const [adminNotice, setAdminNotice] = useState<string | null>(null);

  // Dashboard interactive states
  const [perfRange, setPerfRange] = useState<'1D' | '1W' | '1M' | '1Y'>('1D');
  const [heatmapMode, setHeatmapMode] = useState<'Trades' | 'Logins'>('Trades');
  const [dashFlaggedOnly, setDashFlaggedOnly] = useState(false);

  // Users management states
  const [usersList, setUsersList] = useState(mockUsers);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All Roles');
  const [userKycFilter, setUserKycFilter] = useState('All KYC Status');
  const [userPage, setUserPage] = useState(1);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', role: 'Investor' });
  const [inspectItem, setInspectItem] = useState<{ title: string; fields: Record<string, any> } | null>(null);

  // Wallets & Transactions states
  const [txList, setTxList] = useState(recentTransactions);
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('All Types');
  const [txStatusFilter, setTxStatusFilter] = useState('All Statuses');
  const [txPage, setTxPage] = useState(1);

  // Compliance states
  const [complianceList, setComplianceList] = useState(mockCompliance);
  const [compSearch, setCompSearch] = useState('');
  const [compStatusFilter, setCompStatusFilter] = useState('All Statuses');
  const [compPage, setCompPage] = useState(1);

  // Investments states
  const [investmentsList, setInvestmentsList] = useState(mockInvestments);
  const [invSearch, setInvSearch] = useState('');
  const [invTypeFilter, setInvTypeFilter] = useState('All Types');
  const [invStatusFilter, setInvStatusFilter] = useState('All Statuses');
  const [showNewOfferingModal, setShowNewOfferingModal] = useState(false);
  const [newOfferingForm, setNewOfferingForm] = useState({ name:'', type:'Equity', target:'$1M'});

  // NFT & Crypto states
  const [nftList, setNftList] = useState(mockNFTs);
  const [nftSearch, setNftSearch] = useState('');
  const [nftTypeFilter, setNftTypeFilter] = useState('All Types');
  const [nftStatusFilter, setNftStatusFilter] = useState('All Statuses');
  const [showMintModal, setShowMintModal] = useState(false);
  const [newNftForm, setNewNftForm] = useState({ name: '', collection: 'Real Estate', value: '$5,000' });

  // Content & Notifications states
  const [contentList, setContentList] = useState(mockContent);
  const [contentSearch, setContentSearch] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState('All Types');
  const [contentStatusFilter, setContentStatusFilter] = useState('All Statuses');
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [newPostForm, setNewPostForm] = useState({ title: '', type: 'Announcement' });

  // Settings & Audit logs states
  const [settingsState, setSettingsState] = useState({
    tradingEngine: true,
    newUserRegistration: true,
    maintenanceMode: false,
    tradingFee: '0.1',
    withdrawalFee: '25.00'
  });
  const [auditLogsList, setAuditLogsList] = useState(mockAuditLogs);

  // AI Insights states
  const [aiInsightsList, setAiInsightsList] = useState(mockAIInsights);
  const [aiSearch, setAiSearch] = useState('');
  const [aiTypeFilter, setAiTypeFilter] = useState('All Types');
  const [showAlertsPopover, setShowAlertsPopover] = useState(false);

  const notifyAdmin = (msg: string) => {
    setAdminNotice(msg);
  };

  const downloadCsv = (filename: string, headers: string[], rows: any[][]) => {
    const csv = [headers.join(','), ...rows.map(r => r.map(v =>`"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notifyAdmin(`Exported ${filename}`);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (data && !error) {
        setLiveUsers(data.map(u => ({
          id: u.id,
          name: u.full_name || 'Unknown',
          email: u.email || 'N/A',
          kyc: u.kyc_status ||'Pending',
          balance: '$0.00',
          risk: 'Low',
          lastActive: new Date(u.updated_at).toLocaleDateString(),
          role: u.role || 'Investor'
        })));
      }
    } catch (e) {
      console.warn('Could not fetch profiles from Supabase:', e);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: 'Suspended', risk: 'High' } : u));
    setLiveUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'Suspended', risk: 'High' } : u));
    setAuditLogsList(prev => [{ id:`LOG-${Date.now().toString().slice(-3)}`, action:'User Suspended', admin:'superadmin@nxg.com', target: userId, time:'Just now', ip:'192.168.1.1'}, ...prev]);
    notifyAdmin(`Suspended user ${userId}.`);
    if (!isSupabaseConfigured) return;
    try {
      const { error } = await supabase.from('profiles').update({ role: 'suspended' }).eq('id', userId);
      if (!error) fetchUsers();
    } catch (e) {
      console.warn('Could not suspend user:', e);
    }
  };

  const handleApproveKYC = async (userId: string) => {
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, kyc: 'Verified', risk: 'Low' } : u));
    setLiveUsers(prev => prev.map(u => u.id === userId ? { ...u, kyc: 'Verified', risk: 'Low' } : u));
    setAuditLogsList(prev => [{ id:`LOG-${Date.now().toString().slice(-3)}`, action:'KYC Approved', admin:'compliance@nxg.com', target: userId, time:'Just now', ip:'192.168.1.3'}, ...prev]);
    notifyAdmin(`Approved KYC verification for user ${userId}.`);
    if (!isSupabaseConfigured) return;
    try {
      const { error } = await supabase.from('profiles').update({ kyc_status:'Verified'}).eq('id', userId);
      if (!error) fetchUsers();
    } catch (e) {
      console.warn('Could not approve KYC:', e);
    }
  };

  const handleExportLogs = async () => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('audit_logs').select('*');
        if (data && !error && data.length > 0) {
          downloadCsv('audit_logs.csv', Object.keys(data[0]), data.map(row => Object.values(row)));
          return;
        }
      } catch (e) {
        console.warn('Could not export logs from Supabase, falling back to local export:', e);
      }
    }
    const sourceUsers = liveUsers.length > 0 ? liveUsers : usersList;
    downloadCsv(
      'aqx_users_export.csv',
      ['ID', 'Name', 'Email', 'Role', 'KYC', 'Balance', 'Risk', 'Last Active'],
      sourceUsers.map(u => [u.id, u.name, u.email, u.role, u.kyc, u.balance, u.risk, u.lastActive])
    );
  };

  const chartMultiplier = perfRange === '1D' ? 1 : perfRange === '1W' ? 4.2 : perfRange === '1M' ? 14.5 : 88;
  const activePerformanceData = performanceData.map(pt => ({
    ...pt,
    gmv: Math.round(pt.gmv * chartMultiplier)
  }));

  const combinedUsers = (liveUsers.length > 0 ? liveUsers : usersList).filter(u => {
    const q = (userSearch || searchQuery).toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
    const matchRole = userRoleFilter === 'All Roles' || u.role.toLowerCase() === userRoleFilter.toLowerCase();
    const matchKyc = userKycFilter ==='All KYC Status'|| u.kyc.toLowerCase() === userKycFilter.toLowerCase();
    return matchSearch && matchRole && matchKyc;
  });

  const filteredTransactions = txList.filter(tx => {
    const q = (txSearch || searchQuery).toLowerCase();
    const matchSearch = !q || tx.id.toLowerCase().includes(q) || tx.user.toLowerCase().includes(q) || tx.asset.toLowerCase().includes(q);
    const matchType =
      txTypeFilter === 'All Types' ||
      (txTypeFilter === 'Deposit' && tx.amount.startsWith('+')) ||
      (txTypeFilter === 'Withdrawal' && tx.amount.startsWith('-')) ||
      (txTypeFilter === 'Trade' && !tx.amount.startsWith('+') && !tx.amount.startsWith('-'));
    const matchStatus = txStatusFilter ==='All Statuses'|| tx.status === txStatusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const filteredCompliance = complianceList.filter(item => {
    const q = (compSearch || searchQuery).toLowerCase();
    const matchSearch = !q || item.id.toLowerCase().includes(q) || item.user.toLowerCase().includes(q) || item.type.toLowerCase().includes(q);
    const matchStatus = compStatusFilter ==='All Statuses'|| item.status === compStatusFilter;
    return matchSearch && matchStatus;
  });

  const filteredInvestments = investmentsList.filter(item => {
    const q = (invSearch || searchQuery).toLowerCase();
    const matchSearch = !q || item.id.toLowerCase().includes(q) || item.name.toLowerCase().includes(q);
    const matchType = invTypeFilter === 'All Types' || item.type === invTypeFilter;
    const matchStatus = invStatusFilter ==='All Statuses'|| item.status === invStatusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const filteredNfts = nftList.filter(item => {
    const q = (nftSearch || searchQuery).toLowerCase();
    const matchSearch = !q || item.id.toLowerCase().includes(q) || item.name.toLowerCase().includes(q) || item.owner.toLowerCase().includes(q);
    const matchType = nftTypeFilter === 'All Types' || item.collection.toLowerCase().includes(nftTypeFilter.toLowerCase()) || nftTypeFilter === 'NFT';
    const matchStatus = nftStatusFilter ==='All Statuses'|| (nftStatusFilter ==='Active'? item.status !=='Sold Out': item.status === nftStatusFilter);
    return matchSearch && matchType && matchStatus;
  });

  const filteredContent = contentList.filter(item => {
    const q = (contentSearch || searchQuery).toLowerCase();
    const matchSearch = !q || item.id.toLowerCase().includes(q) || item.title.toLowerCase().includes(q);
    const matchType = contentTypeFilter === 'All Types' || item.type === contentTypeFilter;
    const matchStatus = contentStatusFilter ==='All Statuses'|| item.status === contentStatusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const filteredAiInsights = aiInsightsList.filter(item => {
    const q = (aiSearch || searchQuery).toLowerCase();
    const matchSearch = !q || item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    const matchType = aiTypeFilter === 'All Types' || item.type === aiTypeFilter;
    return matchSearch && matchType;
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-3">
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiCard 
                title="Total Active Users" 
                value="124,592" 
                delta={12.5} 
                sparklineData={[{value: 100}, {value: 120}, {value: 115}, {value: 140}, {value: 180}]} 
              />
              <KpiCard 
                title="Total Wallet Balance" 
                value="$842.5M" 
                delta={8.2} 
                sparklineData={[{value: 800}, {value: 810}, {value: 825}, {value: 830}, {value: 842}]} 
              />
              <KpiCard 
                title="24h Transaction Vol" 
                value="$12.4M" 
                delta={-2.4} 
                sparklineData={[{value: 15}, {value: 14}, {value: 12}, {value: 13}, {value: 12.4}]} 
              />
              <KpiCard 
                title="Pending KYC" 
                value="1,284" 
                delta={5.1} 
                sparklineData={[{value: 1000}, {value: 1100}, {value: 1050}, {value: 1200}, {value: 1284}]} 
              />
            </div>

            {/* Charts & AI Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-8 bg-[#121826] rounded-lg p-3.5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-white">Platform Performance</h3>
                  <div className="flex bg-black/40 rounded-lg p-1">
                    {(['1D', '1W', '1M', '1Y'] as const).map(t => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setPerfRange(t)}
                        className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer", t === perfRange ?"bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300")}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activePerformanceData}>
                      <defs>
                        <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${Math.round(value/1000)}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#121826', borderColor: 'transparent', borderRadius: '12px' }}
                        itemStyle={{ color:'#E5E7EB'}}
                      />
                      <Area type="monotone" dataKey="gmv" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorGmv)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-4 bg-[#121826] rounded-lg p-3.5 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-purple-400"/>
                  <h3 className="text-lg font-semibold text-white">AI Insights</h3>
                </div>
                <div className="space-y-4 flex-1">
                  <div className="p-4 rounded-xl bg-rose-500/10">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5"/>
                      <div>
                        <h4 className="text-sm font-medium text-rose-400">Liquidity Warning</h4>
                        <p className="text-xs text-rose-300/70 mt-1">USDC hot wallet balance dropping below 15% threshold. Recommended action: Rebalance from cold storage.</p>
                        <button
                          type="button"
                          onClick={() => notifyAdmin('Executed cold-to-hot USDC liquidity rebalance ($2,500,000 transferred).')}
                          className="mt-3 text-xs font-semibold bg-rose-500/20 text-rose-300 px-3 py-1.5 rounded-lg hover:bg-rose-500/30 transition-colors cursor-pointer"
                        >
                          Execute Rebalance
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-500/10">
                    <div className="flex items-start gap-3">
                      <Activity className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5"/>
                      <div>
                        <h4 className="text-sm font-medium text-emerald-400">Trading Anomaly</h4>
                        <p className="text-xs text-emerald-300/70 mt-1">Unusual spike in secondary market trades for Naspers. No malicious patterns detected. Likely driven by recent PR.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Heatmap & Transactions Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* Heatmap */}
              <div className="lg:col-span-6 bg-[#121826] rounded-lg overflow-hidden flex flex-col">
                <div className="p-3.5 flex justify-between items-center bg-white/[0.03]">
                  <h3 className="text-lg font-semibold text-white">Activity Heatmap</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setHeatmapMode('Trades')}
                      className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer", heatmapMode ==='Trades'?"bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300")}
                    >
                      Trades
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeatmapMode('Logins')}
                      className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer", heatmapMode ==='Logins'?"bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300")}
                    >
                      Logins
                    </button>
                  </div>
                </div>
                <div className="p-3.5 flex-1 flex flex-col justify-center">
                  <div className="grid grid-cols-8 gap-1">
                    <div className="col-span-1"></div>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                      <div key={d} className="text-center text-[10px] text-zinc-500 font-medium">{d}</div>
                    ))}
                    
                    {['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'].map((time, i) => (
                      <React.Fragment key={time}>
                        <div className="text-right text-[10px] text-zinc-500 font-medium pr-2 flex items-center justify-end">{time}</div>
                        {Array.from({ length: 7 }).map((_, j) => {
                          const phase = heatmapMode === 'Trades' ? 1.5 : 2.3;
                          const intensity = Math.sin(i * phase + j) * 0.5 + 0.5;
                          const bgOpacity = Math.max(0.1, intensity);
                          return (
                            <div 
                              key={`${i}-${j}`} 
                              className="aspect-square rounded-sm transition-all hover:scale-110 hover:z-10 cursor-pointer relative group"
                              style={{ backgroundColor: heatmapMode ==='Trades'?`rgba(59, 130, 246, ${bgOpacity})`:`rgba(16, 185, 129, ${bgOpacity})`}}
                            >
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20">
                                {Math.floor(intensity * (heatmapMode === 'Trades' ? 1000 : 2400))} {heatmapMode.toLowerCase()}
                              </div>
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-zinc-500">
                    <span>Less</span>
                    <div className="w-16 h-2 rounded-full bg-gradient-to-r from-blue-500/10 to-blue-500/90"/>
                    <span>More</span>
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="lg:col-span-6 bg-[#121826] rounded-lg overflow-hidden flex flex-col">
                <div className="p-3.5 flex justify-between items-center bg-white/[0.03]">
                  <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDashFlaggedOnly(prev => !prev)}
                      title={dashFlaggedOnly ? 'Show All Transactions' : 'Filter Pending & Flagged Only'}
                      className={cn("p-2 rounded-lg transition-colors cursor-pointer bg-white/[0.03]", dashFlaggedOnly ?"bg-amber-500/20 text-amber-300" : "bg-white/5 text-zinc-400 hover:text-white")}
                    >
                      <Filter className="w-4 h-4"/>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadCsv('aqx_recent_transactions.csv', ['ID','Time','User','Asset','Amount','Status','Risk'], txList.map(t => [t.id, t.time, t.user, t.asset, t.amount, t.status, t.risk]))}
                      title="Download Transactions CSV"
                      className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-black/20 text-xs uppercase tracking-wider text-zinc-500">
                        <th className="px-2.5 py-1.5 font-medium">User</th>
                        <th className="px-2.5 py-1.5 font-medium">Asset</th>
                        <th className="px-2.5 py-1.5 font-medium">Amount</th>
                        <th className="px-2.5 py-1.5 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="">
                      {txList.filter(t => !dashFlaggedOnly || t.status !=='Completed').map((tx) => (
                        <tr
                          key={tx.id}
                          onClick={() => setInspectItem({ title: `Transaction ${tx.id}`, fields: tx })}
                          className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                        >
                          <td className="px-2.5 py-1.5">
                            <div className="text-sm text-zinc-300">{tx.user}</div>
                            <div className="text-[10px] text-zinc-500">{tx.time}</div>
                          </td>
                          <td className="px-2.5 py-1.5 text-xs text-zinc-300">{tx.asset}</td>
                          <td className={cn("px-4 py-3 text-sm font-medium", tx.amount.startsWith('+') ?"text-emerald-400" : "text-white")}>{tx.amount}</td>
                          <td className="px-2.5 py-1.5">
                            <span className={cn(
                              "px-2 py-1 text-[10px] font-medium rounded-full bg-white/[0.03]",
                              tx.status ==='Completed'?"bg-emerald-500/10 text-emerald-400":
                              tx.status ==='Pending'?"bg-amber-500/10 text-amber-400":
                              "bg-rose-500/10 text-rose-400"
                            )}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="flex flex-col h-full space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-white">User Management</h2>
              <div className="flex gap-3">
                <button type="button" onClick={handleExportLogs} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer">
                  <Download className="w-4 h-4"/> Export CSV
                </button>
                <button type="button" onClick={() => setShowAddUserModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer">
                  <Plus className="w-4 h-4"/> Add User
                </button>
              </div>
            </div>

            <div className="bg-[#121826] rounded-lg overflow-hidden flex flex-col flex-1">
              <div className="p-4 flex items-center justify-between gap-4 bg-white/[0.03]">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
                  <input 
                    type="text" 
                    value={userSearch}
                    onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                    placeholder="Search users by name, email, or ID..." 
                    className="w-full bg-black/20 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => { setUserRoleFilter(e.target.value); setUserPage(1); }}
                    className="bg-black/20 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none appearance-none"
                  >
                    <option>All Roles</option>
                    <option>Investor</option>
                    <option>Trader</option>
                    <option>Institution</option>
                  </select>
                  <select
                    value={userKycFilter}
                    onChange={(e) => { setUserKycFilter(e.target.value); setUserPage(1); }}
                    className="bg-black/20 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none appearance-none"
                  >
                    <option>All KYC Status</option>
                    <option>Verified</option>
                    <option>Pending</option>
                    <option>Rejected</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => { setUserSearch(''); setUserRoleFilter('All Roles'); setUserKycFilter('All KYC Status'); setUserPage(1); notifyAdmin('Reset user filters.'); }}
                    title="Reset Filters"
                    className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Filter className="w-4 h-4"/>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-black/20 text-xs uppercase tracking-wider text-zinc-500">
                      <th className="px-3 py-1.5 font-medium">User</th>
                      <th className="px-3 py-1.5 font-medium">Role</th>
                      <th className="px-3 py-1.5 font-medium">KYC Status</th>
                      <th className="px-3 py-1.5 font-medium">Wallet Balance</th>
                      <th className="px-3 py-1.5 font-medium">Risk Score</th>
                      <th className="px-3 py-1.5 font-medium">Last Active</th>
                      <th className="px-3 py-1.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="">
                    {combinedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-3 py-1.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-blue-400 font-medium text-xs">
                              {user.name.split('').map((n: string) => n[0]).join('')}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">{user.name}</div>
                              <div className="text-xs text-zinc-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-1.5 text-xs text-zinc-300">{user.role}</td>
                        <td className="px-3 py-1.5">
                          <span className={cn(
                            "px-2.5 py-1 text-xs font-medium rounded-full bg-white/[0.03]",
                            user.kyc === 'Verified' ? "bg-emerald-500/10 text-emerald-400" :
                            user.kyc === 'Pending' ? "bg-amber-500/10 text-amber-400" :
                            "bg-rose-500/10 text-rose-400"
                          )}>
                            {user.kyc}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-xs font-medium text-white">{user.balance}</td>
                        <td className="px-3 py-1.5">
                          <span className={cn(
                            "text-sm font-medium",
                            user.risk === 'Low' ? "text-emerald-400" :
                            user.risk === 'Medium' ? "text-amber-400" :
                            "text-rose-400"
                          )}>
                            {user.risk}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-xs text-zinc-400">{user.lastActive}</td>
                        <td className="px-3 py-1.5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={() => handleApproveKYC(user.id)} className="p-1.5 rounded-md text-emerald-400 hover:bg-emerald-400/10 transition-colors cursor-pointer" title="Approve KYC">
                              <CheckCircle2 className="w-4 h-4"/>
                            </button>
                            <button type="button" onClick={() => setInspectItem({ title:`User Profile: ${user.name}`, fields: user })} className="p-1.5 rounded-md text-blue-400 hover:bg-blue-400/10 transition-colors cursor-pointer" title="View Profile">
                              <Eye className="w-4 h-4"/>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAuditLogsList(prev => [{ id:`LOG-${Date.now().toString().slice(-3)}`, action:'2FA Token Reset', admin:'superadmin@nxg.com', target: user.name, time:'Just now', ip:'192.168.1.1'}, ...prev]);
                                notifyAdmin(`Issued hardware/TOTP 2FA reset link for ${user.email}.`);
                              }}
                              className="p-1.5 rounded-md text-amber-400 hover:bg-amber-400/10 transition-colors cursor-pointer"
                              title="Reset 2FA"
                            >
                              <ShieldAlert className="w-4 h-4"/>
                            </button>
                            <button type="button" onClick={() => handleSuspendUser(user.id)} className="p-1.5 rounded-md text-rose-400 hover:bg-rose-400/10 transition-colors cursor-pointer" title="Suspend User">
                              <Ban className="w-4 h-4"/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-4 flex items-center justify-between text-sm text-zinc-500 bg-white/[0.03]">
                <div>Showing {combinedUsers.length} filtered users (Page {userPage})</div>
                <div className="flex gap-1">
                  <button type="button" disabled={userPage <= 1} onClick={() => setUserPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded hover:bg-white/5 disabled:opacity-50 cursor-pointer">Prev</button>
                  {[1, 2, 3].map(p => (
                    <button type="button" key={p} onClick={() => setUserPage(p)} className={cn("px-3 py-1 rounded cursor-pointer bg-white/[0.03]", userPage === p ?"bg-white/10 text-white" : "hover:bg-white/5")}>{p}</button>
                  ))}
                  <button type="button" disabled={userPage >= 3} onClick={() => setUserPage(p => Math.min(3, p + 1))} className="px-3 py-1 rounded hover:bg-white/5 disabled:opacity-50 cursor-pointer">Next</button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'wallets':
        return (
          <div className="flex flex-col h-full space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-white">Wallets & Transactions</h2>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => downloadCsv('aqx_wallets_transactions.csv', ['ID','Time','User','Asset','Amount','Status','Risk'], filteredTransactions.map(t => [t.id, t.time, t.user, t.asset, t.amount, t.status, t.risk]))}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4"/> Export Report
                </button>
              </div>
            </div>

            {/* Liquidity Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-[#121826] rounded-lg p-3">
                <div className="text-sm text-zinc-400 font-medium mb-1">Total Platform Liquidity</div>
                <div className="text-2xl font-semibold text-white">$145,240,500.00</div>
              </div>
              <div className="bg-[#121826] rounded-lg p-3">
                <div className="text-sm text-zinc-400 font-medium mb-1">24h Deposit Volume</div>
                <div className="text-2xl font-semibold text-emerald-400">+$2,450,000.00</div>
              </div>
              <div className="bg-[#121826] rounded-lg p-3">
                <div className="text-sm text-zinc-400 font-medium mb-1">24h Withdrawal Volume</div>
                <div className="text-2xl font-semibold text-rose-400">-$845,200.00</div>
              </div>
            </div>

            <div className="bg-[#121826] rounded-lg overflow-hidden flex flex-col flex-1">
              <div className="p-4 flex items-center justify-between gap-4 bg-white/[0.03]">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
                  <input 
                    type="text" 
                    value={txSearch}
                    onChange={(e) => { setTxSearch(e.target.value); setTxPage(1); }}
                    placeholder="Search transactions by ID, user, or asset..." 
                    className="w-full bg-black/20 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={txTypeFilter}
                    onChange={(e) => { setTxTypeFilter(e.target.value); setTxPage(1); }}
                    className="bg-black/20 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none appearance-none"
                  >
                    <option>All Types</option>
                    <option>Deposit</option>
                    <option>Withdrawal</option>
                    <option>Trade</option>
                  </select>
                  <select
                    value={txStatusFilter}
                    onChange={(e) => { setTxStatusFilter(e.target.value); setTxPage(1); }}
                    className="bg-black/20 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none appearance-none"
                  >
                    <option>All Statuses</option>
                    <option>Completed</option>
                    <option>Pending</option>
                    <option>Flagged</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => { setTxSearch(''); setTxTypeFilter('All Types'); setTxStatusFilter('All Statuses'); setTxPage(1); notifyAdmin('Reset transaction filters.'); }}
                    title="Reset Filters"
                    className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Filter className="w-4 h-4"/>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-black/20 text-xs uppercase tracking-wider text-zinc-500">
                      <th className="px-3 py-1.5 font-medium">Transaction ID</th>
                      <th className="px-3 py-1.5 font-medium">User</th>
                      <th className="px-3 py-1.5 font-medium">Asset</th>
                      <th className="px-3 py-1.5 font-medium">Amount</th>
                      <th className="px-3 py-1.5 font-medium">Status</th>
                      <th className="px-3 py-1.5 font-medium">Risk Level</th>
                      <th className="px-3 py-1.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="">
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-3 py-1.5">
                          <div className="text-sm font-medium text-white">{tx.id}</div>
                          <div className="text-xs text-zinc-500">{tx.time}</div>
                        </td>
                        <td className="px-3 py-1.5 text-xs text-zinc-300">{tx.user}</td>
                        <td className="px-3 py-1.5 text-xs font-medium text-white">{tx.asset}</td>
                        <td className={cn("px-3.5 py-4 text-sm font-medium", tx.amount.startsWith('+') ?"text-emerald-400" : "text-white")}>{tx.amount}</td>
                        <td className="px-3 py-1.5">
                          <span className={cn(
                            "px-2.5 py-1 text-xs font-medium rounded-full bg-white/[0.03]",
                            tx.status ==='Completed'?"bg-emerald-500/10 text-emerald-400":
                            tx.status ==='Pending'?"bg-amber-500/10 text-amber-400":
                            "bg-rose-500/10 text-rose-400"
                          )}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-3 py-1.5">
                          <span className={cn(
                            "text-sm font-medium",
                            tx.risk === 'Low' ? "text-emerald-400" :
                            tx.risk === 'Medium' ? "text-amber-400" :
                            "text-rose-400"
                          )}>
                            {tx.risk}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {tx.status ==='Pending'&& (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTxList(prev => prev.map(item => item.id === tx.id ? { ...item, status:'Completed', risk:'Low'} : item));
                                    notifyAdmin(`Approved settlement for ${tx.id}.`);
                                  }}
                                  className="p-1.5 rounded-md text-emerald-400 hover:bg-emerald-400/10 transition-colors cursor-pointer"
                                  title="Approve"
                                >
                                  <CheckCircle2 className="w-4 h-4"/>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTxList(prev => prev.map(item => item.id === tx.id ? { ...item, status:'Flagged', risk:'High'} : item));
                                    notifyAdmin(`Flagged and rejected ${tx.id} for AML review.`);
                                  }}
                                  className="p-1.5 rounded-md text-rose-400 hover:bg-rose-400/10 transition-colors cursor-pointer"
                                  title="Reject"
                                >
                                  <Ban className="w-4 h-4"/>
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => setInspectItem({ title: `Transaction ${tx.id}`, fields: tx })}
                              className="p-1.5 rounded-md text-blue-400 hover:bg-blue-400/10 transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4"/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-4 flex items-center justify-between text-sm text-zinc-500 bg-white/[0.03]">
                <div>Showing {filteredTransactions.length} transactions (Page {txPage})</div>
                <div className="flex gap-1">
                  <button type="button" disabled={txPage <= 1} onClick={() => setTxPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded hover:bg-white/5 disabled:opacity-50 cursor-pointer">Prev</button>
                  {[1, 2, 3].map(p => (
                    <button type="button" key={p} onClick={() => setTxPage(p)} className={cn("px-3 py-1 rounded cursor-pointer bg-white/[0.03]", txPage === p ?"bg-white/10 text-white" : "hover:bg-white/5")}>{p}</button>
                  ))}
                  <button type="button" disabled={txPage >= 3} onClick={() => setTxPage(p => Math.min(3, p + 1))} className="px-3 py-1 rounded hover:bg-white/5 disabled:opacity-50 cursor-pointer">Next</button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'compliance':
        return (
          <div className="flex flex-col h-full space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-white">KYC/AML Compliance</h2>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => downloadCsv('aqx_compliance_audit.csv', ['App ID','User','Type','Submitted','Status','Risk'], filteredCompliance.map(c => [c.id, c.user, c.type, c.submitted, c.status, c.risk]))}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4"/> Export Audit Log
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-[#121826] rounded-lg p-3">
                <div className="text-sm text-zinc-400 font-medium mb-1">Pending KYC</div>
                <div className="text-2xl font-semibold text-amber-400">{complianceList.filter(c => c.status ==='Pending').length}</div>
              </div>
              <div className="bg-[#121826] rounded-lg p-3">
                <div className="text-sm text-zinc-400 font-medium mb-1">Flagged for AML</div>
                <div className="text-2xl font-semibold text-rose-400">{complianceList.filter(c => c.status ==='Rejected'|| c.status ==='Flagged').length}</div>
              </div>
              <div className="bg-[#121826] rounded-lg p-3">
                <div className="text-sm text-zinc-400 font-medium mb-1">Approved (24h)</div>
                <div className="text-2xl font-semibold text-emerald-400">{complianceList.filter(c => c.status ==='Approved').length}</div>
              </div>
              <div className="bg-[#121826] rounded-lg p-3">
                <div className="text-sm text-zinc-400 font-medium mb-1">Auto-Approval Rate</div>
                <div className="text-2xl font-semibold text-white">84.2%</div>
              </div>
            </div>

            <div className="bg-[#121826] rounded-lg overflow-hidden flex flex-col flex-1">
              <div className="p-4 flex items-center justify-between gap-4 bg-white/[0.03]">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
                  <input 
                    type="text" 
                    value={compSearch}
                    onChange={(e) => { setCompSearch(e.target.value); setCompPage(1); }}
                    placeholder="Search applications..." 
                    className="w-full bg-black/20 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={compStatusFilter}
                    onChange={(e) => { setCompStatusFilter(e.target.value); setCompPage(1); }}
                    className="bg-black/20 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none appearance-none"
                  >
                    <option>All Statuses</option>
                    <option>Approved</option>
                    <option>Pending</option>
                    <option>Rejected</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => { setCompSearch(''); setCompStatusFilter('All Statuses'); setCompPage(1); notifyAdmin('Reset compliance filters.'); }}
                    title="Reset Filters"
                    className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Filter className="w-4 h-4"/>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-black/20 text-xs uppercase tracking-wider text-zinc-500">
                      <th className="px-3 py-1.5 font-medium">App ID</th>
                      <th className="px-3 py-1.5 font-medium">User</th>
                      <th className="px-3 py-1.5 font-medium">Document Type</th>
                      <th className="px-3 py-1.5 font-medium">Submission Date</th>
                      <th className="px-3 py-1.5 font-medium">Status</th>
                      <th className="px-3 py-1.5 font-medium">Risk Score</th>
                      <th className="px-3 py-1.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="">
                    {filteredCompliance.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-3 py-1.5 text-xs font-medium text-white">{item.id}</td>
                        <td className="px-3 py-1.5 text-xs text-zinc-300">{item.user}</td>
                        <td className="px-3 py-1.5 text-xs text-zinc-300">{item.type}</td>
                        <td className="px-3 py-1.5 text-xs text-zinc-400">{item.submitted}</td>
                        <td className="px-3 py-1.5">
                          <span className={cn(
                            "px-2.5 py-1 text-xs font-medium rounded-full bg-white/[0.03]",
                            item.status ==='Approved'?"bg-emerald-500/10 text-emerald-400":
                            item.status ==='Pending'?"bg-amber-500/10 text-amber-400":
                            "bg-rose-500/10 text-rose-400"
                          )}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-3 py-1.5">
                          <span className={cn(
                            "text-sm font-medium",
                            item.risk === 'Low' ? "text-emerald-400" :
                            item.risk === 'Medium' ? "text-amber-400" :
                            "text-rose-400"
                          )}>
                            {item.risk}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => {
                                setComplianceList(prev => prev.map(c => c.id === item.id ? { ...c, status:'Approved', risk:'Low'} : c));
                                notifyAdmin(`Approved ${item.id} (${item.user}).`);
                              }}
                              className="p-1.5 rounded-md text-emerald-400 hover:bg-emerald-400/10 transition-colors cursor-pointer"
                              title="Approve"
                            >
                              <CheckCircle2 className="w-4 h-4"/>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setComplianceList(prev => prev.map(c => c.id === item.id ? { ...c, status:'Pending'} : c));
                                notifyAdmin(`Requested additional UBO/KYC documentation from ${item.user}.`);
                              }}
                              className="p-1.5 rounded-md text-amber-400 hover:bg-amber-400/10 transition-colors cursor-pointer"
                              title="Request More Info"
                            >
                              <FileText className="w-4 h-4"/>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setComplianceList(prev => prev.map(c => c.id === item.id ? { ...c, status:'Rejected', risk:'High'} : c));
                                notifyAdmin(`Rejected ${item.id} (${item.user}).`);
                              }}
                              className="p-1.5 rounded-md text-rose-400 hover:bg-rose-400/10 transition-colors cursor-pointer"
                              title="Reject"
                            >
                              <Ban className="w-4 h-4"/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-4 flex items-center justify-between text-sm text-zinc-500 bg-white/[0.03]">
                <div>Showing {filteredCompliance.length} applications (Page {compPage})</div>
                <div className="flex gap-1">
                  <button type="button" disabled={compPage <= 1} onClick={() => setCompPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded hover:bg-white/5 disabled:opacity-50 cursor-pointer">Prev</button>
                  {[1, 2, 3].map(p => (
                    <button type="button" key={p} onClick={() => setCompPage(p)} className={cn("px-3 py-1 rounded cursor-pointer bg-white/[0.03]", compPage === p ?"bg-white/10 text-white" : "hover:bg-white/5")}>{p}</button>
                  ))}
                  <button type="button" disabled={compPage >= 3} onClick={() => setCompPage(p => Math.min(3, p + 1))} className="px-3 py-1 rounded hover:bg-white/5 disabled:opacity-50 cursor-pointer">Next</button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'investments':
        return (
          <div className="flex flex-col h-full space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-white">Investments & Trading</h2>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNewOfferingModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer">
                  <Plus className="w-4 h-4"/> New Offering
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-[#121826] rounded-lg p-3">
                <div className="text-sm text-zinc-400 font-medium mb-1">Total Trading Volume (24h)</div>
                <div className="text-2xl font-semibold text-white">$12,450,000.00</div>
              </div>
              <div className="bg-[#121826] rounded-lg p-3">
                <div className="text-sm text-zinc-400 font-medium mb-1">Active Offerings</div>
                <div className="text-2xl font-semibold text-white">{investmentsList.filter(i => i.status ==='Active').length}</div>
              </div>
              <div className="bg-[#121826] rounded-lg p-3">
                <div className="text-sm text-zinc-400 font-medium mb-1">Pending Approvals</div>
                <div className="text-2xl font-semibold text-amber-400">{investmentsList.filter(i => i.status ==='Pending').length}</div>
              </div>
            </div>

            <div className="bg-[#121826] rounded-lg overflow-hidden flex flex-col flex-1">
              <div className="p-4 flex items-center justify-between gap-4 bg-white/[0.03]">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
                  <input 
                    type="text" 
                    value={invSearch}
                    onChange={(e) => setInvSearch(e.target.value)}
                    placeholder="Search assets..." 
                    className="w-full bg-black/20 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={invTypeFilter}
                    onChange={(e) => setInvTypeFilter(e.target.value)}
                    className="bg-black/20 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none appearance-none"
                  >
                    <option>All Types</option>
                    <option>Equity</option>
                    <option>Debt</option>
                    <option>Real Estate</option>
                  </select>
                  <select
                    value={invStatusFilter}
                    onChange={(e) => setInvStatusFilter(e.target.value)}
                    className="bg-black/20 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none appearance-none"
                  >
                    <option>All Statuses</option>
                    <option>Active</option>
                    <option>Closed</option>
                    <option>Pending</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => { setInvSearch(''); setInvTypeFilter('All Types'); setInvStatusFilter('All Statuses'); notifyAdmin('Reset offering filters.'); }}
                    title="Reset Filters"
                    className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Filter className="w-4 h-4"/>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-black/20 text-xs uppercase tracking-wider text-zinc-500">
                      <th className="px-3 py-1.5 font-medium">Asset Name</th>
                      <th className="px-3 py-1.5 font-medium">Type</th>
                      <th className="px-3 py-1.5 font-medium">Total Raised</th>
                      <th className="px-3 py-1.5 font-medium">Target</th>
                      <th className="px-3 py-1.5 font-medium">Status</th>
                      <th className="px-3 py-1.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="">
                    {filteredInvestments.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-3 py-1.5">
                          <div className="text-sm font-medium text-white">{item.name}</div>
                          <div className="text-xs text-zinc-500">{item.id}</div>
                        </td>
                        <td className="px-3 py-1.5 text-xs text-zinc-300">{item.type}</td>
                        <td className="px-3 py-1.5 text-xs font-medium text-white">{item.raised}</td>
                        <td className="px-3 py-1.5 text-xs font-medium text-white">{item.target}</td>
                        <td className="px-3 py-1.5">
                          <span className={cn(
                            "px-2.5 py-1 text-xs font-medium rounded-full bg-white/[0.03]",
                            item.status ==='Active'?"bg-emerald-500/10 text-emerald-400":
                            item.status ==='Pending'?"bg-amber-500/10 text-amber-400":
                            "bg-zinc-500/10 text-zinc-400"
                          )}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.status ==='Pending'&& (
                              <button
                                type="button"
                                onClick={() => {
                                  setInvestmentsList(prev => prev.map(inv => inv.id === item.id ? { ...inv, status:'Active'} : inv));
                                  notifyAdmin(`Approved offering ${item.name} for trading.`);
                                }}
                                className="p-1.5 rounded-md text-emerald-400 hover:bg-emerald-400/10 transition-colors cursor-pointer"
                                title="Approve Offering"
                              >
                                <CheckCircle2 className="w-4 h-4"/>
                              </button>
                            )}
                            {item.status ==='Active'&& (
                              <button
                                type="button"
                                onClick={() => {
                                  setInvestmentsList(prev => prev.map(inv => inv.id === item.id ? { ...inv, status:'Closed'} : inv));
                                  notifyAdmin(`Paused secondary trading for ${item.name}.`);
                                }}
                                className="p-1.5 rounded-md text-amber-400 hover:bg-amber-400/10 transition-colors cursor-pointer"
                                title="Pause Trading"
                              >
                                <AlertTriangle className="w-4 h-4"/>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setInspectItem({ title:`Offering ${item.name}`, fields: item })}
                              className="p-1.5 rounded-md text-blue-400 hover:bg-blue-400/10 transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4"/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'nft':
        return (
          <div className="flex flex-col h-full space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-white">NFT & Crypto Management</h2>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => notifyAdmin('Rebalanced AMM RWA liquidity pools (+12% depth on USDC/AQX-RWA).')}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <TrendingUp className="w-4 h-4"/> Adjust Liquidity
                </button>
                <button type="button" onClick={() => setShowMintModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer">
                  <Plus className="w-4 h-4"/> Mint NFT
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-[#121826] rounded-lg p-3">
                <div className="text-sm text-zinc-400 font-medium mb-1">Total Tokenized Assets</div>
                <div className="text-2xl font-semibold text-white">{nftList.length}</div>
              </div>
              <div className="bg-[#121826] rounded-lg p-3">
                <div className="text-sm text-zinc-400 font-medium mb-1">Total Crypto Liquidity</div>
                <div className="text-2xl font-semibold text-white">$45,200,000.00</div>
              </div>
              <div className="bg-[#121826] rounded-lg p-3">
                <div className="text-sm text-zinc-400 font-medium mb-1">24h NFT Volume</div>
                <div className="text-2xl font-semibold text-emerald-400">+$124,500.00</div>
              </div>
            </div>

            <div className="bg-[#121826] rounded-lg overflow-hidden flex flex-col flex-1">
              <div className="p-4 flex items-center justify-between gap-4 bg-white/[0.03]">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
                  <input 
                    type="text" 
                    value={nftSearch}
                    onChange={(e) => setNftSearch(e.target.value)}
                    placeholder="Search assets..." 
                    className="w-full bg-black/20 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={nftTypeFilter}
                    onChange={(e) => setNftTypeFilter(e.target.value)}
                    className="bg-black/20 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none appearance-none"
                  >
                    <option>All Types</option>
                    <option>Real Estate</option>
                    <option>Energy</option>
                    <option>Equity</option>
                    <option>Commodity</option>
                  </select>
                  <select
                    value={nftStatusFilter}
                    onChange={(e) => setNftStatusFilter(e.target.value)}
                    className="bg-black/20 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none appearance-none"
                  >
                    <option>All Statuses</option>
                    <option>Listed</option>
                    <option>Held</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => { setNftSearch(''); setNftTypeFilter('All Types'); setNftStatusFilter('All Statuses'); notifyAdmin('Reset NFT filters.'); }}
                    title="Reset Filters"
                    className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Filter className="w-4 h-4"/>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-black/20 text-xs uppercase tracking-wider text-zinc-500">
                      <th className="px-3 py-1.5 font-medium">Asset Name</th>
                      <th className="px-3 py-1.5 font-medium">Collection</th>
                      <th className="px-3 py-1.5 font-medium">Owner</th>
                      <th className="px-3 py-1.5 font-medium">Value</th>
                      <th className="px-3 py-1.5 font-medium">Status</th>
                      <th className="px-3 py-1.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="">
                    {filteredNfts.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-3 py-1.5">
                          <div className="text-sm font-medium text-white">{item.name}</div>
                          <div className="text-xs text-zinc-500">{item.id}</div>
                        </td>
                        <td className="px-3 py-1.5 text-xs text-zinc-300">{item.collection}</td>
                        <td className="px-3 py-1.5 text-xs text-zinc-300">{item.owner}</td>
                        <td className="px-3 py-1.5 text-xs font-medium text-white">{item.value}</td>
                        <td className="px-3 py-1.5">
                          <span className={cn(
                            "px-2.5 py-1 text-xs font-medium rounded-full bg-white/[0.03]",
                            item.status ==='Listed'?"bg-emerald-500/10 text-emerald-400":
                            "bg-zinc-500/10 text-zinc-400"
                          )}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => setInspectItem({ title: `Tokenized Asset ${item.name}`, fields: item })}
                              className="p-1.5 rounded-md text-blue-400 hover:bg-blue-400/10 transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4"/>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const nextStatus = item.status ==='Listed'?'Held' : 'Listed';
                                setNftList(prev => prev.map(n => n.id === item.id ? { ...n, status: nextStatus } : n));
                                notifyAdmin(`Updated ${item.name} status to ${nextStatus}.`);
                              }}
                              className="p-1.5 rounded-md text-amber-400 hover:bg-amber-400/10 transition-colors cursor-pointer"
                              title="Toggle Listing Status"
                            >
                              <Settings className="w-4 h-4"/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'content':
        return (
          <div className="flex flex-col h-full space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-white">Content & Notifications</h2>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => notifyAdmin('Dispatched global push notification to 124,592 verified users.')}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Bell className="w-4 h-4"/> Send Push
                </button>
                <button type="button" onClick={() => setShowCreatePostModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer">
                  <Plus className="w-4 h-4"/> Create Post
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-[#121826] rounded-lg p-3">
                <div className="text-sm text-zinc-400 font-medium mb-1">Total Published Content</div>
                <div className="text-2xl font-semibold text-white">{contentList.filter(c => c.status ==='Published').length}</div>
              </div>
              <div className="bg-[#121826] rounded-lg p-3">
                <div className="text-sm text-zinc-400 font-medium mb-1">Active Announcements</div>
                <div className="text-2xl font-semibold text-white">{contentList.filter(c => c.type ==='Announcement').length}</div>
              </div>
              <div className="bg-[#121826] rounded-lg p-3">
                <div className="text-sm text-zinc-400 font-medium mb-1">Push Notifications Sent (30d)</div>
                <div className="text-2xl font-semibold text-white">14</div>
              </div>
            </div>

            <div className="bg-[#121826] rounded-lg overflow-hidden flex flex-col flex-1">
              <div className="p-4 flex items-center justify-between gap-4 bg-white/[0.03]">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
                  <input 
                    type="text" 
                    value={contentSearch}
                    onChange={(e) => setContentSearch(e.target.value)}
                    placeholder="Search content..." 
                    className="w-full bg-black/20 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={contentTypeFilter}
                    onChange={(e) => setContentTypeFilter(e.target.value)}
                    className="bg-black/20 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none appearance-none"
                  >
                    <option>All Types</option>
                    <option>Announcement</option>
                    <option>Notification</option>
                    <option>Alert</option>
                    <option>Article</option>
                  </select>
                  <select
                    value={contentStatusFilter}
                    onChange={(e) => setContentStatusFilter(e.target.value)}
                    className="bg-black/20 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none appearance-none"
                  >
                    <option>All Statuses</option>
                    <option>Published</option>
                    <option>Draft</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => { setContentSearch(''); setContentTypeFilter('All Types'); setContentStatusFilter('All Statuses'); notifyAdmin('Reset content filters.'); }}
                    title="Reset Filters"
                    className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Filter className="w-4 h-4"/>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-black/20 text-xs uppercase tracking-wider text-zinc-500">
                      <th className="px-3 py-1.5 font-medium">Title</th>
                      <th className="px-3 py-1.5 font-medium">Type</th>
                      <th className="px-3 py-1.5 font-medium">Author</th>
                      <th className="px-3 py-1.5 font-medium">Publish Date</th>
                      <th className="px-3 py-1.5 font-medium">Status</th>
                      <th className="px-3 py-1.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="">
                    {filteredContent.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-3 py-1.5">
                          <div className="text-sm font-medium text-white">{item.title}</div>
                          <div className="text-xs text-zinc-500">{item.id}</div>
                        </td>
                        <td className="px-3 py-1.5 text-xs text-zinc-300">{item.type}</td>
                        <td className="px-3 py-1.5 text-xs text-zinc-300">{item.author}</td>
                        <td className="px-3 py-1.5 text-xs text-zinc-400">{item.date}</td>
                        <td className="px-3 py-1.5">
                          <span className={cn(
                            "px-2.5 py-1 text-xs font-medium rounded-full bg-white/[0.03]",
                            item.status ==='Published'?"bg-emerald-500/10 text-emerald-400":
                            "bg-zinc-500/10 text-zinc-400"
                          )}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => {
                                const nextStatus = item.status ==='Published'?'Draft' : 'Published';
                                setContentList(prev => prev.map(c => c.id === item.id ? { ...c, status: nextStatus } : c));
                                notifyAdmin(`Set"${item.title}"status to ${nextStatus}.`);
                              }}
                              className="p-1.5 rounded-md text-blue-400 hover:bg-blue-400/10 transition-colors cursor-pointer"
                              title="Toggle Published / Draft"
                            >
                              <FileText className="w-4 h-4"/>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setContentList(prev => prev.filter(c => c.id !== item.id));
                                notifyAdmin(`Deleted content item "${item.title}".`);
                              }}
                              className="p-1.5 rounded-md text-rose-400 hover:bg-rose-400/10 transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Ban className="w-4 h-4"/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="flex flex-col h-full space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-white">Settings & Security</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Platform Configuration */}
              <div className="bg-[#121826] rounded-lg p-3.5 flex flex-col space-y-3">
                <h3 className="text-lg font-semibold text-white">Platform Configuration</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">Trading Engine</div>
                      <div className="text-xs text-zinc-500">Enable or disable all trading activities</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settingsState.tradingEngine}
                        onChange={(e) => setSettingsState(s => ({ ...s, tradingEngine: e.target.checked }))}
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">New User Registration</div>
                      <div className="text-xs text-zinc-500">Allow new users to sign up</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settingsState.newUserRegistration}
                        onChange={(e) => setSettingsState(s => ({ ...s, newUserRegistration: e.target.checked }))}
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">Maintenance Mode</div>
                      <div className="text-xs text-zinc-500">Display maintenance page to all users</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settingsState.maintenanceMode}
                        onChange={(e) => setSettingsState(s => ({ ...s, maintenanceMode: e.target.checked }))}
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <h4 className="text-sm font-medium text-white mb-4">Fee Structures</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-zinc-400">Standard Trading Fee</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={settingsState.tradingFee}
                          onChange={(e) => setSettingsState(s => ({ ...s, tradingFee: e.target.value }))}
                          className="w-20 bg-black/20 rounded-lg px-3 py-1.5 text-sm text-white text-right focus:outline-none"
                        />
                        <span className="text-sm text-zinc-500">%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-zinc-400">Fiat Withdrawal Fee</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-500">$</span>
                        <input
                          type="text"
                          value={settingsState.withdrawalFee}
                          onChange={(e) => setSettingsState(s => ({ ...s, withdrawalFee: e.target.value }))}
                          className="w-20 bg-black/20 rounded-lg px-3 py-1.5 text-sm text-white text-right focus:outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAuditLogsList(prev => [{ id:`LOG-${Date.now().toString().slice(-3)}`, action:'Platform Config Updated', admin:'superadmin@nxg.com', target:`Fee ${settingsState.tradingFee}% / $${settingsState.withdrawalFee}`, time:'Just now', ip:'192.168.1.1'}, ...prev]);
                        notifyAdmin('Saved platform configuration and fee structure.');
                      }}
                      className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors mt-2 cursor-pointer"
                    >
                      Save Configuration
                    </button>
                  </div>
                </div>
              </div>

              {/* Audit Logs */}
              <div className="bg-[#121826] rounded-lg overflow-hidden flex flex-col">
                <div className="p-3.5 flex justify-between items-center bg-white/[0.03]">
                  <h3 className="text-lg font-semibold text-white">Admin Audit Logs</h3>
                  <button
                    type="button"
                    onClick={() => downloadCsv('aqx_admin_audit_logs.csv', ['ID', 'Action', 'Admin', 'Target', 'Time', 'IP'], auditLogsList.map(l => [l.id, l.action, l.admin, l.target, l.time, l.ip]))}
                    title="Download Admin Audit Logs"
                    className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4"/>
                  </button>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-black/20 text-xs uppercase tracking-wider text-zinc-500">
                        <th className="px-3 py-1.5 font-medium">Admin</th>
                        <th className="px-3 py-1.5 font-medium">Action</th>
                        <th className="px-3 py-1.5 font-medium">Target</th>
                        <th className="px-3 py-1.5 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody className="">
                      {auditLogsList.map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-3 py-1.5 text-xs text-zinc-300">{log.admin}</td>
                          <td className="px-3 py-1.5 text-xs font-medium text-white">{log.action}</td>
                          <td className="px-3 py-1.5 text-xs text-zinc-400">{log.target}</td>
                          <td className="px-3 py-1.5 text-xs text-zinc-500">{log.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      case 'ai-insights':
        return (
          <div className="flex flex-col h-full space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-white">AI Insights & Alerts</h2>
              <button
                type="button"
                onClick={() => {
                  setAiInsightsList(prev => [
                    { id:`AI-${Date.now().toString().slice(-3)}`, type:'Insight', title:'PAPSS FX Corridor Spread Narrowing', description:'ZAR/NGN institutional corridor liquidity depth improved by 18% over the last 30 minutes.', impact:'Medium', time:'Just now'},
                    ...prev
                  ]);
                  notifyAdmin('Refreshed platform AI anomaly & liquidity telemetry.');
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4"/> Refresh Analysis
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-[#121826] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-rose-400"/>
                  <div className="text-sm text-zinc-400 font-medium">Critical Alerts</div>
                </div>
                <div className="text-2xl font-semibold text-white">{aiInsightsList.filter(i => i.impact ==='Critical').length}</div>
              </div>
              <div className="bg-[#121826] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-amber-400"/>
                  <div className="text-sm text-zinc-400 font-medium">Active Warnings</div>
                </div>
                <div className="text-2xl font-semibold text-white">{aiInsightsList.filter(i => i.type ==='Warning').length}</div>
              </div>
              <div className="bg-[#121826] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <BrainCircuit className="w-4 h-4 text-blue-400"/>
                  <div className="text-sm text-zinc-400 font-medium">New Insights</div>
                </div>
                <div className="text-2xl font-semibold text-white">{aiInsightsList.filter(i => i.type ==='Insight').length}</div>
              </div>
            </div>

            <div className="bg-[#121826] rounded-lg overflow-hidden flex flex-col flex-1">
              <div className="p-4 flex items-center justify-between gap-4 bg-white/[0.03]">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
                  <input 
                    type="text" 
                    value={aiSearch}
                    onChange={(e) => setAiSearch(e.target.value)}
                    placeholder="Search insights..." 
                    className="w-full bg-black/20 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={aiTypeFilter}
                    onChange={(e) => setAiTypeFilter(e.target.value)}
                    className="bg-black/20 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none appearance-none"
                  >
                    <option>All Types</option>
                    <option>Alert</option>
                    <option>Warning</option>
                    <option>Insight</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => { setAiSearch(''); setAiTypeFilter('All Types'); notifyAdmin('Reset AI insight filters.'); }}
                    title="Reset Filters"
                    className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Filter className="w-4 h-4"/>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-black/20 text-xs uppercase tracking-wider text-zinc-500">
                      <th className="px-3 py-1.5 font-medium">Type</th>
                      <th className="px-3 py-1.5 font-medium">Insight / Alert</th>
                      <th className="px-3 py-1.5 font-medium">Impact</th>
                      <th className="px-3 py-1.5 font-medium">Time</th>
                      <th className="px-3 py-1.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="">
                    {filteredAiInsights.map((insight) => (
                      <tr key={insight.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-3 py-1.5">
                          <span className={cn(
                            "px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 w-fit bg-white/[0.03]",
                            insight.type === 'Alert' ? "bg-rose-500/10 text-rose-400" :
                            insight.type === 'Warning' ? "bg-amber-500/10 text-amber-400" :
                            "bg-blue-500/10 text-blue-400"
                          )}>
                            {insight.type ==='Alert'&& <AlertTriangle className="w-3 h-3"/>}
                            {insight.type ==='Warning'&& <AlertCircle className="w-3 h-3"/>}
                            {insight.type ==='Insight'&& <BrainCircuit className="w-3 h-3"/>}
                            {insight.type}
                          </span>
                        </td>
                        <td className="px-3 py-1.5">
                          <div className="text-sm font-medium text-white mb-1">{insight.title}</div>
                          <div className="text-sm text-zinc-400 max-w-md">{insight.description}</div>
                        </td>
                        <td className="px-3 py-1.5">
                          <span className={cn(
                            "text-sm font-medium",
                            insight.impact === 'Critical' ? "text-rose-400" :
                            insight.impact === 'High' ? "text-amber-400" :
                            "text-zinc-300"
                          )}>
                            {insight.impact}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-xs text-zinc-500">{insight.time}</td>
                        <td className="px-3 py-1.5 text-right">
                          <button
                            type="button"
                            onClick={() => setInspectItem({ title: insight.title, fields: insight })}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full text-zinc-500">
            Module under construction
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#0B0F14] text-white overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Sidebar */}
      <aside className="w-[240px] bg-[#121826] flex flex-col shrink-0 z-20">
        <div className="h-16 flex items-center px-3.5 bg-white/[0.03]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg mr-3">
            N
          </div>
          <span className="font-semibold text-lg tracking-tight">NXG Admin</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative group text-sm",
                  isActive 
                    ? "text-white bg-white/5" 
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="admin-active-nav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full"
                    transition={{ type:"spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className={cn("w-4 h-4 transition-colors", isActive ?"text-blue-400" : "group-hover:text-zinc-300")} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 bg-white/[0.03]">
          <div className="flex items-center justify-between px-2 py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-xs font-bold text-blue-400">SA</span>
              </div>
              <div>
                <p className="text-xs font-medium text-white">Super Admin</p>
                <p className="text-[10px] text-emerald-400">Prod Env v2.4</p>
              </div>
            </div>
            <button onClick={onExit} className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-md transition-colors" title="Exit Admin">
              <LogOut className="w-4 h-4"/>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-[#121826]/80 backdrop-blur-xl flex items-center justify-between px-4 shrink-0 z-10 relative">
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-black/40 rounded-xl px-3 py-2 w-64 transition-colors">
              <Search className="w-4 h-4 text-zinc-500"/>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users, TXs (⌘K)" 
                className="bg-transparent outline-none text-sm ml-2 w-full text-zinc-200 placeholder:text-zinc-600"
              />
            </div>
            <div className="hidden md:flex gap-2">
              <button
                type="button"
                onClick={() => { setActiveTab('compliance'); setCompStatusFilter('Pending'); }}
                className="px-2.5 py-1 rounded-md bg-white/5 text-xs text-zinc-400 font-medium cursor-pointer hover:bg-white/10 transition-colors"
              >
                Pending KYC ({complianceList.filter(c => c.status ==='Pending').length})
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('wallets'); setTxStatusFilter('Flagged'); }}
                className="px-2.5 py-1 rounded-md bg-rose-500/10 text-xs text-rose-400 font-medium cursor-pointer hover:bg-rose-500/20 transition-colors"
              >
                High Risk ({txList.filter(t => t.risk === 'High').length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            <button
              type="button"
              onClick={() => setActiveTab('ai-insights')}
              className="p-2 rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors flex items-center gap-2 text-sm font-medium cursor-pointer"
            >
              <Sparkles className="w-4 h-4"/>
              <span className="hidden sm:inline">Ask AI</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAlertsPopover(prev => !prev)}
              aria-label="Admin Alerts"
              className="relative p-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4"/>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>

            {showAlertsPopover && (
              <div className="absolute right-0 top-12 w-80 bg-[#121826] rounded-lg shadow-2xl p-4 space-y-2 z-30">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">System Alerts</span>
                  <button type="button" onClick={() => setShowAlertsPopover(false)} className="text-xs text-zinc-400 hover:text-white">Close</button>
                </div>
                {aiInsightsList.slice(0, 3).map(a => (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => { setShowAlertsPopover(false); setActiveTab('ai-insights'); }}
                    className="w-full text-left p-2.5 rounded-xl bg-black/30 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-white">{a.title}</div>
                    <div className="text-[11px] text-zinc-400 truncate">{a.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 bg-[#0B0F14]">
          <div className="max-w-[1600px] mx-auto">
            {adminNotice && (
              <div role="status" className="mb-4 p-3 rounded-xl bg-emerald-500/10 text-emerald-300 text-xs font-mono flex items-center justify-between">
                <span>{adminNotice}</span>
                <button type="button" onClick={() => setAdminNotice(null)} className="text-zinc-400 hover:text-white">Dismiss</button>
              </div>
            )}
            <div className="mb-3">
              <h1 className="text-2xl font-bold text-white tracking-tight capitalize">{activeTab.replace('-','')}</h1>
              <p className="text-sm text-zinc-400 mt-1">Manage and monitor platform activity</p>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#121826] rounded-lg p-3.5 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Provision New Platform User</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Full Name"
                value={newUserForm.name}
                onChange={(e) => setNewUserForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-black/40 rounded-xl px-3 py-2 text-sm text-white"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm(f => ({ ...f, email: e.target.value }))}
                className="w-full bg-black/40 rounded-xl px-3 py-2 text-sm text-white"
              />
              <select
                value={newUserForm.role}
                onChange={(e) => setNewUserForm(f => ({ ...f, role: e.target.value }))}
                className="w-full bg-black/40 rounded-xl px-3 py-2 text-sm text-white"
              >
                <option>Investor</option>
                <option>Trader</option>
                <option>Institution</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddUserModal(false)} className="px-4 py-2 rounded-lg bg-white/5 text-xs text-zinc-300">Cancel</button>
              <button
                type="button"
                onClick={() => {
                  const name = newUserForm.name.trim() || 'New Institutional User';
                  const email = newUserForm.email.trim() || 'institution@afriquantx.com';
                  setUsersList(prev => [{ id: String(Date.now()).slice(-4), name, email, kyc:'Pending', balance:'$0.00', risk:'Low', lastActive:'Just now', role: newUserForm.role }, ...prev]);
                  setNewUserForm({ name: '', email: '', role: 'Investor' });
                  setShowAddUserModal(false);
                  notifyAdmin(`Added user ${name} (${newUserForm.role}).`);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-xs font-bold text-white cursor-pointer"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Offering Modal */}
      {showNewOfferingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#121826] rounded-lg p-3.5 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Launch Primary Offering</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Offering Name (e.g. East Africa Grid Bond)"
                value={newOfferingForm.name}
                onChange={(e) => setNewOfferingForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-black/40 rounded-xl px-3 py-2 text-sm text-white"
              />
              <select
                value={newOfferingForm.type}
                onChange={(e) => setNewOfferingForm(f => ({ ...f, type: e.target.value }))}
                className="w-full bg-black/40 rounded-xl px-3 py-2 text-sm text-white"
              >
                <option>Equity</option>
                <option>Debt</option>
                <option>Real Estate</option>
              </select>
              <input
                type="text"
                placeholder="Target Raise (e.g. $5M)"
                value={newOfferingForm.target}
                onChange={(e) => setNewOfferingForm(f => ({ ...f, target: e.target.value }))}
                className="w-full bg-black/40 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowNewOfferingModal(false)} className="px-4 py-2 rounded-lg bg-white/5 text-xs text-zinc-300">Cancel</button>
              <button
                type="button"
                onClick={() => {
                  const name = newOfferingForm.name.trim() ||'East Africa Grid Bond';
                  setInvestmentsList(prev => [{ id:`INV-${Date.now().toString().slice(-3)}`, name, type: newOfferingForm.type, raised:'$0', target: newOfferingForm.target ||'$1M', investors: 0, status:'Pending'}, ...prev]);
                  setNewOfferingForm({ name:'', type:'Equity', target:'$1M'});
                  setShowNewOfferingModal(false);
                  notifyAdmin(`Created pending offering"${name}".`);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-xs font-bold text-white cursor-pointer"
              >
                Submit Offering
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mint NFT Modal */}
      {showMintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#121826] rounded-lg p-3.5 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Mint Tokenized RWA NFT</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Tokenized Asset Name"
                value={newNftForm.name}
                onChange={(e) => setNewNftForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-black/40 rounded-xl px-3 py-2 text-sm text-white"
              />
              <select
                value={newNftForm.collection}
                onChange={(e) => setNewNftForm(f => ({ ...f, collection: e.target.value }))}
                className="w-full bg-black/40 rounded-xl px-3 py-2 text-sm text-white"
              >
                <option>Real Estate</option>
                <option>Energy</option>
                <option>Equity</option>
                <option>Commodity</option>
              </select>
              <input
                type="text"
                placeholder="Valuation (e.g. $25,000)"
                value={newNftForm.value}
                onChange={(e) => setNewNftForm(f => ({ ...f, value: e.target.value }))}
                className="w-full bg-black/40 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowMintModal(false)} className="px-4 py-2 rounded-lg bg-white/5 text-xs text-zinc-300">Cancel</button>
              <button
                type="button"
                onClick={() => {
                  const name = newNftForm.name.trim() || 'AfriQuantX RWA Tranche #88';
                  setNftList(prev => [{ id:`NFT-${Date.now().toString().slice(-3)}`, name, collection: newNftForm.collection, owner:'Treasury Custody', value: newNftForm.value ||'$5,000', status:'Listed'}, ...prev]);
                  setNewNftForm({ name: '', collection: 'Real Estate', value: '$5,000' });
                  setShowMintModal(false);
                  notifyAdmin(`Minted RWA NFT "${name}" into custody.`);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-xs font-bold text-white cursor-pointer"
              >
                Mint Asset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreatePostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#121826] rounded-lg p-3.5 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Create Platform Post</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Headline / Notification Title"
                value={newPostForm.title}
                onChange={(e) => setNewPostForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-black/40 rounded-xl px-3 py-2 text-sm text-white"
              />
              <select
                value={newPostForm.type}
                onChange={(e) => setNewPostForm(f => ({ ...f, type: e.target.value }))}
                className="w-full bg-black/40 rounded-xl px-3 py-2 text-sm text-white"
              >
                <option>Announcement</option>
                <option>Notification</option>
                <option>Alert</option>
                <option>Article</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowCreatePostModal(false)} className="px-4 py-2 rounded-lg bg-white/5 text-xs text-zinc-300">Cancel</button>
              <button
                type="button"
                onClick={() => {
                  const title = newPostForm.title.trim() || 'PAPSS Settlement Upgrade Notice';
                  setContentList(prev => [{ id:`POST-${Date.now().toString().slice(-3)}`, title, type: newPostForm.type, author:'Super Admin', date: new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric'}), status:'Published'}, ...prev]);
                  setNewPostForm({ title: '', type: 'Announcement' });
                  setShowCreatePostModal(false);
                  notifyAdmin(`Published "${title}".`);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-xs font-bold text-white cursor-pointer"
              >
                Publish Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Details Inspector Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#121826] rounded-lg p-3.5 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{inspectItem.title}</h3>
              <button type="button" onClick={() => setInspectItem(null)} className="text-xs text-zinc-400 hover:text-white">Close</button>
            </div>
            <div className="space-y-2 bg-black/30 rounded-xl p-4 font-mono text-xs">
              {Object.entries(inspectItem.fields).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 pb-1.5 last:pb-0">
                  <span className="text-zinc-500 uppercase">{k}</span>
                  <span className="text-zinc-200 text-right break-all">{String(v)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => setInspectItem(null)} className="px-4 py-2 rounded-lg bg-white/10 text-xs font-bold text-white cursor-pointer">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
