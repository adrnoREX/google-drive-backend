import { supabase } from "../config/supabaseClient.js";

export const storage = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("files")
      .select("size"); 
    if (error) throw error;

    const totalUsed = data.reduce((sum, file) => sum + (file.size || 0), 0);
    const totalAvailable = 5 * 1024 * 1024 * 1024;

    res.json({ used: totalUsed, total: totalAvailable });
  } catch (err) {
    console.error("Error fetching storage info:", err);
    res.status(500).json({ error: "Failed to fetch storage info" });
  }
};