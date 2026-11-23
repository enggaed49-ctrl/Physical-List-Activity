import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  Trash2,
  User,
  Check,
} from 'lucide-react';
import { UserProfile } from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (updated: UserProfile) => void | Promise<void>;
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

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);
const MAX_UPLOAD_BYTES = 1.5 * 1024 * 1024; // 1.5 MB raw (~2 MB base64, within server 2.5 MB limit)

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [name, setName] = useState(profile.name || '');
  const [subtitle, setSubtitle] = useState(profile.subtitle || 'Stay active, stay healthy!');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(profile.avatarUrl);
  const [selectedPreset, setSelectedPreset] = useState<string | undefined>(profile.presetAvatar);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(profile.name || '');
      setSubtitle(profile.subtitle || 'Stay active, stay healthy!');
      setAvatarUrl(profile.avatarUrl);
      setSelectedPreset(profile.presetAvatar);
      setErrorMsg(null);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())) {
      setErrorMsg('Please select a PNG, JPG, WebP, or GIF image.');
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setErrorMsg('Image size must be 1.5 MB or less.');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Display name cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        subtitle: subtitle.trim() || 'Stay active, stay healthy!',
        avatarUrl: avatarUrl || undefined,
        presetAvatar: selectedPreset || undefined,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const activePresetObj = PRESET_AVATARS.find((p) => p.id === selectedPreset);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-md max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col space-y-4 overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <User className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Profile</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Personalize your avatar and details</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col items-center justify-center pt-1">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden shadow-md ring-4 ring-blue-50 dark:ring-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : activePresetObj ? (
                  <div className={`w-full h-full bg-gradient-to-tr ${activePresetObj.bg} flex items-center justify-center text-4xl`}>
                    {activePresetObj.icon}
                  </div>
                ) : (
                  <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center">
                    <User className="w-11 h-11 stroke-[1.8]" />
                  </div>
                )}
              </div>

              <button
                type="button"
                id="modal-camera-btn"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 cursor-pointer transition-colors"
                title="Upload Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
            />

            <div className="flex items-center gap-2 mt-4">
              <button
                type="button"
                id="profile-upload-photo-btn"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
              </button>

              {(avatarUrl || selectedPreset) && (
                <button
                  type="button"
                  id="profile-remove-photo-btn"
                  onClick={handleRemovePhoto}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Or Pick a Fitness Avatar
              </label>
              <span className="text-xs text-slate-400">8 styles</span>
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
                    className={`min-h-[68px] p-2 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 dark:border-blue-400'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${preset.bg} flex items-center justify-center text-base`}>
                      {preset.icon}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-full">
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-name-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Your Name
            </label>
            <input
              id="profile-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-subtitle-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Fitness Motto / Bio
            </label>
            <input
              id="profile-subtitle-input"
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Every step counts toward a healthier you"
              className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              id="save-profile-modal-btn"
              disabled={isSaving}
              className="w-full min-h-[48px] py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
