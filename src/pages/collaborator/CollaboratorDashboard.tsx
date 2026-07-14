import { Users, Calendar, Wallet, MessageSquare } from 'lucide-react';

const items = [
  { icon: Users, title: 'Equipa & RH', desc: 'Perfis, contactos e organograma da equipa.' },
  { icon: Calendar, title: 'Férias & Ausências', desc: 'Pedidos, aprovações e mapa anual.' },
  { icon: Wallet, title: 'Pagamentos', desc: 'Recibos de vencimento e histórico.' },
  { icon: MessageSquare, title: 'Comunicação', desc: 'Anúncios internos e mensagens.' },
];

const CollaboratorDashboard = () => (
  <div className="min-h-screen bg-background p-6 md:p-10">
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">Área do Colaborador</h1>
      <p className="text-muted-foreground mt-1">Bem-vindo à tua área interna.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {items.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
              <Icon className="w-5 h-5" />
            </div>
            <div className="font-semibold text-foreground">{title}</div>
            <p className="text-sm text-muted-foreground mt-1">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default CollaboratorDashboard;
