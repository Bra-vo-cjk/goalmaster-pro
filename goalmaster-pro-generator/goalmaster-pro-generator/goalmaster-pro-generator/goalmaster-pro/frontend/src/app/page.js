'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = 'http://localhost:5000/api';

export default function Home() {
  const [predictions, setPredictions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [predictionsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/predictions`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }),
        axios.get(`${API_URL}/predictions/stats`)
      ]);
      
      setPredictions(predictionsRes.data.predictions || []);
      setStats(statsRes.data.stats || {});
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Toaster position="top-right" />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary/90 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Professional Football Predictions
          </h1>
          <p className="text-xl mb-8">
            {stats.winRate || 89}% win rate • {stats.total || 0}+ predictions
          </p>
          <button className="bg-accent text-primary px-8 py-3 rounded-lg font-bold hover:shadow-lg transition">
            Get Started
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-3xl font-bold text-accent">{stats.winRate || 89}%</div>
            <div className="text-gray-600">Win Rate</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-3xl font-bold text-accent">{stats.total || 0}</div>
            <div className="text-gray-600">Total Predictions</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-3xl font-bold text-accent">{stats.won || 0}</div>
            <div className="text-gray-600">Won Tips</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-3xl font-bold text-accent">{stats.vip || 0}</div>
            <div className="text-gray-600">VIP Tips</div>
          </div>
        </div>

        {/* Predictions Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold">Today's Predictions</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12">Loading predictions...</div>
            ) : predictions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No predictions available today</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">Time</th>
                    <th className="px-6 py-3 text-left">Match</th>
                    <th className="px-6 py-3 text-left">League</th>
                    <th className="px-6 py-3 text-left">Prediction</th>
                    <th className="px-6 py-3 text-left">Odds</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((pred) => (
                    <tr key={pred._id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {new Date(pred.matchTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        {pred.homeTeam} vs {pred.awayTeam}
                      </td>
                      <td className="px-6 py-4">{pred.league}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {pred.tipValue}
                        </span>
                        {pred.isVip && (
                          <span className="ml-2 px-2 py-1 bg-yellow-400 text-yellow-800 rounded-full text-sm">
                            VIP
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-accent">{pred.odds}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}