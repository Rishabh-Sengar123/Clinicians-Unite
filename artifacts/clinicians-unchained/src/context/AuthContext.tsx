import React, { createContext, useContext, useState, useEffect } from "react";

interface PatientData {
  id: number;
  name: string;
  email: string;
  age: number;
  medicalHistory: string | null;
  insurancePlanId: number | null;
  createdAt: string;
  insurancePlan: {
    id: number;
    planName: string;
    coverageDetails: string;
    companyId: number;
  } | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  patient: PatientData | null;
  token: string | null;
  login: (token: string, patient: PatientData) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("cu_token"));
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      localStorage.removeItem("cu_token");
      setPatient(null);
      setIsLoading(false);
      return;
    }

    localStorage.setItem("cu_token", token);

    const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    fetch(`${baseUrl}/api/patients/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) return res.json() as Promise<PatientData>;
        throw new Error("Invalid token");
      })
      .then((data) => setPatient(data))
      .catch(() => {
        setToken(null);
        setPatient(null);
        localStorage.removeItem("cu_token");
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const login = (newToken: string, newPatient: PatientData) => {
    localStorage.setItem("cu_token", newToken);
    setToken(newToken);
    setPatient(newPatient);
  };

  const logout = () => {
    localStorage.removeItem("cu_token");
    setToken(null);
    setPatient(null);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated: !!token && !!patient, patient, token, login, logout }}
    >
      {isLoading ? null : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export type { PatientData };
