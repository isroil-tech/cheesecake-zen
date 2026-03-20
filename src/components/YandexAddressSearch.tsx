import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Search, X, Navigation } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';

declare global {
  interface Window {
    ymaps: any;
  }
}

interface Suggestion {
  displayName: string;
  value: string;
}

interface YandexAddressSearchProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
}

export function YandexAddressSearch({ value, onChange, placeholder }: YandexAddressSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ymapsReady, setYmapsReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const placemarkRef = useRef<any>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Wait for ymaps to be ready (for map only)
  useEffect(() => {
    const checkYmaps = () => {
      if (window.ymaps) {
        window.ymaps.ready(() => setYmapsReady(true));
      } else {
        setTimeout(checkYmaps, 500);
      }
    };
    checkYmaps();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize map when shown
  useEffect(() => {
    if (!showMap || !ymapsReady || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = new window.ymaps.Map(mapContainerRef.current, {
      center: [41.2995, 69.2401], // Tashkent
      zoom: 12,
      controls: ['zoomControl', 'geolocationControl'],
    });

    const placemark = new window.ymaps.Placemark(
      map.getCenter(),
      {},
      {
        draggable: true,
        preset: 'islands#redDotIcon',
      }
    );

    map.geoObjects.add(placemark);
    placemarkRef.current = placemark;
    mapInstanceRef.current = map;

    // On map click — move placemark and geocode
    map.events.add('click', (e: any) => {
      const coords = e.get('coords');
      placemark.geometry.setCoordinates(coords);
      geocodeCoords(coords);
    });

    // On placemark drag end
    placemark.events.add('dragend', () => {
      const coords = placemark.geometry.getCoordinates();
      geocodeCoords(coords);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
        placemarkRef.current = null;
      }
    };
  }, [showMap, ymapsReady]);

  const geocodeCoords = async (coords: number[]) => {
    try {
      const res = await window.ymaps.geocode(coords);
      const firstObj = res.geoObjects.get(0);
      if (firstObj) {
        const address = firstObj.getAddressLine();
        setQuery(address);
        onChange(address);
      }
    } catch (err) {
      console.error('Geocode error:', err);
    }
  };

  // Handle "use my location" button
  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { 'Accept-Language': 'uz,ru' } }
          );
          const data = await res.json();
          if (data.display_name) {
            setQuery(data.display_name);
            onChange(data.display_name);
          }
        } catch (err) {
          console.error('Reverse geocode error:', err);
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        // Fallback: show map
        setShowMap(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Use Nominatim (OpenStreetMap) for text search — free, no API key needed
  // Tashkent bounding box for better local results
  const fetchSuggestions = useCallback(
    async (text: string) => {
      if (text.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const searchText = text.toLowerCase().includes('toshkent') || text.toLowerCase().includes('ташкент')
          ? text
          : `Toshkent, ${text}`;

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&countrycodes=uz&addressdetails=1&limit=5&viewbox=69.1,41.4,69.4,41.2&bounded=1`,
          { headers: { 'Accept-Language': 'uz,ru' } }
        );
        const data = await res.json();
        const mapped = data.map((item: any) => {
          // Build a shorter, cleaner display name from address parts
          const addr = item.address || {};
          const parts: string[] = [];
          if (addr.road || addr.street) parts.push(addr.road || addr.street);
          if (addr.house_number) parts.push(addr.house_number);
          if (addr.neighbourhood || addr.suburb) parts.push(addr.neighbourhood || addr.suburb);
          if (addr.city_district) parts.push(addr.city_district);
          const shortName = parts.length > 0 ? parts.join(', ') : item.display_name.split(',').slice(0, 3).join(',');

          return {
            displayName: shortName,
            value: item.display_name,
          };
        });
        setSuggestions(mapped);
        setShowSuggestions(mapped.length > 0);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleInputChange = (text: string) => {
    setQuery(text);
    onChange(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 300);
  };

  const handleSelect = (suggestion: Suggestion) => {
    setQuery(suggestion.value);
    onChange(suggestion.value);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
    setSuggestions([]);
  };

  const toggleMap = () => {
    setShowMap((prev) => !prev);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative space-y-3">
      {/* Search input with location button */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder || t('checkout.addressPlaceholder')}
          className="w-full pl-10 pr-20 py-3.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />

        {/* Right side buttons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              onClick={handleClear}
              className="w-7 h-7 rounded-full bg-muted-foreground/20 flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
          {/* Location button */}
          <button
            onClick={handleLocate}
            disabled={locating}
            className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center active-scale transition-all"
            title={t('checkout.selectOnMap')}
          >
            {locating ? (
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <Navigation className="w-4 h-4 text-primary" />
            )}
          </button>
        </div>

        {/* Loading spinner */}
        {loading && (
          <div className="absolute right-[4.5rem] top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Suggestions dropdown — max 5 */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1.5 bg-card rounded-xl card-shadow border border-border overflow-hidden"
          >
            {suggestions.slice(0, 5).map((s, i) => (
              <button
                key={i}
                onClick={() => handleSelect(s)}
                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-secondary/60 active:bg-secondary transition-colors text-left"
              >
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-foreground line-clamp-2">{s.displayName}</p>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map toggle button */}
      <button
        onClick={toggleMap}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-sm font-medium text-foreground active-scale transition-all"
      >
        <MapPin className="w-4 h-4 text-primary" />
        {showMap ? t('checkout.hideMap') : t('checkout.selectOnMap')}
      </button>

      {/* Map */}
      <AnimatePresence>
        {showMap && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 250, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden rounded-xl border border-border"
          >
            <div ref={mapContainerRef} className="w-full h-[250px]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
