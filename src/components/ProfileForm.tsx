"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ProfileFormProps = {
  profile?: {
    full_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
  } | null;
  user?: {
    email?: string | null;
  } | null;
};

export default function ProfileForm(props: ProfileFormProps) {
  const profile = props.profile ?? null;
  const user = props.user ?? null;

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    const supabase = createClient();

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      setMessage("Not authenticated.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        username: username,
        avatar_url: avatarUrl,
      })
      .eq("id", authUser.id);

    setSaving(false);

    if (error) {
      console.error("Erro ao salvar perfil:", error);
      setMessage("Failed to save profile.");
      return;
    }

    setMessage("Profile saved.");
  }

  return (
    <div className="profile-form">
      <label>Email</label>
      <input value={user?.email ?? ""} readOnly />

      <label>Full name</label>
      <input
        value={fullName ?? ""}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Full name"
      />

      <label>Username</label>
      <input
        value={username ?? ""}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />

      <label>Avatar URL</label>
      <input
        value={avatarUrl ?? ""}
        onChange={(e) => setAvatarUrl(e.target.value)}
        placeholder="Avatar URL"
      />

      <button type="button" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save profile"}
      </button>

      {message && <p className="msg">{message}</p>}

      <style jsx>{`
        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        label {
          font-size: 13px;
          font-weight: 700;
          color: #bfdbfe;
          margin-top: 10px;
        }

        input {
          width: 100%;
          border: 1px solid rgba(147, 197, 253, 0.35);
          border-radius: 12px;
          padding: 12px 14px;
          background: rgba(2, 6, 23, 0.9);
          color: #fff;
          font-size: 15px;
          outline: none;
        }

        input:focus {
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.22);
        }

        input[readonly] {
          opacity: 0.6;
          cursor: not-allowed;
        }

        button {
          margin-top: 18px;
          border: none;
          border-radius: 14px;
          padding: 13px 16px;
          background: linear-gradient(135deg, #2563eb, #38bdf8);
          color: #fff;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .msg {
          margin-top: 10px;
          color: #93c5fd;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
