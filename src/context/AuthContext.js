import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@rebirth-prosthetics/auth-session-v1';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const storedUser = await AsyncStorage.getItem(SESSION_KEY);
        if (storedUser && mounted) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.warn('Não foi possível restaurar a sessão:', error);
        await AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
      } finally {
        if (mounted) setIsAuthReady(true);
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(async (authenticatedUser) => {
    if (!authenticatedUser?.id_usuario) {
      throw new Error('Os dados recebidos do login são inválidos.');
    }

    setUser(authenticatedUser);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(authenticatedUser));
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(SESSION_KEY);
  }, []);

  const updateUser = useCallback(async (nextUserData) => {
    setUser((currentUser) => {
      const updatedUser = {
        ...currentUser,
        ...nextUserData,
      };

      AsyncStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser)).catch((error) => {
        console.warn('Não foi possível atualizar a sessão:', error);
      });

      return updatedUser;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAuthReady,
      signIn,
      signOut,
      updateUser,
    }),
    [isAuthReady, signIn, signOut, updateUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth precisa estar dentro de AuthProvider.');
  }

  return context;
}
