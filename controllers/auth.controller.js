import { supabase } from "../config/supabaseClient.js";
import { generateToken, verifyToken } from "../middleware/jwt.js";

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .limit(1)
      .single();

    if (error || !data) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken({ id: data.id, email: data.email });

    res.cookie("token", token, {
      httpOnly: true, 
      secure: false, 
      sameSite: "Strict",
      maxAge: 3600000, 
    });

    res.json({ message: "Logged in successfully" });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Logout
export const logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
};

export const me = (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: "Invalid token" });
  }

  res.json({ user: decoded });
};

// Signup
export const signup = async (req, res) => {
  try {
    const { name, email, password, phnumber, dob } = req.body;
    if (!name || !email || !password || !phnumber || !dob) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const { data, error: insertError } = await supabase
      .from("users")
      .insert([{ name, email, password, phnumber, dob }])
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting into public.users:", insertError);
      return res
        .status(500)
        .json({ error: "Failed to insert into public.users" });
    }

    const token = generateToken({ id: data.id, email: data.email });

    res.cookie("token", token, {
      httpOnly: true, 
      secure: false, 
      sameSite: "Strict",
      maxAge: 3600000, 
    });

    res.json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};