import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

  const [taUser, setTAUser] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const stored = localStorage.getItem('current_ta_user');

    if (stored) {

      setTAUser(JSON.parse(stored));

    }

    setLoading(false);

  }, []);

  const login = (user) => {

    localStorage.setItem('current_ta_user', JSON.stringify(user));

    setTAUser(user);

  };

  const logout = () => {

    localStorage.removeItem('current_ta_user');

    setTAUser(null);

  };

  return (

    <AuthContext.Provider value={{ taUser, loading, login, logout }}>

      {children}

    </AuthContext.Provider>

  );

}