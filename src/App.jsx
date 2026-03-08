import React, { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, useParams, Link } from "react-router-dom"
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import { LucideMap, LayoutDashboard, Plus, Wind, Thermometer, Droplets, Zap, ChevronRight } from "lucide-react"

// UI Components
import { Sidebar, SidebarProvider, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

const queryClient = new QueryClient()

// --- 1. DATA LOGIC ---
const useDeviceManager = () => {
  const [devices, setDevices] = useState(() => {
    const saved = localStorage.getItem("user_devices")
    return saved ? JSON.parse(saved) : []
  })

  const addDevice = (device) => {
    const updated = [...devices, { ...device, id: device.deviceId }]
    setDevices(updated)
    localStorage.setItem("user_devices", JSON.stringify(updated))
  }

  return { devices, addDevice }
}

// --- 2. THE MAP VIEW ---
const HomePage = ({ devices }) => (
  <div className="p-6 h-full flex flex-col gap-6 bg-slate-50/50">
    <header className="flex flex-col gap-1">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Environmental Command Center</h1>
      <p className="text-slate-500 font-medium">Global PM2.5 monitoring via LASS Network</p>
    </header>

    <div className="flex-1 relative rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden min-h-[500px]">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />
      
      {devices.map((device) => (
        <div 
          key={device.id}
          className="absolute transition-all duration-500"
          style={{ left: `${device.lng}%`, top: `${device.lat}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute h-16 w-16 rounded-full bg-emerald-500/20 animate-ping" />
            <div className="absolute h-8 w-8 rounded-full bg-emerald-400/30 animate-pulse" />
            <Link to={`/device/${device.id}`} className="z-10 group">
              <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg border-2 border-white hover:scale-110 transition-transform whitespace-nowrap">
                {device.name}
              </div>
            </Link>
          </div>
        </div>
      ))}

      {devices.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <LucideMap className="h-12 w-12 text-slate-700 animate-bounce" />
          <p className="text-slate-500 font-medium">Add a device in the sidebar to populate the map</p>
        </div>
      )}
    </div>
  </div>
)

// --- 3. THE DEVICE DASHBOARD ---
const DeviceDashboard = () => {
  const { id } = useParams()
  
  const { data, isLoading } = useQuery({
    queryKey: ['lass-data', id],
    queryFn: async () => {
      const res = await fetch(`https://pm25.lass-net.org/data/last-all-lass.json`)
      const json = await res.json()
      // Fallback for case where device is not in the feed
      return json.feeds.find(f => f.device_id === id) || null
    },
    refetchInterval: 30000 
  })

  if (isLoading) return (
    <div className="p-8 space-y-6">
      <Skeleton className="h-10 w-1/4" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
    </div>
  )

  if (!data) return (
    <div className="p-8 text-center flex flex-col items-center justify-center h-[50vh]">
      <h2 className="text-2xl font-bold text-slate-400">Device Offline or ID Incorrect</h2>
      <p className="text-slate-500">Could not find data for {id} on the LASS network.</p>
    </div>
  )

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1">
        <h2 className="text-4xl font-black text-slate-900">{id}</h2>
        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Live Sync Active • Last Update: {data?.timestamp || 'Just now'}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricTile label="PM2.5" val={data?.s_d0} unit="µg/m³" icon={<Wind className="text-orange-500" />} />
        <MetricTile label="Temperature" val={data?.s_t0} unit="°C" icon={<Thermometer className="text-red-500" />} />
        <MetricTile label="Humidity" val={data?.s_h0} unit="%" icon={<Droplets className="text-blue-500" />} />
        <MetricTile label="CO2/TVOC" val={data?.s_g8 || "N/A"} unit="ppm" icon={<Zap className="text-emerald-500" />} />
      </div>

      <Card className="rounded-2xl border-none shadow-xl bg-white/50 backdrop-blur-md overflow-hidden h-[400px] flex items-center justify-center border border-slate-100">
        <p className="text-slate-400 font-medium italic">Advanced Chronological Analytics Visualization</p>
      </Card>
    </div>
  )
}

const MetricTile = ({ label, val, unit, icon }) => {
  const numericVal = parseFloat(val) || 0;
  return (
    <Card className="rounded-2xl border-none shadow-lg hover:shadow-xl transition-shadow bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black text-slate-900">{val ?? '--'} <span className="text-sm font-medium text-slate-400">{unit}</span></div>
        <Progress value={Math.min(numericVal, 100)} className="h-1.5 mt-4" />
      </CardContent>
    </Card>
  )
}

// --- 4. MASTER LAYOUT ---
const MainContent = () => {
  const { devices, addDevice } = useDeviceManager()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [form, setForm] = useState({ deviceId: '', name: '', lat: '', lng: '' })

  const handleAddDevice = () => {
    if (!form.deviceId || !form.name) return;
    addDevice(form);
    setForm({ deviceId: '', name: '', lat: '', lng: '' });
    setIsDialogOpen(false);
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900 font-sans">
        <Sidebar className="border-r border-slate-200 bg-white">
          <SidebarHeader className="p-6 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200">
                <Wind className="h-6 w-6" />
              </div>
              <span className="font-black text-xl tracking-tight uppercase">Aether</span>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full h-11 rounded-xl shadow-lg shadow-slate-200 bg-slate-900 hover:bg-slate-800 transition-all font-bold">
                  <Plus className="mr-2 h-4 w-4" /> Create Location
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl border-none shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">Register New Point</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <Input placeholder="LASS Device ID" value={form.deviceId} onChange={e => setForm({...form, deviceId: e.target.value})} />
                  <Input placeholder="Custom Nickname" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="Lat (0-100)" value={form.lat} onChange={e => setForm({...form, lat: e.target.value})} />
                    <Input placeholder="Lng (0-100)" value={form.lng} onChange={e => setForm({...form, lng: e.target.value})} />
                  </div>
                  <Button onClick={handleAddDevice} className="h-12 rounded-xl bg-slate-900 font-bold">Deploy Analytics</Button>
                </div>
              </DialogContent>
            </Dialog>
          </SidebarHeader>

          <SidebarContent className="p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-11 rounded-xl hover:bg-slate-100 px-4">
                  <Link to="/" className="flex items-center gap-3 font-bold text-slate-600">
                    <LucideMap className="h-5 w-5" /> Live Map
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            <div className="mt-8 px-4 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Your Dashboards</div>
            <SidebarMenu>
              {devices.map((device) => (
                <SidebarMenuItem key={device.id}>
                  <SidebarMenuButton asChild className="h-11 rounded-xl hover:bg-slate-100 px-4">
                    <Link to={`/device/${device.id}`} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3 font-bold text-slate-600">
                        <LayoutDashboard className="h-5 w-5 group-hover:text-slate-900" /> 
                        {device.name}
                      </div>
                      <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-y-auto relative">
          <Routes>
            <Route path="/" element={<HomePage devices={devices} />} />
            <Route path="/device/:id" element={<DeviceDashboard />} />
          </Routes>
        </main>
      </div>
    </SidebarProvider>
  )
}

// --- 5. APP ENTRY POINT ---
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <MainContent />
      </Router>
    </QueryClientProvider>
  )
}
