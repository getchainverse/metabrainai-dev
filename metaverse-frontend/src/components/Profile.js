import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import AvatarModel from "./world/avatar/AvatarModel";
import ProfileService from "../services/profile.service";
import { ShowErrorMessage, ShowSuccessMessage } from "./common/Message";
import { DEFAULT_AVATAR_CUSTOMIZATION, mergeCustomization } from "../constants/avatar";
import useAuth from "../hooks/useAuth";

const avatarSets = {
  hairStyle: ["short", "medium", "long", "curly", "braids", "buzz"],
  eyesStyle: ["default", "round", "sharp", "sleepy", "bright"],
  bodyStyle: ["slim", "athletic", "strong", "compact"],
  clothesStyle: ["casual", "hoodie", "jacket", "suit", "armor", "street"],
  accessories: ["glasses", "hat", "headphones", "mask", "earrings", "backpack"],
};

const initialForm = {
  username: "",
  bio: "",
  avatar: "avatar-1",
  role: "user",
  walletAddress: "",
};

const Profile = () => {
  const [form, setForm] = useState(initialForm);
  const [customization, setCustomization] = useState(DEFAULT_AVATAR_CUSTOMIZATION);
  const [errors, setErrors] = useState({});
  const [customErrors, setCustomErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const activeAccessories = useMemo(() => customization.accessories || [], [customization.accessories]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const [profile, avatar] = await Promise.all([
          ProfileService.getProfile(),
          ProfileService.getAvatarCustomization(),
        ]);

        setForm({
          username: profile.username || "",
          bio: profile.bio || "",
          avatar: profile.avatar || "avatar-1",
          role: profile.role || "user",
          walletAddress: profile.walletAddress || "",
        });
        setCustomization(mergeCustomization(avatar));
      } catch (error) {
        ShowErrorMessage(error?.response?.data?.message || "Unable to load profile.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const validate = () => {
    const nextErrors = {};
    const username = form.username.trim();
    const bio = form.bio.trim();

    if (!username) nextErrors.username = "Username is required.";
    else if (username.length < 3) nextErrors.username = "Username must be at least 3 characters.";
    else if (username.length > 32) nextErrors.username = "Username must be 32 characters or less.";
    else if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      nextErrors.username = "Use letters, numbers, dots, underscores, or hyphens.";
    }

    if (bio.length > 280) nextErrors.bio = "Bio must be 280 characters or less.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateCustomization = () => {
    const nextErrors = {};
    if (!/^#([0-9a-fA-F]{3}){1,2}$/.test(customization.hairColor)) nextErrors.hairColor = "Use a hex color.";
    if (!/^#([0-9a-fA-F]{3}){1,2}$/.test(customization.eyesColor)) nextErrors.eyesColor = "Use a hex color.";
    if (!/^#([0-9a-fA-F]{3}){1,2}$/.test(customization.bodyColor)) nextErrors.bodyColor = "Use a hex color.";
    if (!/^#([0-9a-fA-F]{3}){1,2}$/.test(customization.clothesColor)) nextErrors.clothesColor = "Use a hex color.";
    setCustomErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleCustomizationChange = (event) => {
    const { name, value } = event.target;
    setCustomization((current) => ({ ...current, [name]: value }));
    setCustomErrors((current) => ({ ...current, [name]: "" }));
  };

  const toggleAccessory = (accessory) => {
    setCustomization((current) => ({
      ...current,
      accessories: current.accessories.includes(accessory)
        ? current.accessories.filter((item) => item !== accessory)
        : [...current.accessories, accessory],
    }));
  };

  const dispatchAvatarUpdate = (nextCustomization) => {
    localStorage.setItem("avatarCustomization", JSON.stringify(nextCustomization));
    window.dispatchEvent(
      new CustomEvent("avatar:updated", {
        detail: nextCustomization,
      })
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate() || !validateCustomization()) return;

    setIsSaving(true);
    try {
      const [profile, avatar] = await Promise.all([
        ProfileService.updateProfile({
          username: form.username,
          bio: form.bio,
          avatar: form.avatar,
        }),
        ProfileService.updateAvatarCustomization(customization),
      ]);

      setForm({
        username: profile.username,
        bio: profile.bio || "",
        avatar: profile.avatar || "avatar-1",
        role: profile.role || "user",
        walletAddress: profile.walletAddress || "",
      });
      setCustomization(mergeCustomization(avatar));
      dispatchAvatarUpdate(mergeCustomization(avatar));
      ShowSuccessMessage("Profile and avatar saved successfully");
    } catch (error) {
      const responseErrors = error?.response?.data?.errors || {};
      setErrors(responseErrors);
      setCustomErrors(responseErrors);
      ShowErrorMessage(error?.response?.data?.message || "Unable to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-[520px] max-w-5xl items-center justify-center px-6 text-[#183442]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-[#0F7BDE]" />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#090A0F] text-slate-100 py-10 px-4 sm:px-6">
      <main className="mx-auto max-w-6xl">
        <div className="mb-10 border-b border-white/5 pb-6">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">Profile</h1>
          <p className="mt-2 text-sm text-slate-400">
            Manage your digital identity and customize your 3D Avatar for the Metaverse.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="grid gap-8">
            {/* Identity Card */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-md shadow-xl">
              <h2 className="text-xl font-bold tracking-wide text-cyan-400">Identity</h2>
              <div className="mt-6 grid gap-6">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Username</span>
                  <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    className="min-h-[46px] rounded-xl border border-white/10 bg-slate-950/60 px-4 text-slate-100 outline-none focus:border-cyan-500 transition-colors"
                    maxLength={32}
                  />
                  {errors.username && <span className="text-xs text-red-400 mt-1">{errors.username}</span>}
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Wallet Address</span>
                  <input
                    value={form.walletAddress}
                    readOnly
                    className="min-h-[46px] rounded-xl border border-white/5 bg-slate-950/20 px-4 text-slate-400 cursor-not-allowed select-all"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Role</span>
                  <input
                    value={form.role}
                    readOnly
                    className="min-h-[46px] rounded-xl border border-white/5 bg-slate-950/20 px-4 text-slate-400 cursor-not-allowed capitalize"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Bio</span>
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    rows={4}
                    maxLength={280}
                    className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none focus:border-cyan-500 transition-colors"
                  />
                  <div className="flex justify-between mt-1 text-xs text-slate-500">
                    {errors.bio ? <span className="text-red-400">{errors.bio}</span> : <span />}
                    <span>{form.bio.length}/280</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Avatar Configuration Card */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-md shadow-xl">
              <h2 className="text-xl font-bold tracking-wide text-cyan-400">Avatar Configuration</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {["hairStyle", "eyesStyle", "bodyStyle", "clothesStyle"].map((field) => (
                  <label key={field} className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{field.replace("Style", " Style")}</span>
                    <select
                      name={field}
                      value={customization[field]}
                      onChange={handleCustomizationChange}
                      className="min-h-[46px] rounded-xl border border-white/10 bg-slate-950/60 px-4 text-slate-100 outline-none focus:border-cyan-500 transition-colors capitalize"
                    >
                      {avatarSets[field].map((option) => (
                        <option key={option} value={option} className="bg-slate-950 text-slate-100">{option}</option>
                      ))}
                    </select>
                  </label>
                ))}
                {["hairColor", "eyesColor", "bodyColor", "clothesColor"].map((field) => (
                  <label key={field} className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{field.replace("Color", " Color")}</span>
                    <div className="flex gap-3 items-center">
                      <input
                        name={field}
                        type="color"
                        value={customization[field]}
                        onChange={handleCustomizationChange}
                        className="h-11 w-20 rounded-xl border border-white/10 bg-slate-950/60 p-1 cursor-pointer"
                      />
                      <input
                        name={field}
                        type="text"
                        value={customization[field]}
                        onChange={handleCustomizationChange}
                        className="min-h-[44px] flex-1 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-slate-100 outline-none focus:border-cyan-500 text-xs font-mono uppercase"
                      />
                    </div>
                    {customErrors[field] && <span className="text-xs text-red-400">{customErrors[field]}</span>}
                  </label>
                ))}
              </div>
              <div className="mt-8 border-t border-white/5 pt-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Accessories</span>
                <div className="mt-4 flex flex-wrap gap-2">
                  {avatarSets.accessories.map((accessory) => {
                    const active = activeAccessories.includes(accessory);
                    return (
                      <button
                        key={accessory}
                        type="button"
                        onClick={() => toggleAccessory(accessory)}
                        className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                          active
                            ? "border-cyan-500 bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                            : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                        }`}
                      >
                        {accessory}
                      </button>
                    );
                  })}
                </div>
                {customErrors.accessories && <p className="mt-2 text-xs text-red-400">{customErrors.accessories}</p>}
              </div>
            </div>
          </section>

          <aside className="grid gap-8 content-start">
            {/* 3D Preview Card */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-md shadow-xl flex flex-col">
              <h2 className="text-xl font-bold tracking-wide text-cyan-400">Live Preview</h2>
              <div className="mt-5 flex min-h-[400px] items-center justify-center rounded-2xl border border-white/10 bg-[#0B0B0E] relative overflow-hidden shadow-inner">
                <Canvas camera={{ position: [0, 1.0, 3.0], fov: 45 }}>
                  <color attach="background" args={["#0B0B0E"]} />
                  <ambientLight intensity={0.9} />
                  <directionalLight position={[3, 5, 2]} intensity={1.8} castShadow />
                  <group position={[0, -0.85, 0]}>
                    <AvatarModel customization={customization} />
                  </group>
                  <OrbitControls enableZoom={true} enablePan={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.8} />
                </Canvas>
                <div className="absolute bottom-4 inset-x-0 text-center pointer-events-none">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 bg-[#0B0B0E]/80 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur">
                    Live 3D Render
                  </span>
                </div>
              </div>
            </div>

            {/* Wallet & Save Card */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-md shadow-xl">
              <h2 className="text-xl font-bold tracking-wide text-cyan-400">Save Changes</h2>
              <p className="mt-3 text-xs text-slate-400 leading-5">
                All settings are stored directly in the database. Updating will refresh your character instantly.
              </p>
              <button
                type="submit"
                disabled={isSaving}
                className="mt-6 w-full min-h-[48px] rounded-xl bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50 transition shadow-[0_0_20px_rgba(34,211,238,0.2)]"
              >
                {isSaving ? "Saving..." : "Apply Configuration"}
              </button>
            </div>
          </aside>
        </form>
      </main>
    </div>
  );
};

export default Profile;
