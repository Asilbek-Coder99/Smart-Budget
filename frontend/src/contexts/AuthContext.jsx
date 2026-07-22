import { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import { authService } from '../api/services.js';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

const initialState = {
  user:        null,
  accessToken: localStorage.getItem('accessToken'),
  isLoading:   true,
  isAuth:      false,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isAuth: true, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user:        action.payload.user,
        accessToken: action.payload.accessToken,
        isAuth:      true,
        isLoading:   false,
      };
    case 'LOGOUT':
      return { user: null, accessToken: null, isLoading: false, isAuth: false };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Fetch current user on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    authService
      .getMe()
      .then(({ data }) => dispatch({ type: 'SET_USER', payload: data.data }))
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        dispatch({ type: 'LOGOUT' });
      });
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await authService.login(credentials);
    const { user, accessToken, refreshToken } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    dispatch({ type: 'LOGIN_SUCCESS', payload: { user, accessToken } });
    toast.success(`Welcome back, ${user.firstName}! 👋`);
    return user;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authService.register(formData);
    const { user, accessToken, refreshToken } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    dispatch({ type: 'LOGIN_SUCCESS', payload: { user, accessToken } });
    toast.success(`Welcome to Smart Budget, ${user.firstName}! 🎉`);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  }, []);

  const updateUser = useCallback((updates) => {
    dispatch({ type: 'UPDATE_USER', payload: updates });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
