const { useState, useEffect, useRef } = React;

const App = () => {
    const [devices, setDevices] = useState([
        { id: 'BASE-01', name: 'Taipei Hub', lat: 25.0330, lng: 121.5654 }
    ]);
    const mapInstance = useRef(null);

    // Initialize Map Function
    const initMap = () => {
        if (!mapInstance.current) {
            mapInstance.current = L.map('map-container', { 
                zoomControl: false,
                attributionControl: false 
            }).setView([25.033, 121.565], 11);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(mapInstance.current);

            // Add markers for all devices
            devices.forEach(d => {
                const icon = L.divIcon({ className: 'dot-pulse', iconSize: [12, 12] });
                L.marker([d.lat, d.lng], { icon }).addTo(mapInstance.current)
                 .bindPopup(`<b style="color:#000">${d.name}</b>`);
            });
        }
    };

    useEffect(() => {
        const timer = setTimeout(initMap, 200);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex h-screen w-screen p-6 gap-6">
            <div className="w-80 flex flex-col gap-4">
                <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-white/10 backdrop-blur-md">
                    <h1 className="text-2xl font-black italic tracking-tighter">AETHER<span className="text-indigo-500">.</span></h1>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Geospatial Module v1</p>
                </div>
                
                <div className="flex-1 bg-slate-900/50 p-6 rounded-[2rem] border border-white/10 backdrop-blur-md">
                    <h2 className="text-xs font-bold text-slate-400 uppercase mb-4">Network Nodes</h2>
                    {devices.map(d => (
                        <div key={d.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl mb-2 border border-white/5 hover:border-indigo-500/50 transition-all cursor-pointer">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                            <span className="text-sm font-bold truncate">{d.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 relative">
                <div id="map-container" className="shadow-2xl border border-white/5"></div>
                <div className="absolute top-6 left-6 z-[1000]">
                    <div className="bg-slate-950/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl">
                        <p className="text-sm font-bold tracking-tight">Map Engine: Leaflet.js</p>
                        <p className="text-[10px] text-indigo-400 font-mono">STATUS: RENDERING_OK</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
