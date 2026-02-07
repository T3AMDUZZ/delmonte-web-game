
import React, { useState } from 'react';

interface Props {
  onLogin: (nickname: string) => void;
}

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [nickname, setNickname] = useState<string>('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (nickname.trim()) {
      onLogin(nickname.trim());
    }
  };

  return (
    <div className="absolute inset-0 bg-[#FEE500] flex flex-col items-center justify-center p-8 text-[#3C1E1E]">
      <div className="w-20 h-20 bg-[#3C1E1E] rounded-3xl flex items-center justify-center mb-6 shadow-md">
        <span className="text-3xl text-[#FEE500] font-bold">K</span>
      </div>
      <h2 className="text-xl font-bold mb-8">KAKAO LOGIN</h2>
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div>
          <label className="block text-[10px] uppercase mb-2 font-bold opacity-70">Your Nickname</label>
          <input 
            type="text" 
            value={nickname}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNickname(e.target.value)}
            className="w-full bg-white/50 border-2 border-[#3C1E1E] px-4 py-3 rounded-xl focus:outline-none placeholder-[#3C1E1E]/30"
            placeholder="Enter nickname..."
            maxLength={20}
          />
        </div>
        <button 
          type="submit"
          className="w-full bg-[#3C1E1E] text-[#FEE500] py-4 rounded-xl font-bold active:scale-95 transition-transform shadow-lg"
        >
          START GAME
        </button>
      </form>
      <p className="mt-8 text-[8px] text-center uppercase tracking-widest opacity-50">
        One entry per account. Weekly resets.
      </p>
    </div>
  );
};

export default LoginScreen;
