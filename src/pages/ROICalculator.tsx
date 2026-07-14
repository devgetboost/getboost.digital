import { useState, useMemo } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, BarChart3, PieChart, Calculator, Download, Plus, Trash2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

type Campaign = {
  id: string;
  name: string;
  channel: 'google' | 'meta' | 'email' | 'linkedin' | 'outro';
  investment: number;
  revenue: number;
  leads: number;
  conversions: number;
};

const channelLabels: Record<string, string> = {
  google: 'Google Ads',
  meta: 'Meta Ads',
  email: 'Email Marketing',
  linkedin: 'LinkedIn Ads',
  outro: 'Outro',
};

const COLORS = ['#ff4000', '#ff6b35', '#ffa366', '#cc3300', '#ff8c42', '#e65100'];

const emptyRow = (): Campaign => ({
  id: crypto.randomUUID(),
  name: '',
  channel: 'google',
  investment: 0,
  revenue: 0,
  leads: 0,
  conversions: 0,
});

const ROICalculator = () => {
  const location = useLocation();
  const authorized = location.state?.authorized === true;

  const [campaigns, setCampaigns] = useState<Campaign[]>([emptyRow()]);
  const [growthRate, setGrowthRate] = useState(10);
  const [months, setMonths] = useState(12);

  const updateCampaign = (id: string, field: keyof Campaign, value: string | number) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const addCampaign = () => setCampaigns((prev) => [...prev, emptyRow()]);
  const removeCampaign = (id: string) => {
    if (campaigns.length <= 1) return;
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  };

  const stats = useMemo(() => {
    const totalInvestment = campaigns.reduce((s, c) => s + c.investment, 0);
    const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
    const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
    const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
    const roi = totalInvestment > 0 ? ((totalRevenue - totalInvestment) / totalInvestment) * 100 : 0;
    const cpl = totalLeads > 0 ? totalInvestment / totalLeads : 0;
    const cpa = totalConversions > 0 ? totalInvestment / totalConversions : 0;
    const convRate = totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0;
    return { totalInvestment, totalRevenue, totalLeads, totalConversions, roi, cpl, cpa, convRate };
  }, [campaigns]);

  const channelData = useMemo(() => {
    const grouped: Record<string, { investment: number; revenue: number; leads: number; conversions: number }> = {};
    campaigns.forEach((c) => {
      if (!grouped[c.channel]) grouped[c.channel] = { investment: 0, revenue: 0, leads: 0, conversions: 0 };
      grouped[c.channel].investment += c.investment;
      grouped[c.channel].revenue += c.revenue;
      grouped[c.channel].leads += c.leads;
      grouped[c.channel].conversions += c.conversions;
    });
    return Object.entries(grouped).map(([channel, data]) => ({
      name: channelLabels[channel] || channel,
      ...data,
      roi: data.investment > 0 ? ((data.revenue - data.investment) / data.investment * 100) : 0,
    }));
  }, [campaigns]);

  const projectionData = useMemo(() => {
    const data = [];
    let cumRevenue = stats.totalRevenue;
    let cumInvestment = stats.totalInvestment;
    for (let i = 0; i <= months; i++) {
      const monthRevenue = i === 0 ? cumRevenue : cumRevenue * (1 + growthRate / 100);
      const monthInvestment = i === 0 ? cumInvestment : cumInvestment * 1.02;
      cumRevenue = monthRevenue;
      cumInvestment = monthInvestment;
      data.push({
        month: i === 0 ? 'Atual' : `M${i}`,
        receita: Math.round(cumRevenue),
        investimento: Math.round(cumInvestment),
        lucro: Math.round(cumRevenue - cumInvestment),
      });
    }
    return data;
  }, [stats, growthRate, months]);

  const pieData = useMemo(() => {
    return channelData.map((d) => ({ name: d.name, value: d.investment })).filter((d) => d.value > 0);
  }, [channelData]);

  const campaignComparison = useMemo(() => {
    return campaigns
      .filter((c) => c.name && c.investment > 0)
      .map((c) => ({
        name: c.name || channelLabels[c.channel],
        roi: c.investment > 0 ? ((c.revenue - c.investment) / c.investment * 100) : 0,
        cpl: c.leads > 0 ? c.investment / c.leads : 0,
        cpa: c.conversions > 0 ? c.investment / c.conversions : 0,
      }));
  }, [campaigns]);

  if (!authorized) return <Navigate to="/resources/3" replace />;

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(26,10,0,0.92) 0%, rgba(255,64,0,0.80) 50%, rgba(26,10,0,0.90) 100%)' }} />
        <div className="relative max-w-7xl mx-auto px-6 md:px-12 pt-28 md:pt-36 pb-16 md:pb-20">
          <Link to="/resources" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm mb-6">
            <ArrowLeft className="w-4 h-4" /> Voltar aos Recursos
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
              <Calculator className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">Calculadora de ROI de Marketing</h1>
              <p className="text-white/60 text-sm mt-1">Calcula, compara e projeta o retorno das tuas campanhas</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" className="w-full"><path d="M0 40V20C360 5 720 0 1080 10C1260 15 1440 25 1440 20V40H0Z" fill="hsl(var(--background))" /></svg>
        </div>
      </section>

      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
          {/* Campaign Input */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Insere as tuas campanhas</h2>
              <Button onClick={addCampaign} variant="outline" size="sm" className="rounded-full">
                <Plus className="w-4 h-4 mr-1" /> Adicionar Campanha
              </Button>
            </div>

            <div className="space-y-4">
              {campaigns.map((campaign, idx) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl border border-border p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-muted-foreground">Campanha {idx + 1}</span>
                    {campaigns.length > 1 && (
                      <button onClick={() => removeCampaign(campaign.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div>
                      <Label className="text-xs mb-1 block">Nome</Label>
                      <Input value={campaign.name} onChange={(e) => updateCampaign(campaign.id, 'name', e.target.value)} placeholder="Ex: Black Friday" className="h-10" maxLength={50} />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Canal</Label>
                      <Select value={campaign.channel} onValueChange={(v) => updateCampaign(campaign.id, 'channel', v)}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(channelLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Investimento (€)</Label>
                      <Input type="number" min={0} value={campaign.investment || ''} onChange={(e) => updateCampaign(campaign.id, 'investment', Number(e.target.value))} placeholder="0" className="h-10" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Receita (€)</Label>
                      <Input type="number" min={0} value={campaign.revenue || ''} onChange={(e) => updateCampaign(campaign.id, 'revenue', Number(e.target.value))} placeholder="0" className="h-10" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Leads</Label>
                      <Input type="number" min={0} value={campaign.leads || ''} onChange={(e) => updateCampaign(campaign.id, 'leads', Number(e.target.value))} placeholder="0" className="h-10" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Conversões</Label>
                      <Input type="number" min={0} value={campaign.conversions || ''} onChange={(e) => updateCampaign(campaign.id, 'conversions', Number(e.target.value))} placeholder="0" className="h-10" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: 'ROI Total', value: `${stats.roi.toFixed(1)}%`, icon: TrendingUp, color: stats.roi >= 0 ? 'text-green-600' : 'text-red-600' },
              { label: 'Receita Total', value: `${stats.totalRevenue.toLocaleString('pt-PT')}€`, icon: BarChart3, color: 'text-primary' },
              { label: 'Custo por Lead', value: `${stats.cpl.toFixed(2)}€`, icon: PieChart, color: 'text-foreground' },
              { label: 'Taxa Conversão', value: `${stats.convRate.toFixed(1)}%`, icon: TrendingUp, color: 'text-primary' },
            ].map((kpi) => (
              <Card key={kpi.label} className="bg-white">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <kpi.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                  </div>
                  <div className={`text-2xl md:text-3xl font-black ${kpi.color}`}>{kpi.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs: Charts */}
          <Tabs defaultValue="channels" className="mb-12">
            <TabsList className="mb-6">
              <TabsTrigger value="channels">Por Canal</TabsTrigger>
              <TabsTrigger value="comparison">Comparação</TabsTrigger>
              <TabsTrigger value="projections">Projeções</TabsTrigger>
              <TabsTrigger value="distribution">Distribuição</TabsTrigger>
            </TabsList>

            <TabsContent value="channels">
              <Card className="bg-white">
                <CardContent className="p-6">
                  <h3 className="font-bold mb-1">ROI por Canal</h3>
                  <p className="text-sm text-muted-foreground mb-6">Compara o retorno de cada canal de marketing</p>
                  {channelData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={channelData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip formatter={(v: number) => `${v.toLocaleString('pt-PT')}€`} />
                        <Legend />
                        <Bar dataKey="investment" fill="#ff6b35" name="Investimento" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="revenue" fill="#ff4000" name="Receita" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-center py-16">Insere dados nas campanhas acima para ver os gráficos.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comparison">
              <Card className="bg-white">
                <CardContent className="p-6">
                  <h3 className="font-bold mb-1">Comparação entre Campanhas</h3>
                  <p className="text-sm text-muted-foreground mb-6">ROI, custo por lead e custo por aquisição de cada campanha</p>
                  {campaignComparison.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 font-semibold">Campanha</th>
                            <th className="text-right py-3 font-semibold">ROI</th>
                            <th className="text-right py-3 font-semibold">CPL</th>
                            <th className="text-right py-3 font-semibold">CPA</th>
                          </tr>
                        </thead>
                        <tbody>
                          {campaignComparison.map((c, i) => (
                            <tr key={i} className="border-b border-border/50">
                              <td className="py-3 font-medium">{c.name}</td>
                              <td className={`py-3 text-right font-bold ${c.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>{c.roi.toFixed(1)}%</td>
                              <td className="py-3 text-right">{c.cpl.toFixed(2)}€</td>
                              <td className="py-3 text-right">{c.cpa.toFixed(2)}€</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-16">Nomeia as campanhas e insere dados para comparar.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projections">
              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-end gap-6 mb-6">
                    <div>
                      <h3 className="font-bold mb-1">Projeções de Crescimento</h3>
                      <p className="text-sm text-muted-foreground">Simula o crescimento das tuas campanhas ao longo do tempo</p>
                    </div>
                    <div className="flex gap-4 ml-auto">
                      <div>
                        <Label className="text-xs mb-1 block">Crescimento mensal (%)</Label>
                        <Input type="number" min={-50} max={100} value={growthRate} onChange={(e) => setGrowthRate(Number(e.target.value))} className="h-9 w-24" />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Meses</Label>
                        <Input type="number" min={1} max={36} value={months} onChange={(e) => setMonths(Math.min(36, Math.max(1, Number(e.target.value))))} className="h-9 w-20" />
                      </div>
                    </div>
                  </div>
                  {stats.totalRevenue > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={projectionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip formatter={(v: number) => `${v.toLocaleString('pt-PT')}€`} />
                        <Legend />
                        <Line type="monotone" dataKey="receita" stroke="#ff4000" strokeWidth={2} name="Receita" dot={false} />
                        <Line type="monotone" dataKey="investimento" stroke="#ff6b35" strokeWidth={2} name="Investimento" strokeDasharray="5 5" dot={false} />
                        <Line type="monotone" dataKey="lucro" stroke="#22c55e" strokeWidth={2} name="Lucro" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-center py-16">Insere dados de receita para ver as projeções.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="distribution">
              <Card className="bg-white">
                <CardContent className="p-6">
                  <h3 className="font-bold mb-1">Distribuição de Investimento</h3>
                  <p className="text-sm text-muted-foreground mb-6">Como o teu orçamento está distribuído entre canais</p>
                  {pieData.length > 0 ? (
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                      <ResponsiveContainer width={300} height={300}>
                        <RePieChart>
                          <Pie data={pieData} cx="50%" cy="50%" outerRadius={120} innerRadius={60} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                            {pieData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => `${v.toLocaleString('pt-PT')}€`} />
                        </RePieChart>
                      </ResponsiveContainer>
                      <div className="space-y-3">
                        {pieData.map((d, i) => (
                          <div key={d.name} className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-sm font-medium">{d.name}</span>
                            <span className="text-sm text-muted-foreground ml-auto">{d.value.toLocaleString('pt-PT')}€</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-16">Insere investimentos para ver a distribuição.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Summary Stats */}
          <Card className="bg-white mb-12">
            <CardContent className="p-6">
              <h3 className="font-bold mb-4">Resumo Completo</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Investimento Total</p>
                  <p className="text-xl font-bold">{stats.totalInvestment.toLocaleString('pt-PT')}€</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Receita Total</p>
                  <p className="text-xl font-bold text-primary">{stats.totalRevenue.toLocaleString('pt-PT')}€</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Leads</p>
                  <p className="text-xl font-bold">{stats.totalLeads}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Custo por Aquisição</p>
                  <p className="text-xl font-bold">{stats.cpa.toFixed(2)}€</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold mb-3">Precisas de ajuda a melhorar estes números?</h2>
            <p className="text-muted-foreground mb-6">Agenda uma consulta gratuita e vamos otimizar as tuas campanhas juntos.</p>
            <Button asChild size="lg" className="rounded-[12px] px-8 text-base font-semibold">
              <Link to="/booking">Agendar Consulta Gratuita</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ROICalculator;