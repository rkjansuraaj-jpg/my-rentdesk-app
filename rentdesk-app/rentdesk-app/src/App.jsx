import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Connect to your database using the keys from the .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AppContext = createContext();

export function AppProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [machines, setMachines] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all your data from Supabase as soon as the app opens
  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, mRes, rRes, payRes, maintRes] = await Promise.all([
        supabase.from("products").select("*"),
        supabase.from("machines").select("*"),
        supabase.from("rentals").select("*"),
        supabase.from("payments").select("*"),
        supabase.from("maintenance").select("*"),
      ]);

      if (pRes.data) setProducts(pRes.data);
      if (mRes.data) setMachines(mRes.data);
      if (rRes.data) setRentals(rRes.data);
      if (payRes.data) setPayments(payRes.data);
      if (mRes.data) setMaintenance(maintRes.data);
    } catch (error) {
      console.error("Error loading data from database:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper function to insert data into any database table
  const addData = async (tableName, itemData, stateUpdater) => {
    const { data, error } = await supabase.from(tableName).insert([itemData]).select();
    if (!error && data) {
      stateUpdater((prev) => [...prev, data[0]]);
      return data[0];
    }
    if (error) console.error(`Error adding to ${tableName}:`, error);
  };

  return (
    <AppContext.Provider
      value={{
        products,
        machines,
        rentals,
        payments,
        maintenance,
        loading,
        refreshData: fetchData,
        addProduct: (product) => addData("products", product, setProducts),
        addMachine: (machine) => addData("machines", machine, setMachines),
        startRental: (rental) => addData("rentals", rental, setRentals),
        addPayment: (payment) => addData("payments", payment, setPayments),
        addMaintenance: (record) => addData("maintenance", record, setMaintenance),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);