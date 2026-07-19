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
      console.warn('Network Error or API limit reached for prayer times. Using calculated Hijri and static prayer times fallback.');
      
      // Calculate dynamic Hijri fallback using Kuwaiti Algorithm
      const todayDate = new Date();
      const m = todayDate.getMonth() + 1;
      const y = todayDate.getFullYear();
      const d = todayDate.getDate();
      
      let jd = 0;
      if (y > 1582 || (y === 1582 && m > 10) || (y === 1582 && m === 10 && d >= 15)) {
        jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + 2 - Math.floor(y / 100) + Math.floor(Math.floor(y / 100) / 4) - 1524.5;
      } else {
        jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d - 1524.5;
      }
      
      const l = Math.floor(jd - 1948438.5 - 0.5);
      const cyc = Math.floor(l / 10631);
      const r = l - 10631 * cyc;
      const j = Math.floor((r - 0.166) / 354.367);
      const hYear = 30 * cyc + j + 1;
      const hDayInYear = Math.round(r - 354.367 * j + 0.5);
      
      const hMonthNames = [
        "Muharram", "Safar", "Rabi'ul Awwal", "Rabi'ul Akhir",
        "Jumadil Ula", "Jumadil Akhir", "Rajab", "Sya'ban",
        "Ramadhan", "Syawwal", "Dzulqa'dah", "Dzulhijjah"
      ];
      
      let hMonth = 1;
      let hDay = hDayInYear;
      
      const monthLengths = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];
      const isLeap = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29].includes(hYear % 30);
      if (isLeap) {
        monthLengths[11] = 30;
      }
      
      for (let i = 0; i < 12; i++) {
        if (hDay <= monthLengths[i]) {
          hMonth = i + 1;
          break;
        }
        hDay -= monthLengths[i];
      }

      return {
        shubuh: '04:30',
        dzuhur: '11:45',
        ashar: '15:00',
        maghrib: '17:55',
        isya: '19:05',
        date: todayDate.toISOString().split('T')[0],
        hijri: {
          day: String(hDay),
          month: hMonthNames[hMonth - 1],
          year: String(hYear)
        }
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
