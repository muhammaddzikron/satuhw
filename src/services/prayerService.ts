import axios from 'axios';
import { PrayerTimes } from '../types';

export const prayerService = {
  async getPrayerTimes(location: { lat?: number, lon?: number, city?: string } = { city: 'Purwokerto' }): Promise<PrayerTimes> {
    try {
      const today = new Date().toISOString().split('T')[0];
      let url = '';
      if (location.lat && location.lon) {
        url = `https://api.aladhan.com/v1/timings?latitude=${location.lat}&longitude=${location.lon}&method=15`;
      } else {
        url = `https://api.aladhan.com/v1/timingsByCity?city=${location.city}&country=Indonesia&method=15`;
      }
      
      const response = await axios.get(url);
      const timings = response.data.data.timings;
      const hijri = response.data.data.date.hijri;
      
      return {
        shubuh: timings.Fajr,
        dzuhur: timings.Dhuhr,
        ashar: timings.Asr,
        maghrib: timings.Maghrib,
        isya: timings.Isha,
        date: today,
        hijri: {
          day: hijri.day,
          month: hijri.month.en,
          year: hijri.year
        }
      };
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      return {
        shubuh: '04:30',
        dzuhur: '11:45',
        ashar: '15:00',
        maghrib: '17:55',
        isya: '19:05',
        date: new Date().toISOString().split('T')[0]
      };
    }
  },

  async getLocationName(lat: number, lon: number): Promise<string> {
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=id`);
      return response.data.address.city || response.data.address.town || response.data.address.village || response.data.address.county || 'Lokasi Terdeteksi';
    } catch {
      return 'Purwokerto';
    }
  },

  async getCurrentCoords(): Promise<{ lat: number, lon: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        () => resolve(null),
        { timeout: 10000 }
      );
    });
  }
};
