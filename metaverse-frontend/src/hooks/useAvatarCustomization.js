import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/env";

const API_URL = `${API_BASE_URL}/api/avatar/me`;

const DEFAULT_AVATAR = {
  presetName: "Default Custom",
  bodySettings: {
    gender: "neutral",
    height: 1.0,
    weight: 1.0,
    muscle: 0.5,
    skinTone: "#fcd1b5",
  },
  faceSettings: {
    faceShape: 0,
    eyeColor: "#000000",
    jaw: 0.5,
    cheeks: 0.5,
  },
  hairSettings: {
    hairstyle: "short",
    hairColor: "#333333",
    facialHair: "none",
  },
  clothing: {
    top: "tshirt",
    bottom: "jeans",
    feet: "sneakers",
  },
  colors: {
    primary: "#ffffff",
    secondary: "#222222",
    accent: "#ff0000",
  },
  equippedItems: [],
};

export const useAvatarCustomization = () => {
  const [config, setConfig] = useState(DEFAULT_AVATAR);
  const [history, setHistory] = useState([DEFAULT_AVATAR]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load from backend
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const res = await axios.get(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.data) {
          const loaded = { ...DEFAULT_AVATAR, ...res.data };
          setConfig(loaded);
          setHistory([loaded]);
        }
      } catch (err) {
        console.error("Failed to load avatar config:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Update specific category (e.g., bodySettings, hairSettings)
  const updateCategory = useCallback((category, key, value) => {
    setConfig((prev) => {
      const newConfig = {
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value,
        },
      };

      // Handle history stack for undo/redo
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newConfig);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      return newConfig;
    });
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setConfig(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setConfig(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  const saveToServer = useCallback(async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(API_URL, config, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return true;
    } catch (err) {
      console.error("Failed to save avatar config:", err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [config]);

  const resetToDefault = useCallback(() => {
    setConfig(DEFAULT_AVATAR);
    setHistory([...history.slice(0, historyIndex + 1), DEFAULT_AVATAR]);
    setHistoryIndex(historyIndex + 1);
  }, [history, historyIndex]);

  return {
    config,
    updateCategory,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    saveToServer,
    resetToDefault,
    isLoading,
    isSaving,
  };
};
