import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { analytics, buildWhatsAppUrl } from '@/lib/analytics';
import { WHATSAPP_MESSAGES, WHATSAPP_PHONE } from '@/lib/whatsappMessages';
import { motion } from 'framer-motion';
import { Plane, Edit, MapPin, Calculator, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const BASE_KM_LIMIT = 15;
const PRICE_PER_KM = 0.35;
const FIGUEIRA_COORD = { lat: 40.1501, lng: -8.8615 };

const DronePriceCalculator = () => {
  const { t } = useTranslation();
  const [address, setAddress] = useState('');
  const [distance, setDistance] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'base' | 'edited' | null>(null);

  const plans = [
    {
      id: 'base',
      title: t('droneCalculator.basePlan'),
      price: 100,
      description: 'Ideal para quem já tem equipa de edição ou quer os ficheiros brutos.',
      features: [
        'Fotografias e vídeos captados com drone',
        'Até 15 km da Figueira da Foz incluídos',
        'Entrega dos ficheiros brutos (RAW/LOG)',
      ],
      icon: Plane,
      popular: false,
    },
    {
      id: 'edited',
      title: t('droneCalculator.editedPlan'),
      price: 250,
      description: 'Solução completa chave-na-mão para resultados cinematográficos.',
      features: [
        'Fotografias e vídeos captados com drone',
        'Edição profissional (cor, corte, estabilização)',
        'Até 15 km da Figueira da Foz incluídos',
      ],
      icon: Edit,
      popular: true,
    },
  ];

  const calculateDistance = async () => {
    if (!address) {
      toast.error(t('droneCalculator.addressError'));
      return;
    }

    setIsCalculating(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const d = getHaversineDistance(
          FIGUEIRA_COORD.lat,
          FIGUEIRA_COORD.lng,
          parseFloat(lat),
          parseFloat(lon)
        );
        setDistance(Math.round(d * 1.2));
        toast.success(t('droneCalculator.toastSuccess'));
        analytics.trackForm('drone_calculator', 'distance_calculated', {
          address,
          distance: Math.round(d * 1.2)
        });
      } else {
        toast.error(t('droneCalculator.notFoundError'));
      }
    } catch (error) {
      console.error('Error calculating distance:', error);
      toast.error(t('droneCalculator.toastError'));
    } finally {
      setIsCalculating(false);
    }
  };

  const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const deg2rad = (deg: number) => deg * (Math.PI / 180);

  const calculateExtraCost = () => {
    if (distance === null) return 0;
    const extraKm = Math.max(0, distance - BASE_KM_LIMIT);
    return extraKm * PRICE_PER_KM;
  };

  const getTotalPrice = (basePrice: number) => {
    return basePrice + calculateExtraCost();
  };

  const extraKm = distance !== null ? Math.max(0, distance - BASE_KM_LIMIT) : 0;
  const extraCost = calculateExtraCost();

  return (
    <section className="section-padding bg-section-alt relative overflow-hidden" id="drone-plans">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full -ml-32 -mb-32 blur-3xl" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
              Preços & Planos
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('droneCalculator.title')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              {t('droneCalculator.subtitle')}
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex"
            >
              <Card 
                className={`relative flex flex-col w-full overflow-hidden transition-all duration-300 hover:shadow-xl border-2 ${
                  selectedPlan === plan.id ? 'border-primary' : 'border-border'
                } ${plan.popular ? 'bg-background' : 'bg-background/50'}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest py-1 px-8 rotate-45 translate-x-[26px] translate-y-[10px] shadow-sm">
                      {t('droneCalculator.popular')}
                    </div>
                  </div>
                )}
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <plan.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{plan.title}</CardTitle>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-black">{plan.price}€</span>
                    <span className="text-muted-foreground">{t('droneCalculator.basePrice')}</span>
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <div className="mt-1 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        </div>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                    {/* Custo adicional oculto nos cards conforme solicitado */}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className={`w-full h-12 text-base font-semibold transition-all ${
                      selectedPlan === plan.id 
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                    onClick={() => {
                      setSelectedPlan(plan.id as 'base' | 'edited');
                      document.getElementById('calculator-input')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    {selectedPlan === plan.id ? 'Plano Selecionado' : t('droneCalculator.calculateBtn')}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
          id="calculator-input"
        >
          <div className="bg-background rounded-3xl border border-border p-8 md:p-12 shadow-sm">
            <div className="grid lg:grid-cols-5 gap-12 items-center">
              <div className="lg:col-span-3 space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    {t('droneCalculator.calcTitle')}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t('droneCalculator.calcDesc')}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Input
                        placeholder={t('droneCalculator.addressPlaceholder')}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="h-12 pl-4 pr-10 rounded-xl"
                        onKeyPress={(e) => e.key === 'Enter' && calculateDistance()}
                      />
                    </div>
                    <Button 
                      onClick={calculateDistance} 
                      disabled={isCalculating}
                      className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 font-bold"
                    >
                      {isCalculating ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        t('droneCalculator.calcAction')
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <Info className="w-4 h-4 text-primary flex-shrink-0" />
                    <p>{t('droneCalculator.infoNote')}</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-section-alt rounded-2xl p-6 border border-border space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{t('droneCalculator.totalDist')}:</span>
                    <span className="font-bold">{distance !== null ? `${distance} km` : '---'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{t('droneCalculator.extraKm')}:</span>
                    <span className="font-bold">{distance !== null ? `${extraKm} km` : '---'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{t('droneCalculator.addCost')}:</span>
                    <span className="font-bold text-destructive">{distance !== null ? `${extraCost.toFixed(2)}€` : '---'}</span>
                  </div>
                  <div className="pt-4 border-t border-border mt-4">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold">{t('droneCalculator.estimatedValue')}</span>
                        <div className="text-3xl font-black text-primary">
                          {selectedPlan && distance !== null 
                            ? `${getTotalPrice(plans.find(p => p.id === selectedPlan)?.price || 0).toFixed(2)}€` 
                            : '---'
                          }
                        </div>
                      </div>
                      <Button 
                        asChild
                        disabled={!selectedPlan || distance === null}
                        variant={(!selectedPlan || distance === null) ? "outline" : "default"}
                        className="rounded-lg font-bold"
                      >
                        <a
                          href={buildWhatsAppUrl(
                            WHATSAPP_PHONE,
                            WHATSAPP_MESSAGES.droneCalculator({
                              plan: selectedPlan,
                              address,
                              distanceKm: distance,
                              priceEur:
                                selectedPlan && distance !== null
                                  ? getTotalPrice(plans.find(p => p.id === selectedPlan)?.price || 0)
                                  : null,
                            })
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => analytics.trackWhatsApp('drone_calculator', 'droneCalculator', { plan: selectedPlan, distance })}
                        >
                          {t('droneCalculator.reserve')} <ArrowRight className="w-4 h-4 ml-2" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DronePriceCalculator;
