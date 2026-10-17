import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Trash2, 
  User, 
  Sparkles, 
  Check, 
  Flame, 
  Zap, 
  Heart, 
  Trophy, 
  Crown,
  Dumbbell
} from 'lucide-react';
import { UserProfile } from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (updated: UserProfile) => void;
}

export const PRESET_AVATARS = [
  { id: 'runner', label: 'Runner', bg: 'from-amber-500 to-orange-500', icon: '🏃' },
  { id: 'gym', label: 'Lifter', bg: 'from-blue-600 to-indigo-600', icon: '🏋️' },
  { id: 'cyclist', label: 'Rider', bg: 'from-sky-500 to-cyan-500', icon: '🚴' },
  { id: 'yoga', label: 'Yogi', bg: 'from-teal-500 to-emerald-500', icon: '🧘' },
  { id: 'swimmer', label: 'Swimmer', bg: 'from-blue-500 to-teal-400', icon: '🏊' },
  { id: 'champion', label: 'Champ', bg: 'from-violet-600 to-purple-500', icon: '🏆' },
  { id: 'power', label: 'Power', bg: 'from-rose-500 to-pink-500', icon: '⚡' },
  { id: 'fire', label: 'Beast', bg: 'from-red-600 to-amber-500', icon: '🔥' },
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [name, setName] = useState(profile.name || 'Guest User');
  const [subtitle, setSubtitle] = useState(profile.subtitle || 'Stay active, stay healthy!');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(profile.avatarUrl);
  const [selectedPreset, setSelectedPreset] = useState<string | undefined>(profile.presetAvatar);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    // Limit to 4MB for localStorage comfort
    if (file.size > 4 * 1024 * 1024) {
      setErrorMsg('Image size should be less than 4MB.');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAvatarUrl(result);
      setSelectedPreset(undefined);
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarUrl(undefined);
    setSelectedPreset(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    setAvatarUrl(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Name cannot be empty.');
      return;
    }

    onSave({
      name: name.trim(),
      subtitle: subtitle.trim() || 'Stay active, stay healthy!',
      avatarUrl: avatarUrl || undefined,
      presetAvatar: selectedPreset || undefined,
    });
    onClose();
  };

  const activePresetObj = PRESET_AVATARS.find((p) => p.id === selectedPreset);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm max-h-[92%] bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col space-y-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <User className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Profile</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-400">Personalize your avatar and details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Avatar Preview & Upload Actions */}
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg ring-4 ring-blue-100 dark:ring-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : activePresetObj ? (
                  <div className={`w-full h-full bg-gradient-to-tr ${activePresetObj.bg} flex items-center justify-center text-4xl shadow-inner`}>
                    {activePresetObj.icon}
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center">
                    <User className="w-12 h-12 stroke-[1.8]" />
                  </div>
                )}
              </div>

              {/* Camera Trigger Badge */}
              <button
                type="button"
                id="modal-camera-btn"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 cursor-pointer transition-all"
                title="Upload Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Photo Action Buttons */}
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                id="profile-upload-photo-btn"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
              </button>

              {(avatarUrl || selectedPreset) && (
                <button
                  type="button"
                  id="profile-remove-photo-btn"
                  onClick={handleRemovePhoto}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>

          {/* Preset Avatars Selection */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Or Pick a Fitness Avatar
              </label>
              <span className="text-[10px] text-slate-400">8 sporty styles</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = selectedPreset === preset.id && !avatarUrl;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    id={`preset-avatar-${preset.id}`}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-2 rounded-2xl flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-500 dark:border-blue-400 shadow-xs scale-105'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${preset.bg} flex items-center justify-center text-lg shadow-xs`}>
                      {preset.icon}
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-full">
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Your Name
            </label>
            <input
              id="profile-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Fitness Motto / Subtitle */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Fitness Motto / Bio
            </label>
            <input
              id="profile-subtitle-input"
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Every step counts toward a healthier you"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              id="save-profile-modal-btn"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
