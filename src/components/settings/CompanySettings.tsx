import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from"@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Building2, Shield, CreditCard, Bell, Lock, AlertCircle, CheckCircle2, TrendingUp, FileText, Users, User, Key } from 'lucide-react';
import { WhopIntegrationCard } from '../WhopIntegrationCard';

export function CompanySettings({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const [profileData, setProfileData] = useState(() => {
    const saved = localStorage.getItem('companyProfile');
    return saved ? JSON.parse(saved) : {
      companyName: 'AfriQuant X Ltd.',
      regNumber: '12345678',
      jurisdiction: 'Delaware, USA',
      status:'Active (Series A)',
      description: 'AfriQuant X is building the next generation of neural interfaces for cognitive enhancement.',
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [execTeam, setExecTeam] = useState([{ id:'exec-1', name:'Jane Founder', role:'CEO & Co-founder', badge:'Verified'}]);
  const [showAddExec, setShowAddExec] = useState(false);
  const [execForm, setExecForm] = useState({ name: '', role: '' });
  const [regUpdated, setRegUpdated] = useState(false);
  const [financialsUploaded, setFinancialsUploaded] = useState(false);
  const [uboStarted, setUboStarted] = useState(false);
  const [escrowAccounts, setEscrowAccounts] = useState([{ id:'escrow-1', name:'Series A Escrow Wallet', subtitle:'Receiving funds', status:'Active'}]);
  const [showNewEscrow, setShowNewEscrow] = useState(false);
  const [escrowNameInput, setEscrowNameInput] = useState('');
  const [teamAccessList, setTeamAccessList] = useState([
    { id: 'tm-1', name: 'Jane Founder (You)', email: 'jane@neurogrowth.ai', role: 'Owner' },
    { id: 'tm-2', name: 'John Finance', email: 'john@neurogrowth.ai', role: 'Finance Admin' }
  ]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'Treasury Analyst' });

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem('companyProfile', JSON.stringify(profileData));
    setStatusNotice('Corporate profile details saved.');
    setTimeout(() => setIsSaving(false), 500);
  };

  return (
    <div className="space-y-3">
      {/* AI Insights & Health Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Card className="bg-purple-500/10 lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4"/> AI Insight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-300">Your profile completeness is 78% — improve visibility by adding audited financials. <button onClick={() => setActiveTab('company-profile')} className="text-purple-400 hover:underline">Upload now</button></p>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-white">78%</span>
              <Badge variant="outline" className="text-amber-400 bg-amber-400/10">Action Needed</Badge>
            </div>
            <Progress value={78} className="h-2 bg-amber-500/20 [&>div]:bg-amber-500"/>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-amber-400"/>
              <div>
                <p className="text-white font-medium">Pending Review</p>
                <p className="text-xs text-zinc-500">UBO verification required</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Security</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-white">60%</span>
              <Badge variant="outline" className="text-amber-400 bg-amber-400/10">Enable 2FA</Badge>
            </div>
            <Progress value={60} className="h-2 bg-amber-500/20 [&>div]:bg-amber-500"/>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Financial Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-400"/>
              <div>
                <p className="text-white font-medium">Active</p>
                <p className="text-xs text-zinc-500">Escrow linked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 bg-zinc-900/50 p-1 rounded-xl h-auto">
          <TabsTrigger value="profile" className="data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg py-2.5"><Building2 className="w-4 h-4 mr-2 hidden sm:block"/> Profile</TabsTrigger>
          <TabsTrigger value="compliance" className="data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg py-2.5"><Shield className="w-4 h-4 mr-2 hidden sm:block"/> Compliance</TabsTrigger>
          <TabsTrigger value="financial" className="data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg py-2.5"><CreditCard className="w-4 h-4 mr-2 hidden sm:block"/> Financial</TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg py-2.5"><Key className="w-4 h-4 mr-2 hidden sm:block text-orange-400"/> Integrations</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg py-2.5"><Bell className="w-4 h-4 mr-2 hidden sm:block"/> Alerts</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg py-2.5"><Lock className="w-4 h-4 mr-2 hidden sm:block"/> Security</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6 space-y-3">
          <Card className="bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-white">Company Information</CardTitle>
              <CardDescription>Manage your business details and public profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-zinc-400">Registered Name</Label>
                  <Input id="companyName" value={profileData.companyName} onChange={e => setProfileData({...profileData, companyName: e.target.value})} className="bg-black/40 text-white"/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regNumber" className="text-zinc-400">Registration Number</Label>
                  <Input id="regNumber" value={profileData.regNumber} onChange={e => setProfileData({...profileData, regNumber: e.target.value})} className="bg-black/40 text-white"/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jurisdiction" className="text-zinc-400">Jurisdiction</Label>
                  <Input id="jurisdiction" value={profileData.jurisdiction} onChange={e => setProfileData({...profileData, jurisdiction: e.target.value})} className="bg-black/40 text-white"/>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Company Position</Label>
                  <select
                    value={profileData.status}
                    onChange={e => {
                      const val = e.target.value;
                      setProfileData({...profileData, status: val});
                      if (val === 'STARTUP' || val === 'HEDGE_FUND') {
                        localStorage.setItem('companyPosition', val);
                        window.dispatchEvent(new Event('nxg_auth_state_changed'));
                      }
                    }}
                    className="w-full h-9 rounded-md bg-black/40 px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="STARTUP">Startup</option>
                    <option value="HEDGE_FUND">Hedge Fund</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label className="text-zinc-400">Company Description</Label>
                <textarea 
                  className="w-full min-h-[100px] rounded-md bg-black/40 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={profileData.description}
                  onChange={e => setProfileData({...profileData, description: e.target.value})}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={isSaving} className="bg-white text-black hover:bg-zinc-200">
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-white">Executive Team</CardTitle>
              <CardDescription>Manage key personnel and ownership structure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {execTeam.map((member) => (
                <div key={member.id} className="p-4 rounded-xl bg-black/40 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-zinc-400"/>
                    </div>
                    <div>
                      <p className="text-white font-medium">{member.name}</p>
                      <p className="text-xs text-zinc-500">{member.role}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-emerald-400 bg-emerald-400/10">{member.badge}</Badge>
                </div>
              ))}
              {showAddExec ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!execForm.name.trim()) return;
                    setExecTeam((prev) => [...prev, { id:`exec-${Date.now()}`, name: execForm.name.trim(), role: execForm.role.trim() ||'Managing Director', badge:'Pending KYC'}]);
                    setExecForm({ name: '', role: '' });
                    setShowAddExec(false);
                    setStatusNotice('Executive team member added.');
                  }}
                  className="p-4 rounded-xl bg-black/50 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input placeholder="Full name" value={execForm.name} onChange={(e) => setExecForm({ ...execForm, name: e.target.value })} className="bg-black/40 text-white" required />
                    <Input placeholder="Title (e.g. CFO)" value={execForm.role} onChange={(e) => setExecForm({ ...execForm, role: e.target.value })} className="bg-black/40 text-white" required />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowAddExec(false)} className="text-zinc-300">Cancel</Button>
                    <Button type="submit" className="bg-white text-black hover:bg-zinc-200">Save Officer</Button>
                  </div>
                </form>
              ) : (
                <Button
                  type="button"
                  onClick={() => setShowAddExec(true)}
                  variant="outline"
                  className="w-full text-zinc-400 hover:text-white hover:bg-white/5"
                >
                  + Add Team Member
                </Button>
              )}
              {statusNotice && <p role="status" className="text-xs text-emerald-400 font-medium">{statusNotice}</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="mt-6 space-y-3">
          <Card className="bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-white">Due Diligence & Documents</CardTitle>
              <CardDescription>Upload and manage your corporate compliance documents.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single"collapsible className="w-full">
                <AccordionItem value="item-1" className="">
                  <AccordionTrigger className="text-white hover:no-underline hover:text-purple-400">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400"/>
                      <span>Business Registration</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-zinc-400">
                    <div className="space-y-4 pt-2">
                      <div className="bg-purple-500/10 rounded-lg p-3 text-sm text-purple-400">
                        <strong>Why this is required:</strong> We must verify the legal existence and standing of your company before allowing you to raise capital on the platform.
                      </div>
                      <p className="text-sm">Certificate of Incorporation verified.</p>
                      <div className="flex items-center gap-4 p-3 rounded-lg bg-black/40">
                        <FileText className="w-8 h-8 text-zinc-500"/>
                        <div className="flex-1">
                          <p className="text-sm text-white font-medium">cert_incorp.pdf</p>
                          <p className="text-xs text-zinc-500">1.2 MB</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRegUpdated(true);
                            setStatusNotice('Business registration update opened in Compliance Center.');
                            setActiveTab('kyc-kyb');
                          }}
                          className="text-white hover:bg-white/10"
                        >
                          {regUpdated ? 'Submitted' : 'Update'}
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="">
                  <AccordionTrigger className="text-white hover:no-underline hover:text-purple-400">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-400"/>
                      <span>Financial Statements</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-zinc-400">
                    <div className="space-y-4 pt-2">
                      <div className="bg-purple-500/10 rounded-lg p-3 text-sm text-purple-400">
                        <strong>Why this is required:</strong> Investors require transparency into your financial health. Audited statements significantly improve your profile's trust score.
                      </div>
                      <div className={financialsUploaded ?"p-3 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm" : "p-3 rounded-lg bg-amber-500/10 text-amber-400 text-sm"}>
                        {financialsUploaded ? 'Audited financial statements queued for compliance review.' : "Action Required: Please upload your latest audited financials to improve your profile score."}
                      </div>
                      <Button
                        type="button"
                        onClick={() => {
                          setFinancialsUploaded(true);
                          setActiveTab('kyc-kyb');
                        }}
                        className={financialsUploaded ?"bg-emerald-500 text-black hover:bg-emerald-600" : "bg-amber-500 text-black hover:bg-amber-600"}
                      >
                        {financialsUploaded ? 'Documents Queued' : 'Upload Documents'}
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="">
                  <AccordionTrigger className="text-white hover:no-underline hover:text-purple-400">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-400"/>
                      <span>Director & UBO Verification</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-zinc-400">
                    <div className="space-y-4 pt-2">
                      <div className="bg-purple-500/10 rounded-lg p-3 text-sm text-purple-400">
                        <strong>Why this is required:</strong> Anti-Money Laundering (AML) regulations mandate that we identify and verify the Ultimate Beneficial Owners (UBOs) holding 25% or more of the company.
                      </div>
                      <p className="text-sm">{uboStarted ?'UBO verification workflow active in KYC/KYB Center.' : 'Ultimate Beneficial Owners (UBO) must complete KYC.'}</p>
                      <Button
                        type="button"
                        onClick={() => {
                          setUboStarted(true);
                          setActiveTab('kyc-kyb');
                        }}
                        className={uboStarted ?"bg-emerald-500 text-black hover:bg-emerald-600" : "bg-amber-500 text-black hover:bg-amber-600"}
                      >
                        {uboStarted ? 'Verification In Progress' : 'Start Verification'}
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="mt-6 space-y-3">
          <Card className="bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-white">Corporate Banking & Escrow</CardTitle>
              <CardDescription>Manage your fundraising accounts and disbursement controls.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-black/40 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-zinc-800 rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-white">BANK</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Silicon Valley Bank</p>
                    <p className="text-xs text-zinc-500">Corporate Checking **** 8899</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-emerald-400 bg-emerald-400/10">Verified</Badge>
              </div>
              {escrowAccounts.map((acc) => (
                <div key={acc.id} className="p-4 rounded-xl bg-black/40 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-purple-500/20 rounded flex items-center justify-center">
                      <span className="text-xs font-bold text-purple-400">ESCROW</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{acc.name}</p>
                      <p className="text-xs text-zinc-500">{acc.subtitle}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-blue-400 bg-blue-400/10">{acc.status}</Badge>
                </div>
              ))}
              {showNewEscrow ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!escrowNameInput.trim()) return;
                    setEscrowAccounts((prev) => [...prev, { id:`escrow-${Date.now()}`, name: escrowNameInput.trim(), subtitle:'Multi-sig custody vault', status:'Provisioned'}]);
                    setEscrowNameInput('');
                    setShowNewEscrow(false);
                    setStatusNotice('New institutional escrow account provisioned.');
                  }}
                  className="p-4 rounded-xl bg-black/50 flex flex-col sm:flex-row gap-3"
                >
                  <Input
                    placeholder="Escrow account label (e.g. Series B Treasury Vault)"
                    value={escrowNameInput}
                    onChange={(e) => setEscrowNameInput(e.target.value)}
                    className="bg-black/40 text-white flex-1"
                    required
                  />
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowNewEscrow(false)} className="text-zinc-300">Cancel</Button>
                    <Button type="submit" className="bg-white text-black hover:bg-zinc-200">Provision</Button>
                  </div>
                </form>
              ) : (
                <Button
                  type="button"
                  onClick={() => setShowNewEscrow(true)}
                  variant="outline"
                  className="w-full text-zinc-400 hover:text-white hover:bg-white/5"
                >
                  + Setup New Escrow Account
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6 space-y-3">
          <Card className="bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-white">Notification Preferences</CardTitle>
              <CardDescription>Choose what updates your team receives.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white text-base">Investor Interest & Engagement</Label>
                  <p className="text-sm text-zinc-500">Alerts when investors view your profile or request access.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white text-base">Funding Milestones</Label>
                  <p className="text-sm text-zinc-500">Updates on capital raised and escrow status.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white text-base">Compliance Deadlines</Label>
                  <p className="text-sm text-zinc-500">Reminders for required document submissions.</p>
                </div>
                <Switch defaultChecked disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="mt-6 space-y-3">
          <WhopIntegrationCard />
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6 space-y-3">
          <Card className="bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-white">Team Access & Roles</CardTitle>
              <CardDescription>Manage who has access to your company account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamAccessList.map((member) => (
                <div key={member.id} className="p-4 rounded-xl bg-black/40 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-zinc-400"/>
                    </div>
                    <div>
                      <p className="text-white font-medium">{member.name}</p>
                      <p className="text-xs text-zinc-500">{member.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-purple-400 bg-purple-400/10">{member.role}</Badge>
                </div>
              ))}
              {showInviteForm ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!inviteForm.email.trim()) return;
                    setTeamAccessList((prev) => [...prev, { id: `tm-${Date.now()}`, name: inviteForm.name.trim() || inviteForm.email.split('@')[0], email: inviteForm.email.trim(), role: inviteForm.role }]);
                    setInviteForm({ name: '', email: '', role: 'Treasury Analyst' });
                    setShowInviteForm(false);
                    setStatusNotice('Invitation dispatched to team member.');
                  }}
                  className="p-4 rounded-xl bg-black/50 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input placeholder="Full name" value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} className="bg-black/40 text-white" required />
                    <Input type="email" placeholder="Work email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} className="bg-black/40 text-white" required />
                    <Input placeholder="Role (e.g. Analyst)" value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })} className="bg-black/40 text-white" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowInviteForm(false)} className="text-zinc-300">Cancel</Button>
                    <Button type="submit" className="bg-white text-black hover:bg-zinc-200">Send Invite</Button>
                  </div>
                </form>
              ) : (
                <Button
                  type="button"
                  onClick={() => setShowInviteForm(true)}
                  variant="outline"
                  className="w-full text-zinc-400 hover:text-white hover:bg-white/5"
                >
                  + Invite Team Member
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
