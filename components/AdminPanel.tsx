
import React, { useEffect, useState } from 'react';
import { supabaseService } from '../services/supabase';
import { ScoreEntry } from '../types';
import { GAME_CONFIG } from '../constants';

interface Props {
  onBack: () => void;
  sfxVolume: number;
  isSfxMuted: boolean;
}

interface AnalyticsData {
  instagram_follow: number;
  kakao_share: number;
}

const AdminPanel: React.FC<Props> = ({ onBack, sfxVolume, isSfxMuted }) => {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({ instagram_follow: 0, kakao_share: 0 });
  const [password, setPassword] = useState<string>('');
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  const playClickSfx = () => {
    if (isSfxMuted) return;
    const audio = new Audio(GAME_CONFIG.ASSETS.AUDIO.CLICK);
    audio.volume = sfxVolume;
    audio.play().catch(() => {});
  };

  useEffect(() => {
    if (isAuthorized) {
      supabaseService.getAllScoresForAdmin().then(setScores);
      supabaseService.getAnalytics().then(setAnalytics);
    }
  }, [isAuthorized]);

  const handleLogin = () => {
    playClickSfx();
    if (password === GAME_CONFIG.ADMIN_SECRET) {
      setIsAuthorized(true);
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  const handleReset = async () => {
    playClickSfx();
    if (window.confirm('모든 랭킹 및 집계 데이터를 초기화하시겠습니까?')) {
      await supabaseService.resetScores();
      setScores([]);
      setAnalytics({ instagram_follow: 0, kakao_share: 0 });
    }
  };

  if (!isAuthorized) {
    return (
      <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-8 z-50">
        <h2 className="text-white pixel-font mb-4">ADMIN ACCESS</h2>
        <input 
          type="password" 
          value={password} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          className="bg-neutral-800 text-white p-3 rounded mb-4 text-center outline-none"
          placeholder="Secret Code"
        />
        <div className="flex gap-2">
          <button onClick={handleLogin} onMouseEnter={() => playClickSfx()} className="bg-green-600 text-white px-6 py-2 rounded text-xs">Enter</button>
          <button onClick={onBack} onMouseEnter={() => playClickSfx()} className="bg-neutral-600 text-white px-6 py-2 rounded text-xs">Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-neutral-900 text-white p-6 flex flex-col z-50 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-lg">관리자 모드</h2>
        <button onClick={onBack} onMouseEnter={() => playClickSfx()} className="bg-neutral-700 px-3 py-1 rounded text-xs">닫기</button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-neutral-800 p-4 rounded-xl text-center border border-white/5">
          <div className="text-[10px] opacity-50 mb-1 uppercase tracking-tighter">인스타 팔로우 클릭</div>
          <div className="text-2xl font-bold text-pink-400">{analytics.instagram_follow}</div>
        </div>
        <div className="bg-neutral-800 p-4 rounded-xl text-center border border-white/5">
          <div className="text-[10px] opacity-50 mb-1 uppercase tracking-tighter">카카오 공유 클릭</div>
          <div className="text-2xl font-bold text-yellow-400">{analytics.kakao_share}</div>
        </div>
      </div>

      <button onClick={handleReset} onMouseEnter={() => playClickSfx()} className="w-full bg-red-600 py-3 rounded mb-6 font-bold text-sm">데이터 전체 초기화</button>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs text-left">
          <thead className="border-b border-neutral-700 opacity-50">
            <tr>
              <th className="py-2">닉네임 (실제)</th>
              <th className="py-2 text-right">점수</th>
            </tr>
          </thead>
          <tbody>
            {scores.map(s => (
              <tr key={s.id} className="border-b border-neutral-800/50">
                <td className="py-3">
                  {s.nickname}
                  <div className="text-[8px] opacity-30">{new Date(s.created_at).toLocaleString()}</div>
                </td>
                <td className="py-3 text-right text-green-400 font-mono">{s.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanel;
