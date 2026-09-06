import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { showToast } = useToast();
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('shop_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (user && user.token) {
      localStorage.setItem('shop_user', JSON.stringify(user));
      fetchUserOrders(user.email, user.token);
    } else {
      localStorage.removeItem('shop_user');
      setOrders([]);
    }
  }, [user]);

  const sendOtpCode = async (email, name = '', isRegister = false) => {
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, isRegister })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          data.devCode ? `Code de démonstration: ${data.devCode}` : 'Code envoyé par e-mail !',
          'info',
          'Code de Sécurité'
        );
        return { success: true, devCode: data.devCode };
      } else {
        showToast(data.error || 'Erreur lors de l\'envoi du code', 'error');
        return { success: false, error: data.error };
      }
    } catch (err) {
      showToast('Impossible de contacter le serveur', 'error');
      return { success: false, error: err.message };
    }
  };

  const verifyOtpCode = async (email, code) => {
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setUser(data.user);
        if (data.user.token) {
          fetchUserOrders(data.user.email, data.user.token);
        }
        showToast(`Bienvenue, ${data.user.name || data.user.email} !`, 'success', 'Connexion Réussie');
        return { success: true, user: data.user };
      } else {
        showToast(data.error || 'Code invalide ou expiré', 'error');
        return { success: false, error: data.error };
      }
    } catch (err) {
      showToast('Erreur lors de la vérification du code', 'error');
      return { success: false, error: err.message };
    }
  };

  const fetchUserOrders = async (email, customToken = null) => {
    const tokenToUse = customToken || user?.token;
    if (!email || !tokenToUse) return;
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/user/orders?email=${encodeURIComponent(email)}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-token': tokenToUse
        }
      });
      const data = await res.json();
      if (res.ok && data.success && data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Erreur chargement commandes:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const updateProfile = async (profileData) => {
    if (!user || !user.token) return;
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-token': user.token
        },
        body: JSON.stringify({
          email: user.email,
          ...profileData
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setUser({ ...user, ...data.user });
        showToast('Vos informations ont été mises à jour avec succès', 'success', 'Profil Client');
        return { success: true };
      } else {
        showToast(data.error || 'Erreur lors de la mise à jour', 'error');
        return { success: false };
      }
    } catch {
      showToast('Erreur de communication avec le serveur', 'error');
      return { success: false };
    }
  };

  const deleteAccount = async () => {
    if (!user || !user.token) return { success: false, error: 'Non authentifié' };
    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-token': user.token
        },
        body: JSON.stringify({ email: user.email })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        logout();
        showToast('Votre compte a été supprimé et archivé en conformité RGPD.', 'info', 'Compte Supprimé');
        return { success: true };
      } else {
        showToast(data.error || 'Impossible de supprimer le compte', 'error', 'Suppression Bloquée');
        return { success: false, error: data.error, hasActiveOrders: data.hasActiveOrders };
      }
    } catch (err) {
      showToast('Erreur de communication avec le serveur', 'error');
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    showToast('Vous avez été déconnecté avec succès', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        orders,
        loadingOrders,
        fetchUserOrders,
        sendOtpCode,
        verifyOtpCode,
        updateProfile,
        deleteAccount,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
