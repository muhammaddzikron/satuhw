import axios from 'axios';
import { QuranSurah } from '../types';

const BASE_URL = 'https://equran.id/api/v2';

export const quranService = {
  async getSurahList(): Promise<QuranSurah[]> {
    try {
      const response = await axios.get(`${BASE_URL}/surat`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching surah list:', error);
      return [];
    }
  },

  async getSurahDetail(nomor: number): Promise<any> {
    try {
      const response = await axios.get(`${BASE_URL}/surat/${nomor}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching surah ${nomor}:`, error);
      return null;
    }
  }
};
