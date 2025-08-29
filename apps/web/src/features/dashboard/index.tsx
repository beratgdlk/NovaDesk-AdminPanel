import { Main } from '#/components/layout/main';
import { Button } from '#/components/ui/button';
import { Calendar } from '#/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card';
import { ChartTooltip, ChartTooltipContent } from '#/components/ui/chart';
import { Popover, PopoverContent, PopoverTrigger } from '#/components/ui/popover';
import { cn } from '#/lib/utils';
import { CalendarIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

// Örnek veri
const messageData = [
  { date: 'Oca', count: 186 },
  { date: 'Şub', count: 205 },
  { date: 'Mar', count: 237 },
  { date: 'Nis', count: 173 },
  { date: 'May', count: 209 },
  { date: 'Haz', count: 214 },
];

const offerData = [
  { date: 'Oca', count: 86 },
  { date: 'Şub', count: 95 },
  { date: 'Mar', count: 137 },
  { date: 'Nis', count: 73 },
  { date: 'May', count: 109 },
  { date: 'Haz', count: 124 },
];

const policyData = [
  { date: 'Oca', count: 46 },
  { date: 'Şub', count: 55 },
  { date: 'Mar', count: 67 },
  { date: 'Nis', count: 43 },
  { date: 'May', count: 59 },
  { date: 'Haz', count: 74 },
];



// Date Picker Component
function DatePickerDemo({ date, setDate }: { date?: Date; setDate: (date?: Date) => void }) {
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
          {date ? format(date, "dd/MM/yyyy", { locale: tr }) : <span>Tarih seç</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export default function Dashboard() {
  const [messageDate, setMessageDate] = useState<Date>();
  const [offerDate, setOfferDate] = useState<Date>();
  const [policyDate, setPolicyDate] = useState<Date>();

  return (
    <>
      <Main>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Analizler</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Başlatılan Mesaj Sayısı Kartı */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-base font-medium">Başlatılan Mesaj Sayısı</CardTitle>
                <CardDescription>Tarih seçerek filtreleyebilirsiniz</CardDescription>
              </div>
              <DatePickerDemo date={messageDate} setDate={setMessageDate} />
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={messageData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                <CardTitle className="text-base font-medium">Alınan Teklif Sayısı</CardTitle>
                <CardDescription>Tarih seçerek filtreleyebilirsiniz</CardDescription>
              </div>
              <DatePickerDemo date={offerDate} setDate={setOfferDate} />
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={offerData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 mt-6 lg:grid-cols-1">
          {/* Poliçeleşen Teklif Sayısı Kartı */}
          <Card className="lg:max-w-[calc(50%-0.75rem)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-base font-medium">Poliçeleşen Teklif Sayısı</CardTitle>
                <CardDescription>Tarih seçerek filtreleyebilirsiniz</CardDescription>
              </div>
              <DatePickerDemo date={policyDate} setDate={setPolicyDate} />
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={policyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                    stroke="#f59e0b" 
                    strokeWidth={3}
                    dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#f59e0b", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  );
}