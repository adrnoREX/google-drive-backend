import { supabase } from "../config/supabaseClient.js";

// Secure
export const secure = (req, res) => {
  res.json({ message: "You are authorized!", user: req.user });
};

// Read all users
export const read = async (req, res) => {
  const { data, error } = await supabase.from("users").select("*");
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

// Update any user
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, phnumber, dob } = req.body;

    if (!name || !email || !password || !phnumber || !dob) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const { data, error } = await supabase
      .from("users")
      .update({ name, email, password, phnumber, dob })
      .eq("id", id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "User updated successfully", data });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// delete any user
export const del = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase.from("users").delete().eq("id", id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "User deleted successfully", data });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};