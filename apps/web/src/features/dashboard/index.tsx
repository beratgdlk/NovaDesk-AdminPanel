import { Main } from '#/components/layout/main';
import { Button } from '#/components/ui/button';
import { Calendar } from '#/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card';
import { ChartTooltip, ChartTooltipContent } from '#/components/ui/chart';
import { Popover, PopoverContent, PopoverTrigger } from '#/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select';
import { useI18n } from '#/context/i18n-context';
import { cn } from '#/lib/utils';
import { CalendarIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

// Yardımcılar: sabit ay isimleri ve basit deterministik varyans üretici
const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function seededRand(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function generateMonthlyData(months: string[], seed = 42) {
  const rand = seededRand(seed);
  const messages = months.map((m, i) => ({ date: m, count: Math.round(150 + rand() * 120 + i * 8) }));
  const offers = months.map((m, i) => ({ date: m, count: Math.round(70 + rand() * 80 + i * 5) }));
  const policies = months.map((m, i) => ({ date: m, count: Math.round(30 + rand() * 60 + i * 4) }));
  const conversion = MONTHS_TR.map((m, i) => ({ date: m, rate: Number(((policies[i].count / Math.max(1, offers[i].count)) * 100).toFixed(1)) }));
  return { messages, offers, policies, conversion };
}

function daysInMonth(index: number, year = new Date().getFullYear()) {
  return new Date(year, index + 1, 0).getDate();
}

function generateDailyDataForMonth(monthIndex: number, seedBase = 100) {
  const d = daysInMonth(monthIndex);
  const rand = seededRand(seedBase + monthIndex * 13);
  const dailyMessages = Array.from({ length: d }, (_, i) => ({ day: i + 1, messages: Math.round(10 + rand() * 35) }));
  const dailyOffers = Array.from({ length: d }, (_, i) => ({ day: i + 1, offers: Math.round(5 + rand() * 20) }));
  const dailyPolicies = Array.from({ length: d }, (_, i) => ({ day: i + 1, policies: Math.round(2 + rand() * 12) }));
  // Birleşik görünüm için tek diziye katla
  const combined = Array.from({ length: d }, (_, i) => ({
    day: i + 1,
    messages: dailyMessages[i].messages,
    offers: dailyOffers[i].offers,
    policies: dailyPolicies[i].policies,
  }));
  return { dailyMessages, dailyOffers, dailyPolicies, combined };
}



// Date Picker Component
function DatePickerDemo({ date, setDate, localeCode }: { date?: Date; setDate: (date?: Date) => void; localeCode: 'tr' | 'en' }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[140px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd/MM/yyyy", { locale: localeCode === 'tr' ? tr : enUS }) : <span>{localeCode === 'tr' ? 'Tarih seç' : 'Pick a date'}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          locale={localeCode === 'tr' ? tr : enUS as any}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export default function Dashboard() {
  const { t, locale } = useI18n();
  const [messageDate, setMessageDate] = useState<Date>();
  const [offerDate, setOfferDate] = useState<Date>();
  const [policyDate, setPolicyDate] = useState<Date>();

  // Aylık veriler (yıl geneli)
  const months = locale === 'tr' ? MONTHS_TR : MONTHS_EN;
  const { messages, offers, policies, conversion } = useMemo(() => generateMonthlyData(months, 99), [locale]);

  // Seçili ay için günlük veriler
  const [selectedMonthIndexState, setSelectedMonthIndex] = useState<number>(new Date().getMonth());
  const selectedMonthIndex = (messageDate ?? offerDate ?? policyDate)?.getMonth() ?? selectedMonthIndexState;
  const daily = useMemo(() => generateDailyDataForMonth(selectedMonthIndex), [selectedMonthIndex]);

  return (
    <>
      <Main>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Başlatılan Mesaj Sayısı Kartı */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-base font-medium">{t('dashboard.messages')}</CardTitle>
                <CardDescription>{t('dashboard.filterByDate')}</CardDescription>
              </div>
              <DatePickerDemo date={messageDate} setDate={setMessageDate} localeCode={locale} />
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={messages} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Alınan Teklif Sayısı Kartı */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-base font-medium">{t('dashboard.offers')}</CardTitle>
                <CardDescription>{t('dashboard.filterByDate')}</CardDescription>
              </div>
              <DatePickerDemo date={offerDate} setDate={setOfferDate} localeCode={locale} />
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={offers} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#10b981" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 mt-6 lg:grid-cols-2">
          {/* Poliçeleşen Teklif Sayısı Kartı */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-base font-medium">{t('dashboard.policies')}</CardTitle>
                <CardDescription>{t('dashboard.filterByDate')}</CardDescription>
              </div>
              <DatePickerDemo date={policyDate} setDate={setPolicyDate} localeCode={locale} />
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={policies} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="count" stroke="#f59e0b" fill="#f59e0b22" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Dönüşüm Oranı (Teklif -> Poliçe) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-base font-medium">{t('dashboard.conversion')}</CardTitle>
                <CardDescription>Offer → Policy (%)</CardDescription>
              </div>
              <div className="w-36">
                <Select value={String(selectedMonthIndexState)} onValueChange={(v) => setSelectedMonthIndex(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder={months[selectedMonthIndexState]} />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m, i) => (
                      <SelectItem key={m} value={String(i)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={conversion} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="date" fontSize={12} axisLine={false} tickLine={false} />
                  <YAxis fontSize={12} axisLine={false} tickLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="rate" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Seçilen ay için günlük dağılım (kombine) */}
        <div className="grid gap-6 mt-6 lg:grid-cols-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-base font-medium">{t('dashboard.daily')} — {months[selectedMonthIndex]}</CardTitle>
                <CardDescription>{t('dashboard.forMonth')}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={daily.combined} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="day" fontSize={12} axisLine={false} tickLine={false} />
                  <YAxis fontSize={12} axisLine={false} tickLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="messages" stackId="a" fill="#3b82f6" radius={[6,6,0,0]} />
                  <Bar dataKey="offers" stackId="a" fill="#10b981" radius={[6,6,0,0]} />
                  <Bar dataKey="policies" stackId="a" fill="#f59e0b" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  );
}