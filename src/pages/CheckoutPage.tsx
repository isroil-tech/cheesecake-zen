import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Loader2, AlertCircle, Phone, Building2,
  User, MapPin, Navigation, Map, X, History, Instagram,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/i18n/useTranslation';
import { useCartStore } from '@/stores/cartStore';
import { useOrderStore } from '@/stores/orderStore';
import { formatPrice } from '@/data/products';

interface CheckoutPageProps {
  telegramId: string;
  onBack: () => void;
  onPayment: (orderId: string, orderNumber: number, total: number, deliveryType: string) => void;
}

// Resolve telegram ID from all possible sources
function resolveTelegramId(prop: string): string {
  if (prop && !prop.startsWith('guest-')) return prop;
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (tgUser?.id) return tgUser.id.toString();
  // URL param ?uid=...
  const params = new URLSearchParams(window.location.search);
  const uid = params.get('uid');
  if (uid) return uid;
  return prop || localStorage.getItem('guest_telegram_id') || '';
}

export function CheckoutPage({ telegramId, onBack, onPayment }: CheckoutPageProps) {
  const { t, language } = useTranslation();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const addOrder = useOrderStore((s) => s.addOrder);

  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [floor, setFloor] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // GPS state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // Inline map modal
  const [showMap, setShowMap] = useState(false);
  const mapIframeRef = useRef<HTMLIFrameElement>(null);

  // Profile — autofilled from bot
  const [userPhone, setUserPhone] = useState('');
  const [userName, setUserName] = useState('');
  const [extraPhone, setExtraPhone] = useState('');
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [recentLocations, setRecentLocations] = useState<Array<{address:string, lat:number, lon:number}>>([]);

  // Fetch recent locations from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('recent_locations') || '[]');
      if (Array.isArray(saved)) setRecentLocations(saved.slice(0, 3));
    } catch {}
  }, []);

  // Fetch profile — try immediately from all sources, retry when prop changes
  useEffect(() => {
    const tgWebApp = window.Telegram?.WebApp?.initDataUnsafe?.user;
    // Immediate fallback from Telegram WebApp (available right away)
    if (tgWebApp?.first_name) {
      setUserName(tgWebApp.first_name + (tgWebApp.last_name ? ' ' + tgWebApp.last_name : ''));
    }

    const tgId =
      (telegramId && !telegramId.startsWith('guest-') ? telegramId : null) ||
      tgWebApp?.id?.toString() ||
      new URLSearchParams(window.location.search).get('uid') ||
      localStorage.getItem('guest_telegram_id') ||
      telegramId;

    if (!tgId) { setProfileLoaded(true); return; }
    const load = async () => {
      try {
        const res = await fetch('/api/v1/users/me', {
          headers: { 'x-telegram-id': tgId },
        });
        if (res.ok) {
          const data = await res.json();
          if (data && !data.error) {
            // DB has more accurate name (from bot registration)
            if (data.firstName) setUserName(data.firstName + (data.lastName ? ' ' + data.lastName : ''));
            if (data.phone) setUserPhone(data.phone);
          }
        }
      } catch (_) {}
      setProfileLoaded(true);
    };
    load();
  }, [telegramId]); // runs on mount AND when telegramId prop finally arrives

  // ─── GPS via Telegram LocationManager or browser geolocation ───────────
  const handleSendLocation = () => {
    setGpsError('');
    setGpsLoading(true);

    const tg = window.Telegram?.WebApp as any;

    // Telegram Mini App LocationManager (newer API)
    if (tg?.LocationManager) {
      if (!tg.LocationManager.isInited) {
        tg.LocationManager.init(() => {
          if (tg.LocationManager.isLocationAvailable) {
            tg.LocationManager.getLocation((loc: any) => {
              if (loc) {
                applyCoords(loc.latitude, loc.longitude);
              } else {
                fallbackGPS();
              }
            });
          } else {
            fallbackGPS();
          }
        });
      } else if (tg.LocationManager.isLocationAvailable) {
        tg.LocationManager.getLocation((loc: any) => {
          if (loc) applyCoords(loc.latitude, loc.longitude);
          else fallbackGPS();
        });
      } else {
        fallbackGPS();
      }
      return;
    }

    // Fallback: browser geolocation
    fallbackGPS();
  };

  const fallbackGPS = () => {
    if (!navigator.geolocation) {
      setGpsError(language === 'ru' ? 'GPS не поддерживается' : 'GPS qo\'llab-quvvatlanmaydi');
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => applyCoords(pos.coords.latitude, pos.coords.longitude),
      () => {
        setGpsError(language === 'ru' ? 'Joylashuv aniqlanmadi' : 'Joylashuv aniqlanmadi');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const applyCoords = async (lat: number, lon: number) => {
    setLatitude(lat);
    setLongitude(lon);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { 'Accept-Language': 'uz,ru' } }
      );
      const d = await r.json();
      setAddress(d.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`);
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
    }
    setGpsLoading(false);
  };

  // ─── Inline map picker (OpenStreetMap iframe) ───────────────────────────
  const openMap = () => setShowMap(true);

  // Receive message from map iframe
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'MAP_PICK') {
        const { lat, lon, label } = e.data;
        setLatitude(lat);
        setLongitude(lon);
        if (label) setAddress(label);
        setShowMap(false);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // ─── Submit order ───────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (loading || items.length === 0) return;
    setLoading(true);
    setError('');

    const tgId = resolveTelegramId(telegramId) || `guest-${Date.now()}`;
    console.log('[Checkout] tgId:', tgId, 'items:', items.length);

    try {
      if (userName || userPhone) {
        await fetch('/api/v1/users/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-telegram-id': tgId },
          body: JSON.stringify({ firstName: userName, phone: userPhone }),
        }).catch(() => {});
      }

      const res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-telegram-id': tgId },
        body: JSON.stringify({
          deliveryType,
          address: deliveryType === 'delivery' ? address : undefined,
          latitude: deliveryType === 'delivery' ? latitude : undefined,
          longitude: deliveryType === 'delivery' ? longitude : undefined,
          floor: deliveryType === 'delivery' ? (floor || undefined) : undefined,
          extraPhone: extraPhone || undefined,
          comment: comment || undefined,
          items: items.map((i) => ({
            productId: i.productId,
            productVariantId: i.productVariantId,
            name: i.name,
            format: i.format,
            quantity: i.quantity,
            pricePerUnit: i.pricePerUnit,
          })),
        }),
      });

      const order = await res.json();
      console.log('[Checkout] response:', res.status, order);

      if (!res.ok) {
        const msg = Array.isArray(order?.message)
          ? order.message.join(', ')
          : order?.message || order?.error || `Server xatosi: HTTP ${res.status}`;
        setError(msg);
        setLoading(false);
        return;
      }

      if (order.id) {
        if (deliveryType === 'delivery' && latitude && longitude && address) {
          try {
            let saved = JSON.parse(localStorage.getItem('recent_locations') || '[]');
            saved = saved.filter((s:any) => s.address !== address);
            saved.unshift({ address, lat: latitude, lon: longitude });
            if (saved.length > 3) saved.pop();
            localStorage.setItem('recent_locations', JSON.stringify(saved));
            setRecentLocations(saved);
          } catch {}
        }
        
        addOrder({ items: [...items], total: getTotalPrice(), deliveryType,
          address: deliveryType === 'delivery' ? address : undefined,
          comment: comment || undefined });
        const total = getTotalPrice();
        clearCart();
        onPayment(order.id, order.orderNumber, total, deliveryType);
      } else {
        setError(order.error || 'Buyurtma yaratishda xatolik');
      }
    } catch (err: any) {
      console.error('[Checkout] error:', err);
      setError(`Xatolik: ${err?.message || 'tarmoqni tekshiring'}`);
    }
    setLoading(false);
  };



  // Map iframe HTML with Leaflet — starts at user's current location
  const initLat = latitude || 41.299496;
  const initLon = longitude || 69.240073;
  const mapHtml = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{margin:0;height:100%}
#btn{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
  background:#E63B5A;color:#fff;border:none;padding:14px 32px;
  border-radius:50px;font-size:16px;font-weight:600;z-index:9999;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.3)}
#hint{position:fixed;top:12px;left:50%;transform:translateX(-50%);
  background:rgba(0,0,0,.6);color:#fff;padding:8px 16px;border-radius:20px;
  font-size:13px;z-index:9999;white-space:nowrap}
#locbtn{position:fixed;bottom:80px;right:16px;
  background:#fff;border:none;width:44px;height:44px;border-radius:50%;
  box-shadow:0 2px 8px rgba(0,0,0,.3);z-index:9999;cursor:pointer;font-size:20px}
</style>
</head>
<body>
<div id="hint">Xaritaga bosing → ✅ Tanlash</div>
<div id="map"></div>
<button id="btn" style="display:none">✅ Tanlash</button>
<button id="locbtn" title="Mening lokatsiyam">📍</button>
<script>
var initLat = ${initLat}, initLon = ${initLon};
var map = L.map('map').setView([initLat, initLon], ${latitude ? 16 : 13});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:''}).addTo(map);
var marker = ${latitude ? `L.marker([${initLat}, ${initLon}]).addTo(map)` : 'null'};
var lat = ${latitude || 'null'}, lon = ${longitude || 'null'}, label = '';

// Try to get user's real location on load
if(navigator.geolocation && !${!!latitude}) {
  navigator.geolocation.getCurrentPosition(function(pos){
    var lt=pos.coords.latitude, ln=pos.coords.longitude;
    map.setView([lt, ln], 16);
    if(!marker){ marker = L.marker([lt, ln]).addTo(map); }
    else { marker.setLatLng([lt, ln]); }
    lat=lt; lon=ln;
    document.getElementById('btn').style.display='block';
  }, null, {timeout:8000});
}

document.getElementById('locbtn').onclick = function(){
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(function(pos){
      var lt=pos.coords.latitude, ln=pos.coords.longitude;
      map.setView([lt, ln], 16);
      if(!marker){ marker = L.marker([lt, ln]).addTo(map); }
      else { marker.setLatLng([lt, ln]); }
      lat=lt; lon=ln;
      document.getElementById('btn').style.display='block';
    });
  }
};

map.on('click', async function(e){
  lat = e.latlng.lat; lon = e.latlng.lng;
  if(marker) marker.setLatLng(e.latlng);
  else marker = L.marker(e.latlng).addTo(map);
  document.getElementById('btn').style.display='block';
  try {
    const r = await fetch('https://nominatim.openstreetmap.org/reverse?lat='+lat+'&lon='+lon+'&format=json&accept-language=uz');
    const d = await r.json();
    label = d.display_name || '';
  } catch(e){ label = ''; }
});
document.getElementById('btn').onclick = function(){
  window.parent.postMessage({type:'MAP_PICK',lat:lat,lon:lon,label:label},'*');
};
</script>
</body>
</html>`;


  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Inline map modal */}
      <AnimatePresence>
        {showMap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-background flex flex-col"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <button
                onClick={() => setShowMap(false)}
                className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="font-semibold text-foreground">
                {language === 'ru' ? 'Выберите на карте' : 'Xaritadan tanlang'}
              </span>
            </div>
            <iframe
              ref={mapIframeRef}
              srcDoc={mapHtml}
              className="flex-1 w-full border-none"
              title="map"
              allow="geolocation"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center active-scale">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-[22px] font-bold text-foreground">{t('checkout.title')}</h1>
      </div>

      <div className="px-5 space-y-6">

        {/* ── Ism va telefon (botdan avtomatik) ── */}
        <div className="rounded-2xl bg-secondary/60 border border-border/50 overflow-hidden">
          {/* Sarlavha */}
          <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-border/30">
            <User className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {language === 'ru' ? 'Контактные данные' : 'Aloqa ma\'lumotlari'}
            </span>
          </div>

          {/* Ism */}
          <div className="px-4 py-3 flex items-center gap-3 border-b border-border/20">
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-0.5">
                {language === 'ru' ? 'Имя' : 'Ism'}
              </p>
              {!profileLoaded
                ? <p className="text-sm font-medium text-muted-foreground animate-pulse">{language === 'ru' ? 'Загрузка...' : 'Yuklanmoqda...'}</p>
                : <p className="text-sm font-semibold text-foreground">
                    {userName || <span className="text-muted-foreground font-normal">{language === 'ru' ? 'Не указано' : 'Ko\'rsatilmagan'}</span>}
                  </p>
              }
            </div>
          </div>

          {/* Telefon */}
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-0.5">
                {language === 'ru' ? 'Телефон' : 'Telefon'}
              </p>
              {!profileLoaded
                ? <p className="text-sm font-medium text-muted-foreground animate-pulse">{language === 'ru' ? 'Загрузка...' : 'Yuklanmoqda...'}</p>
                : <p className="text-sm font-semibold text-foreground">
                    {userPhone || <span className="text-muted-foreground font-normal">{language === 'ru' ? 'Не указано' : 'Ko\'rsatilmagan'}</span>}
                  </p>
              }
            </div>
          </div>
        </div>

        {/* Qo'shimcha raqam */}
        <div>
          <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            {language === 'ru' ? 'Доп. номер (необязательно)' : "Qo'shimcha raqam (ixtiyoriy)"}
          </label>
          <input
            type="tel"
            value={extraPhone}
            onChange={(e) => setExtraPhone(e.target.value)}
            placeholder="+998 ..."
            className="w-full px-4 py-3.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>

        {/* ── Yetkazish / Olib ketish ── */}
        <div className="flex bg-secondary rounded-xl p-1 gap-1">
          <button
            onClick={() => setDeliveryType('delivery')}
            className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all duration-200 active-scale ${
              deliveryType === 'delivery' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            {t('checkout.delivery')}
          </button>
          <button
            onClick={() => setDeliveryType('pickup')}
            className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all duration-200 active-scale ${
              deliveryType === 'pickup' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            {t('checkout.pickup')}
          </button>
        </div>

        {/* ── Manzil ── */}
        <AnimatePresence>
          {deliveryType === 'delivery' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="overflow-hidden space-y-3"
            >
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                {language === 'ru' ? 'Адрес доставки' : 'Yetkazish manzili'}
              </label>

              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={language === 'ru' ? 'Напишите адрес вручную...' : 'Manzilni yozing...'}
                rows={2}
                className="w-full px-4 py-3.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
              />

              {gpsError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />{gpsError}
                </p>
              )}

              {latitude && longitude && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  {language === 'ru' ? 'Локация определена ✓' : 'Joylashuv aniqlandi ✓'}
                </p>
              )}

              {/* Lokatsiya yuborish + Xaritadan tanlash */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSendLocation}
                  disabled={gpsLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 text-primary text-sm font-medium active-scale transition-all border border-primary/20 disabled:opacity-50"
                >
                  {gpsLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Navigation className="w-4 h-4" />}
                  {language === 'ru' ? 'Мою локацию' : 'Manzilni yuborish'}
                </button>
                <button
                  type="button"
                  onClick={openMap}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-foreground text-sm font-medium active-scale transition-all border border-border"
                >
                  <Map className="w-4 h-4" />
                  {language === 'ru' ? 'Выбрать на карте' : 'Xaritadan tanlash'}
                </button>
              </div>

              {recentLocations.length > 0 && (
                <div className="pt-2 space-y-2">
                  <p className="text-[13px] font-medium text-muted-foreground whitespace-nowrap overflow-hidden">
                    {language === 'ru' ? 'Недавние адреса' : "Oxirgi manzillar"}
                  </p>
                  <div className="space-y-1.5 flex flex-col items-stretch">
                    {recentLocations.map((loc, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setLatitude(loc.lat);
                          setLongitude(loc.lon);
                          setAddress(loc.address);
                        }}
                        className="w-full bg-secondary hover:bg-secondary/80 py-3 px-4 rounded-xl flex items-center gap-3 active-scale text-left border border-border/50 transition-colors"
                      >
                        <History className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm text-foreground font-medium truncate leading-normal flex-1">{loc.address}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Qavat */}
              <div className="pt-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4" />
                  {language === 'ru' ? 'Этаж / квартира' : 'Qavat / xonadon'}
                </label>
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder={language === 'ru' ? 'Напр: 3-й этаж, кв. 12' : 'Mas: 3-qavat, 12-xonadon'}
                  className="w-full px-4 py-3.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            </motion.div>

          )}
          {deliveryType === 'pickup' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="bg-secondary/40 rounded-xl p-4 border border-border">
                <div className="space-y-3.5">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{language === 'ru' ? 'Адрес' : 'Manzil'}</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">Tashkent City, Park in Mall 4-qavat</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{language === 'ru' ? 'Телефон' : 'Telefon'}</p>
                      <a href="tel:+998940813431" className="text-sm font-semibold text-primary mt-0.5 inline-block hover:underline">+998 94 081 34 31</a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Instagram className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Instagram</p>
                      <a 
                        href="#" 
                        onClick={(e) => {
                           e.preventDefault();
                           const tg = window.Telegram?.WebApp;
                           // @ts-ignore
                           if (tg && typeof tg.openLink === 'function') {
                             // @ts-ignore
                             tg.openLink('https://instagram.com/77cheesecake.uz');
                           } else {
                             window.open('https://instagram.com/77cheesecake.uz', '_blank');
                           }
                        }} 
                        className="text-sm font-semibold text-primary mt-0.5 inline-block hover:underline"
                      >
                        @77cheesecake.uz
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <img src="/store1.jpg" alt="77CHEESECAKE tashqarisi" className="w-full h-32 object-cover rounded-lg border border-border/50" />
                  <img src="/store2.jpg" alt="77CHEESECAKE ichkarisi" className="w-full h-32 object-cover rounded-lg border border-border/50" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Izoh ── */}
        <div>
          <label className="text-sm font-medium text-foreground">{t('checkout.comment')}</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('checkout.commentPlaceholder')}
            rows={3}
            className="w-full mt-2 px-4 py-3.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
          />
        </div>

        {/* ── Buyurtma tafsiloti ── */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">{t('checkout.orderSummary')}</h3>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={`${item.productId}-${item.format}`} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.name[language]} × {item.quantity}</span>
                <span className="font-medium text-foreground">{formatPrice(item.pricePerUnit * item.quantity)}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-border flex justify-between">
              <span className="font-medium text-foreground">{t('cart.total')}</span>
              <span className="text-lg font-bold text-foreground">{formatPrice(getTotalPrice())} {t('currency')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tasdiqlash ── */}
      <div className="fixed bottom-0 left-0 right-0 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] bg-background/80 backdrop-blur-xl border-t border-border z-50">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="flex items-start gap-2 mb-3 p-3 bg-destructive/10 rounded-xl"
            >
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={handleConfirm}
          disabled={
            loading ||
            items.length === 0 ||
            !userName.trim() ||
            !userPhone.trim() ||
            (deliveryType === 'delivery' && !address.trim())
          }
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground text-base font-semibold active-scale transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('checkout.confirm')}
        </button>
      </div>
    </div>
  );
}
