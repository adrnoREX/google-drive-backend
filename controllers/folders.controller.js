import { supabase } from "../config/supabaseClient.js";

// Upload or create folders
export const uploadfolder = async (req, res) => {
  try {
    const { name, parent_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const { error: insertError } = await supabase
      .from("folders")
      .insert([{ name, parent_id }])
      .select();

    if (insertError) {
      console.error("Error inserting into public.folders:", insertError);
      return res
        .status(500)
        .json({ error: "Failed to insert into public.folders" });
    }

    res.json({
      message: "Folder inserted successfully",
      profile: { name, parent_id },
    });
  } catch (error) {
    console.error("Error adding folders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get files in a folder
export const getfiles = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("files")
      .select("id, display_name, mime_type, size, created_at")
      .eq("folder_id", id)
      .eq("is_deleted", false);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Error fetching files:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// List of folders
export const list = async (req, res) => {
  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

// Make a Copy of Folder
export const copy = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: folder, error } = await supabase
      .from("folders")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !folder) return res.status(404).json({ error: "Folder not found" });

    const { data: newFolder, error: insertErr } = await supabase
      .from("folders")
      .insert([
        {
          name: `${folder.name} (Copy)`,
          parent_id: folder.parent_id,
          is_deleted: false,
        },
      ])
      .select()
      .single();

    if (insertErr) throw insertErr;

    res.json({ folder: newFolder });
  } catch (err) {
    console.error("Error copying folder:", err);
    res.status(500).json({ error: "Failed to copy folder" });
  }
};

// Soft Delete (Move to Trash)
export const del = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("folders")
      .update({ is_deleted: true })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: "Folder not found" });
    }

    res.json({ folder: data });
  } catch (err) {
    console.error("Error deleting folder:", err.message);
    res.status(500).json({ error: "Failed to move folder to trash" });
  }
};

// Rename Folder
export const rename = async (req, res) => {
  const { id } = req.params;
  const { newName } = req.body;

  try {
    const { data, error } = await supabase
      .from("folders")
      .update({ name: newName })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({ folder: data });
  } catch (err) {
    console.error("Error renaming folder:", err);
    res.status(500).json({ error: "Failed to rename folder" });
  }
};

// Fetch soft-deleted folders
export const fetch = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .eq("is_deleted", true);

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Error fetching deleted folders:", err);
    res.status(500).json({ error: "Failed to fetch trash folders" });
  }
};

// // Empty Trash for Folders (Hard Delete)
//  async (req, res) => {
//   try {
//     const { error } = await supabase
//       .from("folders")
//       .delete()
//       .eq("is_deleted", true); 

//     if (error) throw error;

//     res.json({ message: "All trashed folders deleted permanently" });
//   } catch (err) {
//     console.error("Error emptying folder trash:", err);
//     res.status(500).json({ error: "Failed to empty folder trash" });
//   }
// });


// Restore Folder from Trash
export const restore = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("folders")
      .update({ is_deleted: false })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({ folder: data });
  } catch (err) {
    console.error("Error restoring folder:", err);
    res.status(500).json({ error: "Failed to restore folder" });
  }
};

// Empty Trash for Folders (Hard Delete)
export const empty = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("folders")
      .delete()
      .eq("is_deleted", true)
      .select("*"); 

    if (error) throw error;

    res.json({ 
      message: "All trashed folders deleted permanently", 
      deletedCount: data ? data.length : 0 
    });
  } catch (err) {
    console.error("Error emptying folder trash:", err);
    res.status(500).json({ error: "Failed to empty folder trash" });
  }
};